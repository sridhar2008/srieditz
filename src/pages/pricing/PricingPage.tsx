import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, LayoutGrid, Table2, Upload } from 'lucide-react';
import { PRICING_FILTERS } from '../../data/defaultCatalog';
import { EditingService } from '../../types/studio';

interface PricingPageProps {
  services: EditingService[];
}

export const PricingPage: React.FC<PricingPageProps> = ({ services }) => {
  const [filter, setFilter] = useState<string>('All Services');
  const [viewMode, setViewMode] = useState<'cards' | 'compare'>('cards');

  const filtered = useMemo(() => {
    return services.filter((svc) => {
      if (filter === 'All Services') return true;
      if (svc.category === filter) return true;
      if (filter === 'Photo Editing' && svc.title.toLowerCase().includes('photo')) return true;
      if (filter === 'Video Editing' && svc.title.toLowerCase().includes('video')) return true;
      return false;
    });
  }, [services, filter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800/80 pb-8">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-medium text-[#D4AF37]">Dynamic Studio Pricing</p>
          <h1 className="text-4xl sm:text-5xl font-display font-semibold text-white">
            Service Pricing
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Clear rates for mobile edits, desktop retouching, reels, shorts, vlogs, wedding films, festival posters, and custom branding.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#101014] border border-zinc-800 shrink-0 self-start">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'cards' ? 'bg-[#D4AF37] text-black font-semibold' : 'text-zinc-300 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Cards
          </button>
          <button
            type="button"
            onClick={() => setViewMode('compare')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              viewMode === 'compare' ? 'bg-[#D4AF37] text-black font-semibold' : 'text-zinc-300 hover:text-white'
            }`}
          >
            <Table2 className="w-3.5 h-3.5" />
            Compare
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {PRICING_FILTERS.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filter === cat
                ? 'bg-[#D4AF37] text-black font-semibold'
                : 'bg-[#101014] border border-zinc-800 text-zinc-300 hover:border-zinc-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((svc) => (
            <article
              key={svc.id}
              className="rounded-2xl bg-[#101014] border border-zinc-800/90 hover:border-[#D4AF37]/60 transition-colors p-6 flex flex-col justify-between gap-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
                  <span>{svc.category}</span>
                  <span className="capitalize">{svc.pricingType} rate</span>
                </div>

                <div>
                  <h2 className="text-xl font-display font-semibold text-white">{svc.title}</h2>
                  <p className="mt-2 text-2xl font-mono-tabular font-semibold text-[#D4AF37]">
                    {svc.priceDisplay}
                  </p>
                  {svc.promoText && (
                    <p className="mt-1 text-xs text-zinc-400">{svc.promoText}</p>
                  )}
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">{svc.description}</p>

                <div className="space-y-2 border-t border-zinc-800/80 pt-4">
                  <p className="text-xs font-medium text-zinc-300">What is included</p>
                  <ul className="space-y-1.5 text-xs text-zinc-400">
                    {svc.inclusions.slice(0, 6).map((inc) => (
                      <li key={inc} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 mt-0.5" />
                        <span>{inc}</span>
                      </li>
                    ))}
                    {svc.inclusions.length > 6 && (
                      <li className="text-zinc-500">+{svc.inclusions.length - 6} additional deliverables</li>
                    )}
                  </ul>
                </div>

                {svc.useCases.length > 0 && (
                  <p className="text-xs text-zinc-500 pt-1">
                    Use cases: <span className="text-zinc-300">{svc.useCases.join(' · ')}</span>
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2.5 pt-2">
                <Link
                  to={`/request-edit?service=${encodeURIComponent(svc.id)}`}
                  className="flex-1 text-center px-4 py-2.5 rounded-lg bg-[#D4AF37] text-black text-xs font-semibold hover:bg-[#e5c24f] transition-colors whitespace-nowrap"
                >
                  Request an Edit
                </Link>
                <Link
                  to={`/request-edit?service=${encodeURIComponent(svc.id)}&upload=1`}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-zinc-700 text-zinc-200 hover:border-zinc-500 text-xs font-medium transition-colors whitespace-nowrap"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Project
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-[#101014] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-400">
                  <th className="py-4 px-5 font-medium">Service</th>
                  <th className="py-4 px-5 font-medium">Category</th>
                  <th className="py-4 px-5 font-medium">Price</th>
                  <th className="py-4 px-5 font-medium">Rate Type</th>
                  <th className="py-4 px-5 font-medium">Key Deliverables</th>
                  <th className="py-4 px-5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70 text-sm">
                {filtered.map((svc) => (
                  <tr key={svc.id} className="hover:bg-zinc-900/40">
                    <td className="py-4 px-5 font-semibold text-white">{svc.title}</td>
                    <td className="py-4 px-5 text-xs text-zinc-400">{svc.category}</td>
                    <td className="py-4 px-5 font-mono-tabular text-[#D4AF37] font-semibold whitespace-nowrap">
                      {svc.priceDisplay}
                    </td>
                    <td className="py-4 px-5 text-xs text-zinc-400 capitalize">{svc.pricingType}</td>
                    <td className="py-4 px-5 text-xs text-zinc-400 max-w-xs">
                      {svc.inclusions.slice(0, 3).join(', ')}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <Link
                        to={`/request-edit?service=${encodeURIComponent(svc.id)}`}
                        className="inline-block px-3 py-1.5 rounded-lg bg-[#D4AF37] text-black text-xs font-semibold hover:bg-[#e5c24f] whitespace-nowrap"
                      >
                        Request
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
