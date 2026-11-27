import React from 'react';
import { ArrowRight, Check, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EditingService } from '../../types/studio';

interface ServiceCardProps {
  service: EditingService;
  compact?: boolean;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, compact = false }) => {
  const inclusionsToShow = compact ? service.inclusions.slice(0, 4) : service.inclusions;

  return (
    <article className="group flex flex-col justify-between rounded-2xl bg-[#101014] border border-zinc-800/90 hover:border-[#D4AF37]/50 transition-colors overflow-hidden">
      <div>
        {service.imageUrl && (
          <div className="relative h-44 overflow-hidden bg-[#16161c]">
            <img
              src={service.imageUrl}
              alt={service.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#101014] via-[#101014]/25 to-transparent" />
          </div>
        )}

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 text-xs text-zinc-400">
            <span>{service.category}</span>
            <span className="font-mono-tabular text-[#D4AF37] font-semibold">
              {service.priceDisplay}
            </span>
          </div>

          <div>
            <h3 className="text-xl font-display font-semibold text-white leading-snug">
              {service.title}
            </h3>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              {service.description}
            </p>
          </div>

          {service.promoText && !compact && (
            <p className="text-xs text-zinc-300 border-t border-zinc-800/80 pt-3">
              {service.promoText}
            </p>
          )}

          <div className="space-y-2 pt-1">
            <p className="text-xs font-medium text-zinc-300">Included deliverables</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-zinc-400">
              {inclusionsToShow.map((inc) => (
                <li key={inc} className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span>{inc}</span>
                </li>
              ))}
            </ul>
            {compact && service.inclusions.length > 4 && (
              <p className="text-xs text-zinc-500">
                +{service.inclusions.length - 4} more inclusions
              </p>
            )}
          </div>

          {!compact && service.useCases.length > 0 && (
            <div className="pt-2 border-t border-zinc-800/80">
              <p className="text-xs text-zinc-500">
                Ideal for: <span className="text-zinc-300">{service.useCases.join(' · ')}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-6 pt-2 flex flex-wrap items-center gap-2.5">
        <Link
          to={`/request-edit?service=${encodeURIComponent(service.id)}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#D4AF37] text-black text-xs font-semibold hover:bg-[#e5c24f] transition-colors whitespace-nowrap shrink-0"
        >
          Request Edit
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <Link
          to={`/request-edit?service=${encodeURIComponent(service.id)}&upload=1`}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-zinc-700 text-zinc-200 hover:border-zinc-500 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload Project
        </Link>
        {!compact && (
          <Link
            to={`/contact?service=${encodeURIComponent(service.title)}`}
            className="inline-flex items-center px-3 py-2 text-xs text-zinc-400 hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            Contact
          </Link>
        )}
      </div>
    </article>
  );
};
