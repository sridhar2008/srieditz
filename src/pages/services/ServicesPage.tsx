import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { ServiceCard } from '../../components/cards/ServiceCard';
import { PRICING_FILTERS } from '../../data/defaultCatalog';
import { EditingService } from '../../types/studio';

interface ServicesPageProps {
  services: EditingService[];
}

export const ServicesPage: React.FC<ServicesPageProps> = ({ services }) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('All Services');
  const [queryText, setQueryText] = useState('');

  const filtered = useMemo(() => {
    return services.filter((svc) => {
      const matchesFilter =
        selectedFilter === 'All Services' ||
        svc.category === selectedFilter ||
        (selectedFilter === 'Photo Editing' && svc.title.toLowerCase().includes('photo')) ||
        (selectedFilter === 'Video Editing' && svc.title.toLowerCase().includes('video'));
      const q = queryText.trim().toLowerCase();
      const matchesQuery =
        !q ||
        svc.title.toLowerCase().includes(q) ||
        svc.description.toLowerCase().includes(q) ||
        svc.inclusions.some((inc) => inc.toLowerCase().includes(q));
      return matchesFilter && matchesQuery;
    });
  }, [services, selectedFilter, queryText]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-zinc-800/80 pb-8">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-medium text-[#D4AF37]">Complete Editing Catalog</p>
          <h1 className="text-4xl sm:text-5xl font-display font-semibold text-white">
            Editing Services
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Every service is dynamically managed and transparent. Select any editing package below to start a project request or upload your files securely.
          </p>
        </div>

        <div className="relative w-full lg:w-72 shrink-0">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Search services or deliverables..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#101014] border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D4AF37]"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PRICING_FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setSelectedFilter(filter)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedFilter === filter
                ? 'bg-[#D4AF37] text-black font-semibold'
                : 'bg-[#101014] border border-zinc-800 text-zinc-300 hover:border-zinc-600'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-[#101014] p-12 text-center">
          <p className="text-base font-medium text-zinc-200">No services match your filter.</p>
          <button
            type="button"
            onClick={() => {
              setSelectedFilter('All Services');
              setQueryText('');
            }}
            className="mt-4 px-4 py-2 rounded-lg bg-zinc-800 text-xs font-medium text-white hover:bg-zinc-700 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((svc) => (
            <ServiceCard key={svc.id} service={svc} />
          ))}
        </div>
      )}
    </div>
  );
};
