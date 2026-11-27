import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import dotenv from 'dotenv';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const PORT = 3000;
const ROOT_DIR = process.cwd();
const UPLOADS_BASE_DIR = path.resolve(ROOT_DIR, 'uploads');
fs.mkdirSync(UPLOADS_BASE_DIR, { recursive: true });

// Load Firebase projectId safely from firebase-applet-config.json
let firebaseProjectId = '';
try {
  const configPath = path.resolve(ROOT_DIR, 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if (raw?.projectId && raw.projectId !== 'remixed-project-id') {
      firebaseProjectId = raw.projectId;
    }
  }
} catch (err) {
  console.error('Failed to read firebase-applet-config.json:', err);
}

const adminApp = firebaseProjectId
  ? getApps().length
    ? getApp()
    : initializeApp({ projectId: firebaseProjectId })
  : null;

function isConfiguredAdminEmail(email?: string | null, verified?: boolean): boolean {
  if (!email || !verified) return false;
  const adminEmail = (process.env.ADMIN_EMAIL || 'g03608160@gmail.com').trim().toLowerCase();
  return email.trim().toLowerCase() === adminEmail;
}

interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken;
  isAdmin?: boolean;
}

async function authenticateBearer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!adminApp) {
    return res.status(503).json({ error: 'Authentication service not configured.' });
  }
  const authHeader = req.headers.authorization || '';
  const queryToken = typeof req.query.token === 'string' ? req.query.token : '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : queryToken;

  if (!token) {
    return res.status(401).json({ error: 'Missing authentication token.' });
  }
  try {
    const decoded = await getAuth(adminApp).verifyIdToken(token);
    req.user = decoded;
    req.isAdmin = isConfiguredAdminEmail(decoded.email, decoded.email_verified);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

// Simple in-memory sliding-window rate limiter
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip || 'unknown'}:${req.path}`;
    const now = Date.now();
    const bucket = rateBuckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (bucket.count >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests. Please try again shortly.' });
    }
    bucket.count += 1;
    return next();
  };
}

// Magic-byte verification for uploaded images, videos, and PDFs
function validateMagicBytes(buffer: Buffer, mimetype: string): { valid: boolean; ext: string } {
  if (buffer.length < 12) return { valid: false, ext: '' };
  const hex = buffer.subarray(0, 12).toString('hex').toLowerCase();

  // JPEG: FF D8 FF
  if (hex.startsWith('ffd8ff') && ['image/jpeg', 'image/jpg'].includes(mimetype)) {
    return { valid: true, ext: '.jpg' };
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (hex.startsWith('89504e470d0a1a0a') && mimetype === 'image/png') {
    return { valid: true, ext: '.png' };
  }
  // WEBP: RIFF....WEBP
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP' &&
    mimetype === 'image/webp'
  ) {
    return { valid: true, ext: '.webp' };
  }
  // PDF: %PDF
  if (buffer.subarray(0, 4).toString('ascii') === '%PDF' && mimetype === 'application/pdf') {
    return { valid: true, ext: '.pdf' };
  }
  // MP4 / MOV: ftyp box at offset 4
  if (
    buffer.subarray(4, 8).toString('ascii') === 'ftyp' &&
    ['video/mp4', 'video/quicktime'].includes(mimetype)
  ) {
    return { valid: true, ext: mimetype === 'video/quicktime' ? '.mov' : '.mp4' };
  }
  // WebM: 1A 45 DF A3
  if (hex.startsWith('1a45dfa3') && mimetype === 'video/webm') {
    return { valid: true, ext: '.webm' };
  }
  return { valid: false, ext: '' };
}

const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 35 * 1024 * 1024, // 35 MB max per file
    files: 6,
  },
});

function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 80);
}

async function startServer() {
  const app = express();
  app.set('trust proxy', true);

  // Security headers (preserving iframe compatibility for preview)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  app.use(express.json({ limit: '2mb' }));

  // ---------------------------------------------------------------------------
  // API v1 Routes
  // ---------------------------------------------------------------------------
  app.get('/api/v1/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'SRI EDITING STUDIO API',
      version: 'v1',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/v1/auth/me', authenticateBearer, (req: AuthenticatedRequest, res) => {
    res.json({
      uid: req.user?.uid,
      email: req.user?.email || null,
      emailVerified: !!req.user?.email_verified,
      isAdmin: !!req.isAdmin,
    });
  });

  app.post('/api/v1/verify-turnstile', rateLimit(15, 60_000), async (req, res) => {
    const token = typeof req.body?.token === 'string' ? req.body.token : '';
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      return res.json({ verified: true, mode: 'unconfigured' });
    }
    if (!token) {
      return res.status(400).json({ verified: false, error: 'Missing Turnstile challenge token.' });
    }
    try {
      const form = new URLSearchParams({ secret, response: token });
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: form,
      });
      const result = (await verifyRes.json()) as { success?: boolean };
      if (!result.success) {
        return res.status(403).json({ verified: false, error: 'Bot verification failed.' });
      }
      return res.json({ verified: true, mode: 'cloudflare' });
    } catch {
      return res.status(502).json({ verified: false, error: 'Verification service unavailable.' });
    }
  });

  // Authenticated private file upload endpoint
  app.post(
    '/api/v1/uploads',
    rateLimit(25, 60_000),
    authenticateBearer,
    uploadMiddleware.array('files', 6),
    (req: AuthenticatedRequest, res) => {
      const uid = sanitizeId(req.user?.uid || '');
      if (!uid) {
        return res.status(401).json({ error: 'Authenticated user required.' });
      }
      if (!req.user?.email_verified) {
        return res.status(403).json({ error: 'Please verify your email before uploading files.' });
      }

      const rawScope = typeof req.body?.scope === 'string' ? req.body.scope : 'general';
      const scope = sanitizeId(rawScope) || 'general';

      // Only admin may upload into 'portfolio' or 'banners' scopes
      if ((scope === 'portfolio' || scope === 'banners') && !req.isAdmin) {
        return res.status(403).json({ error: 'Only the studio administrator can upload portfolio or banner media.' });
      }

      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded.' });
      }

      const targetDir = path.resolve(UPLOADS_BASE_DIR, uid, scope);
      if (!targetDir.startsWith(UPLOADS_BASE_DIR + path.sep)) {
        return res.status(400).json({ error: 'Invalid upload destination.' });
      }
      fs.mkdirSync(targetDir, { recursive: true });

      const uploaded: Array<{ url: string; originalName: string; size: number; mimeType: string }> = [];

      for (const file of files) {
        const check = validateMagicBytes(file.buffer, file.mimetype);
        if (!check.valid) {
          return res.status(400).json({
            error: `Unsupported or invalid file content for "${file.originalname}". Allowed formats: JPG, PNG, WEBP, MP4, MOV, WEBM, PDF.`,
          });
        }
        const safeName = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${check.ext}`;
        const destPath = path.resolve(targetDir, safeName);
        if (!destPath.startsWith(targetDir + path.sep)) {
          return res.status(400).json({ error: 'Invalid file path.' });
        }
        fs.writeFileSync(destPath, file.buffer);
        uploaded.push({
          url: `/api/v1/uploads/${uid}/${scope}/${safeName}`,
          originalName: file.originalname.slice(0, 120),
          size: file.size,
          mimeType: file.mimetype,
        });
      }

      return res.status(201).json({ files: uploaded });
    }
  );

  // Authenticated private media retrieval (public only for portfolio/banners/reviews)
  app.get('/api/v1/uploads/:ownerUid/:scope/:filename', async (req: AuthenticatedRequest, res) => {
    const ownerUid = sanitizeId(req.params.ownerUid || '');
    const scope = sanitizeId(req.params.scope || '');
    const filename = path.basename(req.params.filename || '');

    if (!ownerUid || !scope || !filename || !/^[a-zA-Z0-9_.\-]+$/.test(filename)) {
      return res.status(400).json({ error: 'Invalid media identifier.' });
    }

    const isPublicScope = scope === 'portfolio' || scope === 'banners' || scope === 'reviews';
    if (!isPublicScope) {
      if (!adminApp) {
        return res.status(503).json({ error: 'Authentication service not configured.' });
      }
      const authHeader = req.headers.authorization || '';
      const queryToken = typeof req.query.token === 'string' ? req.query.token : '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : queryToken;
      if (!token) {
        return res.status(401).json({ error: 'Authentication required to view private project media.' });
      }
      try {
        const decoded = await getAuth(adminApp).verifyIdToken(token);
        const isAdmin = isConfiguredAdminEmail(decoded.email, decoded.email_verified);
        if (decoded.uid !== ownerUid && !isAdmin) {
          return res.status(403).json({ error: 'You do not have permission to view this private file.' });
        }
      } catch {
        return res.status(401).json({ error: 'Invalid authentication token.' });
      }
    }

    const filePath = path.resolve(UPLOADS_BASE_DIR, ownerUid, scope, filename);
    if (!filePath.startsWith(UPLOADS_BASE_DIR + path.sep) || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found.' });
    }

    res.setHeader('Cache-Control', isPublicScope ? 'public, max-age=86400' : 'private, no-store');
    return res.sendFile(filePath);
  });

  // Optional AI-assisted project scoping helper (Gemini API on server)
  app.post('/api/v1/ai/suggest', rateLimit(15, 60_000), authenticateBearer, async (req: AuthenticatedRequest, res) => {
    const brief = typeof req.body?.brief === 'string' ? req.body.brief.trim().slice(0, 1200) : '';
    if (brief.length < 8) {
      return res.status(400).json({ error: 'Please provide a brief description of at least 8 characters.' });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      return res.status(503).json({ error: 'AI assistant is not configured.' });
    }
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an editing consultant for SRI EDITING STUDIO.
Available services:
1. Mobile Photo Editing (₹30 – ₹80 per photo)
2. Mobile Video Editing (₹110 – ₹300 per video)
3. PC Photo Editing (₹50 – ₹100 per photo)
4. PC Short Video Editing (₹150 – ₹600 per video)
5. PC Long Video Editing / Vlog Editing (Starting from ₹1,000)
6. Festival Photo Editing (₹150 per design)
7. Marriage / Wedding Photo Editing (₹150 per photo)
8. Reels Editing (₹120 per reel)
9. Shorts Editing (Contact for Pricing)
10. Wedding Intro Videos (Custom Pricing – Contact for Details)
11. Logo Design / Logo Editing (Custom Pricing – Contact for Details)

Client brief: "${brief}"

Return concise JSON with keys:
- recommendedService: exact service title from list above
- suggestedStyle: 3-6 word creative visual style direction
- checklist: array of 3 short preparation tips for the client`,
        config: {
          responseMimeType: 'application/json',
        },
      });
      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch {
      return res.status(500).json({ error: 'Unable to generate recommendation right now.' });
    }
  });

  // Multer & API error handler
  app.use('/api', (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal server error.' });
  });

  const httpServer = http.createServer(app);

  // ---------------------------------------------------------------------------
  // Vite Dev Middleware or Static Production Bundle
  // ---------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: { server: httpServer },
        allowedHosts: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(ROOT_DIR, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`SRI EDITING STUDIO server running on http://localhost:${PORT}`);
  });
}

startServer();
