import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { getMillis } from '../../services/studioService';
import { ContactMessage, CustomerReview, EditingProject, UserProfile } from '../../types/studio';
import { Admin3DAnalyticsScene } from './Admin3DAnalyticsScene';

interface AdminAnalyticsViewProps {
  projects: EditingProject[];
  customers: UserProfile[];
  reviews: CustomerReview[];
  contacts: ContactMessage[];
}

const CHART_COLORS = ['#D4AF37', '#F4F4F5', '#64748B', '#16A34A', '#D97706', '#DC2626', '#94A3B8'];

const SAMPLE_STATUS_DATA = [
  { name: 'Completed', value: 14 },
  { name: 'Editing in Progress', value: 7 },
  { name: 'Reviewing', value: 5 },
  { name: 'Ready for Review', value: 4 },
  { name: 'Request Submitted', value: 3 },
];

const SAMPLE_CATEGORY_DATA = [
  { name: 'Reels Editing', count: 12 },
  { name: 'Mobile Photo', count: 9 },
  { name: 'Wedding Photo', count: 6 },
  { name: 'PC Short Video', count: 4 },
  { name: 'Festival Poster', count: 2 },
];

const SAMPLE_MONTHLY_DATA = [
  { month: 'Jul', requests: 6, completed: 5 },
  { month: 'Aug', requests: 9, completed: 8 },
  { month: 'Sep', requests: 11, completed: 9 },
  { month: 'Oct', requests: 15, completed: 13 },
  { month: 'Nov', requests: 19, completed: 14 },
];

const AnimatedNumber: React.FC<{ target: number }> = ({ target }) => {
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setDisplay(target);
      return;
    }

    const startVal = 0;
    const duration = 520;
    const startTime = performance.now();
    let rafId = 0;

    const step = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startVal + (target - startVal) * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target]);

  return <>{display}</>;
};

export const AdminAnalyticsView: React.FC<AdminAnalyticsViewProps> = ({
  projects,
  customers,
  reviews,
  contacts,
}) => {
  const [chartMode, setChartMode] = useState<'bar' | 'trend'>('bar');
  const [activeSliceName, setActiveSliceName] = useState<string | null>(null);
  const [previewSample, setPreviewSample] = useState(true);

  const hasLiveProjects = projects.length > 0;
  const usingSampleCharts = !hasLiveProjects && previewSample;

  const liveStatusData = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach((p) => counts.set(p.status, (counts.get(p.status) || 0) + 1));
    return Array.from(counts.entries()).map(([name, value], idx) => ({
      name,
      value,
      color: CHART_COLORS[idx % CHART_COLORS.length],
    }));
  }, [projects]);

  const liveCategoryData = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach((p) => counts.set(p.serviceTitle, (counts.get(p.serviceTitle) || 0) + 1));
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [projects]);

  const liveMonthlyData = useMemo(() => {
    const buckets = new Map<string, { requests: number; completed: number }>();
    projects.forEach((p) => {
      const ms = getMillis(p.createdAt);
      if (!ms) return;
      const d = new Date(ms);
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      const cur = buckets.get(label) || { requests: 0, completed: 0 };
      cur.requests += 1;
      if (p.status === 'Completed') cur.completed += 1;
      buckets.set(label, cur);
    });
    return Array.from(buckets.entries()).map(([month, vals]) => ({
      month,
      requests: vals.requests,
      completed: vals.completed,
    }));
  }, [projects]);

  const statusData = useMemo(() => {
    if (usingSampleCharts) {
      return SAMPLE_STATUS_DATA.map((item, idx) => ({
        ...item,
        color: CHART_COLORS[idx % CHART_COLORS.length],
      }));
    }
    return liveStatusData;
  }, [usingSampleCharts, liveStatusData]);

  const categoryData = usingSampleCharts ? SAMPLE_CATEGORY_DATA : liveCategoryData;
  const monthlyData = usingSampleCharts ? SAMPLE_MONTHLY_DATA : liveMonthlyData;
  const totalStatusCount = Math.max(
    1,
    statusData.reduce((sum, s) => sum + s.value, 0)
  );

  const approvedReviews = reviews.filter((r) => r.moderationStatus === 'approved');
  const avgRating =
    approvedReviews.length > 0
      ? (approvedReviews.reduce((s, r) => s + r.rating, 0) / approvedReviews.length).toFixed(1)
      : '—';

  const summaryCards = [
    { label: 'Total Customers', numericValue: customers.length },
    { label: 'Total Projects', numericValue: projects.length },
    {
      label: 'Pending Review',
      numericValue: projects.filter(
        (p) => p.status === 'Request Submitted' || p.status === 'Reviewing'
      ).length,
    },
    {
      label: 'Active Editing',
      numericValue: projects.filter(
        (p) => p.status === 'Accepted' || p.status === 'Editing in Progress'
      ).length,
    },
    {
      label: 'Completed',
      numericValue: projects.filter((p) => p.status === 'Completed').length,
    },
    {
      label: 'Rejected / Cancelled',
      numericValue: projects.filter(
        (p) => p.status === 'Rejected' || p.status === 'Cancelled'
      ).length,
    },
    { label: 'Average Rating', displayValue: avgRating },
    { label: 'Contact Inquiries', numericValue: contacts.length },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Metrics Grid with staggered GPU animation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {summaryCards.map((c, idx) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.24,
              delay: idx * 0.035,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="rounded-xl bg-[#101014] border border-zinc-800 hover:border-[#D4AF37]/45 p-4 transition-transform duration-200 hover:-translate-y-0.5"
          >
            <p className="text-xs text-zinc-400">{c.label}</p>
            <p className="mt-1.5 text-2xl font-mono-tabular font-semibold text-white">
              {typeof c.numericValue === 'number' ? (
                <AnimatedNumber target={c.numericValue} />
              ) : (
                c.displayValue
              )}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Mode Switch Bar when 0 live requests exist yet */}
      {!hasLiveProjects && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#101014] border border-zinc-800 px-4 py-3">
          <p className="text-xs text-zinc-300">
            {usingSampleCharts
              ? 'Displaying preview sample telemetry so you can inspect the 3D charts and graphs. Live Firestore requests replace this automatically.'
              : 'Live Firestore mode active — charts populate as soon as customers submit editing requests.'}
          </p>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#09090c] border border-zinc-800">
            <button
              type="button"
              onClick={() => setPreviewSample(true)}
              className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                previewSample ? 'bg-[#D4AF37] text-black font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              3D Sample Preview
            </button>
            <button
              type="button"
              onClick={() => setPreviewSample(false)}
              className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                !previewSample ? 'bg-[#D4AF37] text-black font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Live Only (0)
            </button>
          </div>
        </div>
      )}

      {statusData.length === 0 ? (
        <div className="rounded-2xl bg-[#101014] border border-zinc-800 p-10 text-center space-y-2">
          <p className="text-base font-medium text-white">No project activity recorded yet</p>
          <p className="text-xs text-zinc-400">
            Charts and the interactive 3D telemetry stage update automatically as projects arrive.
          </p>
        </div>
      ) : (
        <>
          {/* Interactive 3D Telemetry Stage */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Admin3DAnalyticsScene
              statusData={statusData}
              categoryData={categoryData}
              activeSliceName={activeSliceName}
              onSelectSlice={setActiveSliceName}
              isSamplePreview={usingSampleCharts}
            />
          </motion.div>

          {/* Animated Graph + Synchronized Donut Pie Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Animated Service Volume / Growth Graph */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 rounded-2xl bg-[#101014] border border-zinc-800 p-6 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-display font-semibold text-white">
                    {chartMode === 'bar'
                      ? 'Service Demand Graph'
                      : 'Monthly Velocity & Completion Trend'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {chartMode === 'bar'
                      ? 'Project volume across editing categories'
                      : 'Submitted vs completed requests over time'}
                  </p>
                </div>

                <div className="flex items-center gap-1 p-1 rounded-lg bg-[#09090c] border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setChartMode('bar')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                      chartMode === 'bar'
                        ? 'bg-[#D4AF37] text-black font-semibold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Service Bars</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMode('trend')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                      chartMode === 'trend'
                        ? 'bg-[#D4AF37] text-black font-semibold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Trend Graph</span>
                  </button>
                </div>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  {chartMode === 'bar' ? (
                    <BarChart data={categoryData} margin={{ top: 8, right: 12, left: -12, bottom: 8 }}>
                      <defs>
                        <linearGradient id="goldBarGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#E6C665" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#9A7B22" stopOpacity={0.78} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#22222a" vertical={false} />
                      <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#9ca3af" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip
                        cursor={{ fill: 'rgba(212, 175, 55, 0.08)' }}
                        contentStyle={{
                          backgroundColor: '#0c0c10',
                          border: '1px solid #3f3f46',
                          borderRadius: '10px',
                          fontSize: '12px',
                          color: '#f4f4f5',
                        }}
                      />
                      <Bar
                        dataKey="count"
                        name="Projects"
                        fill="url(#goldBarGrad)"
                        radius={[8, 8, 0, 0]}
                        animationDuration={750}
                      />
                    </BarChart>
                  ) : (
                    <AreaChart data={monthlyData} margin={{ top: 8, right: 12, left: -12, bottom: 8 }}>
                      <defs>
                        <linearGradient id="goldAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="emeraldAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16A34A" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#16A34A" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#22222a" vertical={false} />
                      <XAxis dataKey="month" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#9ca3af" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0c0c10',
                          border: '1px solid #3f3f46',
                          borderRadius: '10px',
                          fontSize: '12px',
                          color: '#f4f4f5',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="requests"
                        name="Requests"
                        stroke="#D4AF37"
                        strokeWidth={2.2}
                        fill="url(#goldAreaGrad)"
                        animationDuration={750}
                      />
                      <Area
                        type="monotone"
                        dataKey="completed"
                        name="Completed"
                        stroke="#16A34A"
                        strokeWidth={2}
                        fill="url(#emeraldAreaGrad)"
                        animationDuration={850}
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Animated Interactive Pie Chart synchronized with 3D Pie Ring */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 rounded-2xl bg-[#101014] border border-zinc-800 p-6 space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-display font-semibold text-white">
                    Status Breakdown Pie Chart
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Click any segment to highlight in 3D
                  </p>
                </div>
                <PieChartIcon className="w-4 h-4 text-[#D4AF37] shrink-0" />
              </div>

              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={82}
                      paddingAngle={3}
                      animationDuration={800}
                      onClick={(entry) => {
                        const clickedName = entry?.name as string | undefined;
                        if (clickedName) {
                          setActiveSliceName((prev) => (prev === clickedName ? null : clickedName));
                        }
                      }}
                    >
                      {statusData.map((entry) => {
                        const isSelected = activeSliceName === entry.name;
                        return (
                          <Cell
                            key={entry.name}
                            fill={entry.color}
                            stroke={isSelected ? '#FFFFFF' : '#09090d'}
                            strokeWidth={isSelected ? 2 : 1}
                            opacity={activeSliceName && !isSelected ? 0.45 : 1}
                            style={{ cursor: 'pointer', transition: 'opacity 180ms ease' }}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0c0c10',
                        border: '1px solid #3f3f46',
                        borderRadius: '10px',
                        fontSize: '12px',
                        color: '#f4f4f5',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Interactive synchronized breakdown list */}
              <div className="space-y-2 border-t border-zinc-800/80 pt-3">
                {statusData.map((entry) => {
                  const pct = Math.round((entry.value / totalStatusCount) * 100);
                  const isActive = activeSliceName === entry.name;
                  return (
                    <button
                      key={entry.name}
                      type="button"
                      onClick={() =>
                        setActiveSliceName((prev) => (prev === entry.name ? null : entry.name))
                      }
                      className={`w-full flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#D4AF37]/15 text-white'
                          : 'text-zinc-300 hover:bg-zinc-900/80'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="truncate">{entry.name}</span>
                      </span>
                      <span className="font-mono-tabular text-zinc-400 shrink-0">
                        {entry.value} · {pct}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
};
