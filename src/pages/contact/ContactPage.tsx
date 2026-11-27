import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Instagram, Mail, MessageCircle, Phone, Youtube } from 'lucide-react';
import { submitContactInquiry } from '../../services/studioService';
import { EditingService, SiteSettings } from '../../types/studio';

interface ContactPageProps {
  settings: SiteSettings;
  services: EditingService[];
}

export const ContactPage: React.FC<ContactPageProps> = ({ settings, services }) => {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('service') || services[0]?.title || 'General Inquiry';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSent(false);

    if (name.trim().length < 2 || message.trim().length < 10) {
      setError('Please enter your name and at least 10 characters describing your inquiry.');
      return;
    }

    try {
      setSending(true);
      await submitContactInquiry({
        name,
        email,
        phone,
        category,
        message,
      });
      setSent(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message right now.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 space-y-12">
      <div className="space-y-2 max-w-2xl border-b border-zinc-800/80 pb-8">
        <p className="text-xs font-medium text-[#D4AF37]">Get in Touch</p>
        <h1 className="text-4xl sm:text-5xl font-display font-semibold text-white">
          Contact SRI EDITING STUDIO
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed">{settings.contactText}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl bg-[#101014] border border-zinc-800 p-6 space-y-5">
            <h2 className="text-xl font-display font-semibold text-white">Direct Studio Channels</h2>
            <div className="space-y-4 text-sm text-zinc-300">
              {settings.contactEmail && (
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#D4AF37] mt-1 shrink-0" />
                  <div>
                    <p className="text-xs text-zinc-500">Email</p>
                    <a
                      href={`mailto:${settings.contactEmail}`}
                      className="text-zinc-100 hover:text-[#D4AF37] transition-colors break-all"
                    >
                      {settings.contactEmail}
                    </a>
                  </div>
                </div>
              )}
              {settings.instagramLink && (
                <div className="flex items-start gap-3">
                  <Instagram className="w-4 h-4 text-[#D4AF37] mt-1 shrink-0" />
                  <div>
                    <p className="text-xs text-zinc-500">Instagram</p>
                    <a
                      href={settings.instagramLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-100 hover:text-[#D4AF37] transition-colors"
                    >
                      @_srxxeee_editz
                    </a>
                  </div>
                </div>
              )}
              {settings.contactPhone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#D4AF37] mt-1 shrink-0" />
                  <div>
                    <p className="text-xs text-zinc-500">Phone</p>
                    <span>{settings.contactPhone}</span>
                  </div>
                </div>
              )}
            </div>

            {(settings.instagramLink || settings.whatsappLink || settings.youtubeLink) && (
              <div className="pt-4 border-t border-zinc-800 space-y-3">
                <p className="text-xs font-medium text-zinc-400">Quick Connect</p>
                <div className="flex flex-wrap gap-2.5">
                  {settings.contactEmail && (
                    <a
                      href={`mailto:${settings.contactEmail}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-zinc-700 text-xs text-zinc-200 hover:border-[#D4AF37]"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Email Studio
                    </a>
                  )}
                  {settings.instagramLink && (
                    <a
                      href={settings.instagramLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-zinc-700 text-xs text-zinc-200 hover:border-[#D4AF37]"
                    >
                      <Instagram className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Instagram
                    </a>
                  )}
                  {settings.whatsappLink && (
                    <a
                      href={settings.whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-zinc-700 text-xs text-zinc-200 hover:border-[#D4AF37]"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
                      WhatsApp
                    </a>
                  )}
                  {settings.youtubeLink && (
                    <a
                      href={settings.youtubeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-zinc-700 text-xs text-zinc-200 hover:border-[#D4AF37]"
                    >
                      <Youtube className="w-3.5 h-3.5 text-[#D4AF37]" />
                      YouTube
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7">
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="rounded-2xl bg-[#101014] border border-zinc-800 p-6 sm:p-8 space-y-5"
          >
            <h2 className="text-2xl font-display font-semibold text-white">Send an Inquiry</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Your Name</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#09090c] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  maxLength={160}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#09090c] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  maxLength={32}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#09090c] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Service Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#09090c] border border-zinc-800 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.title}>
                      {s.title}
                    </option>
                  ))}
                  <option value="Custom Project">Custom Project</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Project Description
              </label>
              <textarea
                rows={5}
                required
                minLength={10}
                maxLength={2000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us about your footage, photo count, style preferences, or timeline..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#09090c] border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}
            {sent && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-950/50 border border-emerald-800/60 px-4 py-3 text-xs text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Inquiry received! Our studio will follow up via email shortly.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="px-6 py-3 rounded-lg bg-[#D4AF37] text-black text-sm font-semibold hover:bg-[#e5c24f] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
