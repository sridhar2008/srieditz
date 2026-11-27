import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { StudioLogo } from '../../components/common/StudioLogo';
import { SiteSettings } from '../../types/studio';

interface AboutPageProps {
  settings: SiteSettings;
}

export const AboutPage: React.FC<AboutPageProps> = ({ settings }) => {
  const sections = [
    { num: '01.', title: 'About My Editing', content: settings.aboutEditing },
    { num: '02.', title: 'My Creative Approach', content: settings.aboutApproach },
    { num: '03.', title: 'My Services', content: settings.aboutServices },
    { num: '04.', title: 'My Workflow', content: settings.aboutWorkflow },
    { num: '05.', title: 'My Commitment', content: settings.aboutCommitment },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 space-y-14">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-zinc-800/80 pb-12">
        <div className="lg:col-span-8 space-y-5">
          <p className="text-xs font-medium text-[#D4AF37]">About Sri Editing Studio</p>
          <h1 className="text-4xl sm:text-5xl font-display font-semibold text-white leading-tight text-balance">
            {settings.tagline}
          </h1>
          <p className="text-base text-zinc-300 leading-relaxed">{settings.aboutIntro}</p>
        </div>
        <div className="lg:col-span-4 flex justify-start lg:justify-end">
          <div className="rounded-2xl bg-[#101014] border border-zinc-800 p-8 flex flex-col items-center gap-4 text-center">
            <StudioLogo size="lg" showWordmark={false} />
            <p className="text-sm font-display font-semibold text-white">SRI EDITING STUDIO</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((sec) => (
          <article
            key={sec.title}
            className="rounded-2xl bg-[#101014] border border-zinc-800/90 p-7 space-y-3"
          >
            <span className="text-sm font-mono-tabular text-[#D4AF37]">{sec.num}</span>
            <h2 className="text-2xl font-display font-semibold text-white">{sec.title}</h2>
            <p className="text-sm text-zinc-300 leading-relaxed">{sec.content}</p>
          </article>
        ))}
      </div>

      <div className="rounded-2xl bg-[#101014] border border-zinc-800 p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-display font-semibold text-white">
            Have footage or photos ready for editing?
          </h3>
          <p className="text-sm text-zinc-400 mt-1">
            Explore our complete service catalog or submit your project request directly.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/services"
            className="px-4 py-2.5 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-200 hover:border-[#D4AF37] transition-colors"
          >
            Explore Services
          </Link>
          <Link
            to="/request-edit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#D4AF37] text-black text-sm font-semibold hover:bg-[#e5c24f] transition-colors"
          >
            Request an Edit
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
