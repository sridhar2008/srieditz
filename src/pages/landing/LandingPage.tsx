import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Film, Instagram, Layers, Mail, Sparkles, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { HeroThreeScene } from '../../components/animations/HeroThreeScene';
import { StudioLogo } from '../../components/common/StudioLogo';
import { ServiceCard } from '../../components/cards/ServiceCard';
import { PortfolioGrid } from '../../components/portfolio/PortfolioGrid';
import { ReviewCard } from '../../components/reviews/ReviewCard';
import { CustomerReview, EditingService, PortfolioItem, PromoBanner, SiteSettings } from '../../types/studio';

interface LandingPageProps {
  settings: SiteSettings;
  services: EditingService[];
  portfolio: PortfolioItem[];
  reviews: CustomerReview[];
  banners: PromoBanner[];
}

export const LandingPage: React.FC<LandingPageProps> = ({
  settings,
  services,
  portfolio,
  reviews,
  banners,
}) => {
  const featuredServices = services.slice(0, 4);
  const featuredPortfolio = portfolio.filter((p) => p.featured).slice(0, 4);
  const displayPortfolio = featuredPortfolio.length > 0 ? featuredPortfolio : portfolio.slice(0, 4);
  const featuredReviews = reviews.filter((r) => r.featured).slice(0, 3);
  const displayReviews = featuredReviews.length > 0 ? featuredReviews : reviews.slice(0, 3);
  const activeBanner = banners.find((b) => b.active);

  const workflowSteps = [
    {
      num: '01.',
      title: 'Submit Your Project',
      desc: 'Select an editing service, share your creative direction, and upload photos, clips, or secure media links.',
    },
    {
      num: '02.',
      title: 'Review & Acceptance',
      desc: 'Your request receives a dedicated project ID, timeline check, and clear estimate before editing begins.',
    },
    {
      num: '03.',
      title: 'Precision Editing',
      desc: 'Color grading, pacing, transitions, and sound alignment are crafted with live status updates in your dashboard.',
    },
    {
      num: '04.',
      title: 'Preview & Revisions',
      desc: 'Inspect the Ready for Review cut, request refinements if needed, and receive your finished visual story.',
    },
  ];

  return (
    <div className="bg-[#070709] text-zinc-100">
      {/* 1. Full-Bleed 3D Animation Background Hero */}
      <section className="relative overflow-hidden border-b border-zinc-800/70">
        <HeroThreeScene variant="background" />
        {/* Directional cinematic contrast vignette preserving foreground legibility without blur */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-r from-[#070709]/95 via-[#070709]/75 to-[#070709]/25"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-t from-[#070709] via-transparent to-[#070709]/50"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-16 lg:pt-20 lg:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl flex flex-col justify-center space-y-6"
          >
            <div className="flex items-center gap-4">
              <StudioLogo size="lg" showWordmark={false} />
              <div>
                <p className="text-xs font-medium text-[#D4AF37] tracking-wide">
                  Official Creative Post-Production Studio
                </p>
                <p className="text-xl sm:text-2xl font-display font-semibold text-white">
                  SRI EDITING STUDIO
                </p>
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-display font-semibold text-white leading-[1.06] tracking-tight text-balance">
              {settings.tagline}
            </h1>

            <p className="text-sm sm:text-base text-zinc-200 leading-relaxed max-w-xl">
              {settings.heroDescription}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/request-edit"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#D4AF37] text-black text-sm font-semibold hover:bg-[#e5c24f] transition-colors whitespace-nowrap shrink-0"
              >
                Request an Edit
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center px-4 py-3 rounded-lg bg-[#0d0d11]/90 border border-zinc-700 text-zinc-100 text-sm font-medium hover:border-[#D4AF37] transition-colors whitespace-nowrap shrink-0"
              >
                Explore Services
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center px-4 py-3 rounded-lg bg-[#0d0d11]/90 border border-zinc-800 text-zinc-300 text-sm font-medium hover:text-white hover:border-zinc-600 transition-colors whitespace-nowrap shrink-0"
              >
                View Pricing
              </Link>
              <Link
                to="/portfolio"
                className="inline-flex items-center px-4 py-3 text-sm font-medium text-[#D4AF37] hover:underline whitespace-nowrap shrink-0"
              >
                View Portfolio
              </Link>
            </div>
          </motion.div>

          {/* Full-width Studio Capability Strip below hero content */}
          <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4 border-t border-zinc-800/80 pt-8">
            <div className="space-y-1">
              <p className="text-xs text-zinc-400">Editing Disciplines</p>
              <p className="text-lg font-semibold text-white tabular-nums">{services.length} Services</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-zinc-400">Mobile Photo Starts At</p>
              <p className="text-lg font-semibold text-[#D4AF37] font-mono-tabular">₹30 / photo</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-zinc-400">Instagram Reels</p>
              <p className="text-lg font-semibold text-white font-mono-tabular">₹120 / reel</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-zinc-400">Client Workspace</p>
              <p className="text-lg font-semibold text-white">Private File Vault</p>
            </div>
          </div>
        </div>
      </section>

      {/* Subtle Editorial Marquee Divider */}
      <div className="border-y border-zinc-800/80 bg-[#0b0b0f] py-3 overflow-hidden">
        <div className="animate-marquee text-xs text-zinc-400 tracking-wide">
          <span className="mx-6">Photo Color Grading · Cinematic Reels · Wedding Intro Films · Festival Posters · YouTube Vlogs · Custom Brand Logos</span>
          <span className="mx-6">Photo Color Grading · Cinematic Reels · Wedding Intro Films · Festival Posters · YouTube Vlogs · Custom Brand Logos</span>
        </div>
      </div>

      {/* 2. About Sri Editing Studio */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-4">
            <p className="text-xs font-medium text-[#D4AF37]">About Sri Editing Studio</p>
            <h2 className="text-3xl sm:text-4xl font-display font-semibold text-white leading-tight text-balance">
              Crafted With Creativity, Precision & Storytelling
            </h2>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
              {settings.aboutIntro}
            </p>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#D4AF37] hover:underline pt-1"
            >
              Read full studio approach
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: 'About My Editing', body: settings.aboutEditing },
              { title: 'My Creative Approach', body: settings.aboutApproach },
              { title: 'My Workflow', body: settings.aboutWorkflow },
              { title: 'My Commitment', body: settings.aboutCommitment },
            ].map((sub) => (
              <div
                key={sub.title}
                className="rounded-2xl bg-[#101014] border border-zinc-800/90 p-5 space-y-2"
              >
                <h3 className="text-base font-display font-semibold text-white">{sub.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{sub.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Featured Editing Services */}
      <section className="border-t border-zinc-800/80 bg-[#0a0a0d] py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#D4AF37]">Featured Editing Services</p>
              <h2 className="mt-1 text-3xl sm:text-4xl font-display font-semibold text-white">
                Post-Production Built For Every Frame
              </h2>
            </div>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#D4AF37] hover:underline whitespace-nowrap shrink-0"
            >
              View all {services.length} services
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredServices.map((svc) => (
              <ServiceCard key={svc.id} service={svc} compact />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Pricing Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-20 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#D4AF37]">Transparent Studio Rates</p>
            <h2 className="mt-1 text-3xl sm:text-4xl font-display font-semibold text-white">
              Pricing Overview
            </h2>
          </div>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-100 hover:border-[#D4AF37] transition-colors whitespace-nowrap shrink-0"
          >
            Compare All Plans
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-[#101014] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-xs text-zinc-400">
                  <th className="py-3.5 px-5 font-medium">Service</th>
                  <th className="py-3.5 px-5 font-medium">Category</th>
                  <th className="py-3.5 px-5 font-medium">Pricing</th>
                  <th className="py-3.5 px-5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70 text-sm">
                {services.map((svc) => (
                  <tr key={svc.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-3.5 px-5 font-medium text-white">{svc.title}</td>
                    <td className="py-3.5 px-5 text-zinc-400 text-xs">{svc.category}</td>
                    <td className="py-3.5 px-5 font-mono-tabular text-[#D4AF37] font-semibold">
                      {svc.priceDisplay}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        to={`/request-edit?service=${encodeURIComponent(svc.id)}`}
                        className="text-xs font-medium text-zinc-200 hover:text-[#D4AF37] transition-colors whitespace-nowrap"
                      >
                        Request Edit →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. Portfolio Showcase */}
      <section className="border-t border-zinc-800/80 bg-[#0a0a0d] py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#D4AF37]">Selected Visual Works</p>
              <h2 className="mt-1 text-3xl sm:text-4xl font-display font-semibold text-white">
                Portfolio Showcase
              </h2>
            </div>
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#D4AF37] hover:underline whitespace-nowrap shrink-0"
            >
              Explore full gallery
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <PortfolioGrid items={displayPortfolio} />
        </div>
      </section>

      {/* 6. How the Editing Process Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-20 space-y-10">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-[#D4AF37]">Studio Pipeline</p>
          <h2 className="mt-1 text-3xl sm:text-4xl font-display font-semibold text-white">
            How the Editing Process Works
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {workflowSteps.map((step) => (
            <div
              key={step.num}
              className="rounded-2xl bg-[#101014] border border-zinc-800/90 p-6 space-y-3"
            >
              <span className="text-2xl font-display font-semibold text-[#D4AF37] tabular-nums">
                {step.num}
              </span>
              <h3 className="text-lg font-semibold text-white">{step.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Promotional Banner (Admin Managed) */}
      {activeBanner && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <div className="relative rounded-2xl overflow-hidden border border-[#D4AF37]/40 bg-[#12100d] p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-medium text-[#D4AF37]">Studio Announcement</p>
              <h2 className="text-2xl sm:text-3xl font-display font-semibold text-white">
                {activeBanner.title}
              </h2>
              {activeBanner.subtitle && (
                <p className="text-sm text-zinc-300 leading-relaxed">{activeBanner.subtitle}</p>
              )}
            </div>
            {activeBanner.ctaLabel && (
              <Link
                to={activeBanner.ctaLink || '/request-edit'}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#D4AF37] text-black text-sm font-semibold hover:bg-[#e5c24f] transition-colors whitespace-nowrap shrink-0"
              >
                {activeBanner.ctaLabel}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </section>
      )}

      {/* 8. Featured Client Reviews */}
      <section className="border-t border-zinc-800/80 bg-[#0a0a0d] py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#D4AF37]">Verified Completed Projects</p>
              <h2 className="mt-1 text-3xl sm:text-4xl font-display font-semibold text-white">
                Client Reviews
              </h2>
            </div>
            <Link
              to="/reviews"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#D4AF37] hover:underline whitespace-nowrap shrink-0"
            >
              View all reviews
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {displayReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-800 bg-[#101014] p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#D4AF37]">
                  <Star className="w-4 h-4" />
                  <span className="text-xs font-medium">Authentic Verified Feedback Only</span>
                </div>
                <p className="text-base font-medium text-white">
                  Reviews appear here once clients complete a project and our studio approves their submission.
                </p>
                <p className="text-sm text-zinc-400">
                  We never publish fabricated testimonials or unverified ratings.
                </p>
              </div>
              <Link
                to="/request-edit"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#D4AF37] text-black text-xs font-semibold hover:bg-[#e5c24f] whitespace-nowrap shrink-0"
              >
                Start a Project
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 9. Contact Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
        <div className="rounded-2xl bg-[#101014] border border-zinc-800 p-8 sm:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <p className="text-xs font-medium text-[#D4AF37]">Direct Studio Desk</p>
            <h2 className="text-3xl sm:text-4xl font-display font-semibold text-white">
              Ready to Turn Your Footage Into a Visual Story?
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">{settings.contactText}</p>
            <div className="flex flex-wrap gap-6 pt-2 text-xs text-zinc-300">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                Secure private uploads
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Film className="w-4 h-4 text-[#D4AF37]" />
                Photo & video editing
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#D4AF37]" />
                Tracked revisions
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                Transparent ₹ pricing
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
            <div className="flex flex-wrap gap-3">
              <Link
                to="/request-edit"
                className="px-5 py-3 rounded-lg bg-[#D4AF37] text-black text-sm font-semibold hover:bg-[#e5c24f] transition-colors whitespace-nowrap"
              >
                Submit Editing Request
              </Link>
              <Link
                to="/contact"
                className="px-5 py-3 rounded-lg border border-zinc-700 text-zinc-100 text-sm font-medium hover:border-[#D4AF37] transition-colors whitespace-nowrap"
              >
                Contact Studio
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-zinc-300">
              {settings.contactEmail && (
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="inline-flex items-center gap-1.5 hover:text-[#D4AF37] transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
                  {settings.contactEmail}
                </a>
              )}
              {settings.instagramLink && (
                <a
                  href={settings.instagramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-[#D4AF37] transition-colors"
                >
                  <Instagram className="w-3.5 h-3.5 text-[#D4AF37]" />
                  @_srxxeee_editz
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
