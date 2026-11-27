import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, Instagram, Youtube, MessageCircle } from 'lucide-react';
import { StudioLogo } from '../common/StudioLogo';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { SiteSettings } from '../../types/studio';

interface FooterProps {
  settings: SiteSettings;
}

export const Footer: React.FC<FooterProps> = ({ settings }) => {
  return (
    <footer className="border-t border-zinc-800/80 bg-[#070709] text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2 space-y-4">
          <StudioLogo size="md" showWordmark />
          <p className="text-sm text-zinc-400 max-w-md leading-relaxed">
            {settings.tagline} {settings.footerText}
          </p>
          <div className="pt-1">
            <PWAInstallButton variant="card" />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">Studio Navigation</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-[#D4AF37] transition-colors">About Studio</Link></li>
            <li><Link to="/services" className="hover:text-[#D4AF37] transition-colors">Editing Services</Link></li>
            <li><Link to="/pricing" className="hover:text-[#D4AF37] transition-colors">Pricing Overview</Link></li>
            <li><Link to="/portfolio" className="hover:text-[#D4AF37] transition-colors">Creative Portfolio</Link></li>
            <li><Link to="/reviews" className="hover:text-[#D4AF37] transition-colors">Client Reviews</Link></li>
            <li><Link to="/request-edit" className="hover:text-[#D4AF37] transition-colors">Request an Edit</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">Connect</h3>
          <ul className="space-y-3 text-sm">
            {settings.contactEmail && (
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <a href={`mailto:${settings.contactEmail}`} className="hover:text-white truncate">
                  {settings.contactEmail}
                </a>
              </li>
            )}
            {settings.instagramLink && (
              <li className="flex items-center gap-2.5">
                <Instagram className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <a
                  href={settings.instagramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#D4AF37] transition-colors truncate"
                >
                  @_srxxeee_editz
                </a>
              </li>
            )}
            {settings.contactPhone && (
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>{settings.contactPhone}</span>
              </li>
            )}
          </ul>
          {(settings.youtubeLink || settings.whatsappLink) && (
            <div className="flex items-center gap-3 pt-1">
              {settings.youtubeLink && (
                <a
                  href={settings.youtubeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="p-2 rounded-lg border border-zinc-800 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              )}
              {settings.whatsappLink && (
                <a
                  href={settings.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="p-2 rounded-lg border border-zinc-800 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-zinc-800/80 py-5 px-4 sm:px-6 text-xs text-zinc-500 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© {new Date().getFullYear()} SRI EDITING STUDIO. All rights reserved.</span>
        <Link to="/contact" className="hover:text-zinc-300 transition-colors">
          Contact & Inquiries
        </Link>
      </div>
    </footer>
  );
};
