import React, { useMemo, useState } from 'react';
import { PortfolioGrid } from '../../components/portfolio/PortfolioGrid';
import { PORTFOLIO_CATEGORIES } from '../../data/defaultCatalog';
import { PortfolioItem } from '../../types/studio';

interface PortfolioPageProps {
  items: PortfolioItem[];
}

export const PortfolioPage: React.FC<PortfolioPageProps> = ({ items }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filtered = useMemo(() => {
    if (selectedCategory === 'All') return items;
    return items.filter((item) => item.category === selectedCategory);
  }, [items, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-10">
      <div className="space-y-2 max-w-2xl border-b border-zinc-800/80 pb-8">
        <p className="text-xs font-medium text-[#D4AF37]">Creative Gallery</p>
        <h1 className="text-4xl sm:text-5xl font-display font-semibold text-white">
          Portfolio Showcase
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Explore curated photo retouching, reels, shorts, wedding films, festival posters, and brand logo works managed by Sri Editing Studio.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PORTFOLIO_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#D4AF37] text-black font-semibold'
                : 'bg-[#101014] border border-zinc-800 text-zinc-300 hover:border-zinc-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <PortfolioGrid items={filtered} />
    </div>
  );
};
