import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { FileDropzone } from '../../components/common/FileDropzone';
import { submitProjectRequest } from '../../services/studioService';
import { api } from '../../services/api';
import { EditingService } from '../../types/studio';

interface RequestEditPageProps {
  services: EditingService[];
}

export const RequestEditPage: React.FC<RequestEditPageProps> = ({ services }) => {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialServiceId = searchParams.get('service') || services[0]?.id || '';
  const [projectId] = useState(() => `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const [serviceId, setServiceId] = useState(initialServiceId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [preferredStyle, setPreferredStyle] = useState('');
  const [deliveryFormat, setDeliveryFormat] = useState('High-Resolution Export');
  const [referenceLinkInput, setReferenceLinkInput] = useState('');
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Optional AI Scope Assistant state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    recommendedService?: string;
    suggestedStyle?: string;
    checklist?: string[];
  } | null>(null);

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) || services[0],
    [services, serviceId]
  );

  // Adaptive guidance based on selected editing discipline
  const adaptiveHints = useMemo(() => {
    const t = (selectedService?.title || '').toLowerCase();
    if (t.includes('logo')) {
      return {
        reqLabel: 'Brand Name, Tagline & Color Preferences',
        reqPlaceholder: 'Enter brand name, preferred typography, monochrome or metallic gold palette, and usage targets...',
        stylePlaceholder: 'Minimalist luxury monogram, editorial serif...',
        uploadHelper: 'Upload existing sketches, inspiration images, or brand assets (up to 5 files, 35 MB max each)',
        formatOptions: ['Transparent PNG + Vector SVG', 'High-Res PNG + Dark/Light Variants', 'Animated Intro + Logo Pack'],
      };
    }
    if (t.includes('reel') || t.includes('short') || t.includes('video') || t.includes('vlog')) {
      return {
        reqLabel: 'Music Track, Pacing & Aspect Ratio Requirements',
        reqPlaceholder: 'Mention background music preference, target duration, captions/subtitles, and key moments to highlight...',
        stylePlaceholder: 'Beat-synced fast cuts, warm cinematic LUT, documentary pacing...',
        uploadHelper: 'Upload clips up to 35 MB each, or paste a Google Drive / cloud link for large raw footage',
        formatOptions: ['1080p MP4 (Vertical 9:16)', '4K MP4 (16:9 YouTube)', '1080p MP4 (Standard 16:9)'],
      };
    }
    if (t.includes('wedding') || t.includes('festival')) {
      return {
        reqLabel: 'Event Theme, Couple/Greeting Text & Visual Preferences',
        reqPlaceholder: 'Share names, occasion wording, traditional color palette, or album layout notes...',
        stylePlaceholder: 'Warm golden hour film tones, festive diya glow, timeless editorial...',
        uploadHelper: 'Upload high-res photos or reference frames (JPG, PNG, WEBP up to 35 MB each)',
        formatOptions: ['Print-Ready High-Res JPEG/PNG', '4K Couple Intro MP4', 'Social Media + Print Pack'],
      };
    }
    return {
      reqLabel: 'Specific Retouching & Color Requirements',
      reqPlaceholder: 'Describe skin retouching level, background cleanup, lighting adjustments, or crop ratio...',
      stylePlaceholder: 'Warm filmic contrast, moody dark editorial, clean natural tones...',
      uploadHelper: 'Upload photos up to 35 MB each (JPG, PNG, WEBP) — stored in your private project vault',
      formatOptions: ['High-Resolution JPEG (sRGB)', 'Lossless PNG Export', 'Instagram 4:5 + Full Res'],
    };
  }, [selectedService]);

  const handleAiAssist = async () => {
    if (description.trim().length < 8) {
      setError('Enter a short project description first so the assistant can suggest a style and service.');
      return;
    }
    setError('');
    try {
      setAiLoading(true);
      const res = await api.post('/ai/suggest', { brief: description });
      setAiSuggestion(res.data);
      if (res.data?.suggestedStyle && !preferredStyle) {
        setPreferredStyle(res.data.suggestedStyle);
      }
    } catch {
      // Silently ignore if AI key isn't configured in environment
      setAiSuggestion(null);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!user || !selectedService) return;
    if (title.trim().length < 3) {
      setError('Please enter a project title (at least 3 characters).');
      return;
    }
    if (description.trim().length < 10) {
      setError('Please describe your editing request (at least 10 characters).');
      return;
    }

    const links = referenceLinkInput
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 5);

    try {
      setSubmitting(true);
      const created = await submitProjectRequest({
        projectId,
        customerId: user.uid,
        customerName: profile?.displayName || user.displayName || 'Client',
        customerEmail: user.email || '',
        serviceId: selectedService.id,
        serviceTitle: selectedService.title,
        category: selectedService.category,
        title: title.trim(),
        description: description.trim(),
        requirements: requirements.trim(),
        preferredStyle: preferredStyle.trim(),
        deliveryFormat,
        referenceLinks: links,
        attachmentUrls,
        notes: notes.trim(),
        contactPhone: contactPhone.trim(),
        priceEstimate: selectedService.priceDisplay,
      });
      navigate(`/dashboard?project=${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit project request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="space-y-2 border-b border-zinc-800/80 pb-6">
        <p className="text-xs font-medium text-[#D4AF37]">Private Studio Workspace</p>
        <h1 className="text-3xl sm:text-4xl font-display font-semibold text-white">
          Submit an Editing Request
        </h1>
        <p className="text-sm text-zinc-400">
          Files uploaded here remain strictly private to you and the Sri Editing Studio administrator.
        </p>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="rounded-2xl bg-[#101014] border border-zinc-800 p-6 sm:p-8 space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Editing Service
            </label>
            <select
              value={selectedService?.id || ''}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#09090c] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.priceDisplay})
                </option>
              ))}
            </select>
            {selectedService && (
              <p className="mt-1.5 text-xs text-[#D4AF37] font-mono-tabular">
                Rate: {selectedService.priceDisplay}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Project Title
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={160}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Diwali Portrait Color Grade or Goa Travel Reel"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#09090c] border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-zinc-300">Project Description</label>
            <button
              type="button"
              disabled={aiLoading}
              onClick={() => void handleAiAssist()}
              className="inline-flex items-center gap-1 text-xs text-[#D4AF37] hover:underline cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {aiLoading ? 'Analyzing brief...' : 'Suggest style & checklist'}
            </button>
          </div>
          <textarea
            rows={4}
            required
            minLength={10}
            maxLength={3000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you are sharing, the mood you want, and any specific details..."
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#09090c] border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D4AF37]"
          />
          {aiSuggestion && (
            <div className="mt-3 rounded-xl bg-[#16161d] border border-[#D4AF37]/30 p-4 text-xs space-y-1.5">
              <p className="font-semibold text-[#D4AF37]">
                Suggested Direction: {aiSuggestion.recommendedService || selectedService?.title}
              </p>
              {aiSuggestion.suggestedStyle && (
                <p className="text-zinc-300">Style: {aiSuggestion.suggestedStyle}</p>
              )}
              {aiSuggestion.checklist && aiSuggestion.checklist.length > 0 && (
                <ul className="list-disc list-inside text-zinc-400 pt-1">
                  {aiSuggestion.checklist.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            {adaptiveHints.reqLabel}
          </label>
          <textarea
            rows={3}
            maxLength={2000}
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder={adaptiveHints.reqPlaceholder}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#09090c] border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Preferred Editing Style
            </label>
            <input
              type="text"
              maxLength={200}
              value={preferredStyle}
              onChange={(e) => setPreferredStyle(e.target.value)}
              placeholder={adaptiveHints.stylePlaceholder}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#09090c] border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Preferred Delivery Format
            </label>
            <select
              value={deliveryFormat}
              onChange={(e) => setDeliveryFormat(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#09090c] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            >
              {adaptiveHints.formatOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
              <option value="Custom Format">Custom Format</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Upload Project Photos or Clips (Private & Encrypted)
          </label>
          <FileDropzone
            scope={projectId}
            maxFiles={6}
            maxMb={35}
            uploadedUrls={attachmentUrls}
            onUploaded={setAttachmentUrls}
            helperText={adaptiveHints.uploadHelper}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Reference / Large Footage Cloud Links (Optional)
            </label>
            <input
              type="text"
              value={referenceLinkInput}
              onChange={(e) => setReferenceLinkInput(e.target.value)}
              placeholder="Paste Google Drive, Dropbox, or Reel reference URLs"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#09090c] border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Contact Phone / WhatsApp (Optional)
            </label>
            <input
              type="tel"
              maxLength={32}
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+91 ..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#09090c] border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Additional Notes
          </label>
          <textarea
            rows={2}
            maxLength={1500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Deadline expectations, special instructions, or questions..."
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#09090c] border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-950/50 border border-red-800/60 px-3 py-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#D4AF37] text-black text-sm font-semibold hover:bg-[#e5c24f] transition-colors cursor-pointer disabled:opacity-50"
          >
            <span>{submitting ? 'Submitting Request...' : 'Submit Editing Project'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
