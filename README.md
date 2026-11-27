# SRI EDITING STUDIO

**Turning Moments Into Visual Stories.**

A full-stack photo and video editing studio platform built with React, TypeScript, Tailwind CSS, Three.js, Express, Firebase Authentication, Cloud Firestore, and Progressive Web App (PWA) installability.

---

## Core Architecture

- **Frontend**: React 19, Vite, Tailwind CSS v4, Three.js (`HeroThreeScene`), Recharts (`AdminAnalyticsView`), `vite-plugin-pwa`.
- **Backend (`server.ts`)**: Express server with Vite dev middleware on port `3000`, Firebase Admin token verification (`verifyIdToken`), magic-byte file upload validation, private owner/admin media retrieval, rate limiting, Cloudflare Turnstile verification (`/api/v1/verify-turnstile`), and optional Gemini brief scoping (`/api/v1/ai/suggest`).
- **Database & Security**: Cloud Firestore governed by `/firebase-blueprint.json` and `/firestore.rules`.

---

## Environment Variables

Copy `.env.example` to `.env` for local or production deployment and configure:

- `ADMIN_EMAIL` — Single authorized studio administrator email address (checked server-side via verified Firebase ID token and matched in Firestore security rules).
- `GEMINI_API_KEY` — Optional key for the AI brief assistant on the project request page.
- `TURNSTILE_SECRET_KEY` / `VITE_TURNSTILE_SITE_KEY` — Optional Cloudflare Turnstile bot-protection keys for public signup and contact forms.
- `APP_URL` — Public application origin URL.

---

## Firebase Authentication Setup

Google Sign-In is enabled out of the box. To also allow Email/Password registration, verification emails, and password resets:

1. Open the **Firebase Console** for project `avian-iridium-54cnq`.
2. Navigate to **Authentication → Sign-in method**.
3. Enable **Email/Password**.
4. Review `/firestore.rules` before sharing broadly and ensure the designated admin email matches your administrator account.

---

## File Upload & Storage Rules

- Customer uploads are validated by magic bytes (`JPG`, `PNG`, `WEBP`, `MP4`, `MOV`, `WEBM`, `PDF`), capped at **35 MB per file** (up to 6 files per upload), and stored outside public static roots under `./uploads/<uid>/<scope>/`.
- Retrieval routes check Firebase bearer authentication so private project files are accessible only to the owning customer and the studio administrator.
- For raw footage larger than 35 MB, customers can attach Google Drive, Dropbox, or cloud transfer links directly in the project request form.

---

## Progressive Web App (PWA)

- Configured via `vite-plugin-pwa` with a standalone manifest, custom icons generated from the official SRI EDITING STUDIO logo, offline status indicator, and install prompt (`PWAInstallButton`).
- All `/api/` endpoints strictly use `NetworkOnly` caching so authentication tokens and private files are never cached by the service worker.

---

## Cloudflare Production Hardening (Recommended)

When placing the studio behind a custom domain:

1. Enable **Full (Strict)** SSL/TLS and **Always Use HTTPS** in Cloudflare.
2. Enable **Turnstile** and set `VITE_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`.
3. Configure WAF rate-limiting rules on `/api/v1/uploads` and `/api/v1/verify-turnstile`.

---

## GitHub Pages Deployment

A ready-to-run workflow is included at `.github/workflows/deploy-pages.yml`:

1. In your GitHub repository, open **Settings → Pages** and set **Source** to **GitHub Actions** (do not serve the unbuilt root `index.html` directly from a branch, because Chrome cannot run uncompiled `.tsx` modules).
2. Push to `main` (or trigger **Deploy to GitHub Pages** in the Actions tab) to build `dist/` with the repository's base path and publish it.
3. Add `<your-username>.github.io` under **Firebase Console → Authentication → Settings → Authorized domains** if you want Google Sign-In active on your GitHub Pages URL. (Note: backend `/api/v1/*` upload endpoints require running `npm run start` on a Node.js host such as Cloud Run.)

---

## Scripts

```bash
npm install        # Install dependencies
npm run dev        # Start Express + Vite dev server on port 3000
npm run lint       # Run TypeScript typechecking
npm run build      # Build production Vite bundle into dist/
npm run start      # Serve production build via Express on port 3000
```
