import React, { useEffect, useState } from 'react';
import { Expand, Play, X } from 'lucide-react';
import { PortfolioItem } from '../../types/studio';
import { ProtectedMedia } from '../common/ProtectedMedia';

interface PortfolioGridProps {
  items: PortfolioItem[];
}

export const PortfolioGrid: React.FC<PortfolioGridProps> = ({ items }) => {
  const [selected, setSelected] = useState<PortfolioItem | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-[#101014] p-12 text-center">
        <p className="text-base font-medium text-zinc-200">No portfolio entries match this category yet.</p>
        <p className="mt-1 text-sm text-zinc-500">Select another category or check back as new studio works are published.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, idx) => (
          <article
            key={item.id}
            className={`group relative rounded-2xl overflow-hidden bg-[#101014] border border-zinc-800/90 hover:border-[#D4AF37]/60 transition-colors flex flex-col ${
              idx === 0 && items.length >= 4 ? 'md:col-span-2' : ''
            }`}
          >
            <button
              type="button"
              onClick={() => setSelected(item)}
              className="relative aspect-[16/10] w-full overflow-hidden bg-[#141418] text-left cursor-pointer"
            >
              {item.mediaType === 'video' ? (
                <>
                  {item.thumbnailUrl && !/\.(mp4|mov|webm)$/i.test(item.thumbnailUrl) ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  ) : (
                    <ProtectedMedia
                      url={item.mediaUrl}
                      alt={item.title}
                      previewOnly
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                    <span className="w-12 h-12 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </span>
                  </span>
                </>
              ) : (
                <ProtectedMedia
                  url={item.mediaUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-[#070709]/25 to-transparent opacity-85" />
              <span className="absolute top-3 right-3 p-2 rounded-lg bg-black/60 border border-white/15 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Expand className="w-4 h-4" />
              </span>
            </button>

            <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="text-[#D4AF37] font-medium">{item.category}</span>
                  {item.featured && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>Featured</span>
                    </>
                  )}
                </div>
                <h3 className="mt-1.5 text-lg font-display font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative max-w-4xl w-full rounded-2xl bg-[#101014] border border-zinc-800 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close lightbox"
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/75 border border-zinc-700 text-white hover:border-[#D4AF37] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="bg-black max-h-[70vh] flex items-center justify-center">
              <ProtectedMedia
                url={selected.mediaUrl}
                alt={selected.title}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
            <div className="p-6 space-y-2 border-t border-zinc-800">
              <div className="text-xs text-[#D4AF37] font-medium">{selected.category}</div>
              <h3 className="text-2xl font-display font-semibold text-white">{selected.title}</h3>
              <p className="text-sm text-zinc-400">{selected.description}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
