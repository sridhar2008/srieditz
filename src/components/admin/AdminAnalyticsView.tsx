import React, { useMemo } from 'react';
import {
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
import { getMillis } from '../../services/studioService';
import { ContactMessage, CustomerReview, EditingProject, UserProfile } from '../../types/studio';

interface AdminAnalyticsViewProps {
  projects: EditingProject[];
  customers: UserProfile[];
  reviews: CustomerReview[];
  contacts: ContactMessage[];
}

const CHART_COLORS = ['#D4AF37', '#F4F4F5', '#94A3B8', '#16A34A', '#D97706', '#DC2626', '#A1A1AA'];

export const AdminAnalyticsView: React.FC<AdminAnalyticsViewProps> = ({
  projects,
  customers,
  reviews,
  contacts,
}) => {
  const statusData = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach((p) => counts.set(p.status, (counts.get(p.status) || 0) + 1));
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }, [projects]);

  const categoryData = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach((p) => counts.set(p.serviceTitle, (counts.get(p.serviceTitle) || 0) + 1));
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [projects]);

  const monthlyData = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach((p) => {
      const ms = getMillis(p.createdAt);
      if (!ms) return;
      const d = new Date(ms);
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      counts.set(label, (counts.get(label) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([month, requests]) => ({ month, requests }));
  }, [projects]);

  const approvedReviews = reviews.filter((r) => r.moderationStatus === 'approved');
  const avgRating =
    approvedReviews.length > 0
      ? (approvedReviews.reduce((s, r) => s + r.rating, 0) / approvedReviews.length).toFixed(1)
      : '—';

  const summaryCards = [
    { label: 'Total Customers', value: customers.length },
    { label: 'Total Projects', value: projects.length },
    { label: 'Pending Review', value: projects.filter((p) => p.status === 'Request Submitted' || p.status === 'Reviewing').length },
    { label: 'Active Editing', value: projects.filter((p) => p.status === 'Accepted' || p.status === 'Editing in Progress').length },
    { label: 'Completed', value: projects.filter((p) => p.status === 'Completed').length },
    { label: 'Rejected / Cancelled', value: projects.filter((p) => p.status === 'Rejected' || p.status === 'Cancelled').length },
    { label: 'Average Rating', value: avgRating },
    { label: 'Contact Inquiries', value: contacts.length },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <div key={c.label} className="rounded-xl bg-[#101014] border border-zinc-800 p-4">
            <p className="text-xs text-zinc-400">{c.label}</p>
            <p className="mt-1 text-2xl font-mono-tabular font-semibold text-white">{c.value}</p>
          </div>
        ))}
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl bg-[#101014] border border-zinc-800 p-10 text-center space-y-2">
          <p className="text-base font-medium text-white">No project activity recorded yet</p>
          <p className="text-xs text-zinc-400">
            Charts populate automatically from live Firestore projects, status transitions, and approved reviews.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-[#101014] border border-zinc-800 p-6 space-y-4">
            <h3 className="text-base font-display font-semibold text-white">
              Popular Services by Project Volume
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" stroke="#a1a1aa" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#a1a1aa" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#101014',
                      border: '1px solid #27272a',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#D4AF37" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl bg-[#101014] border border-zinc-800 p-6 space-y-4">
            <h3 className="text-base font-display font-semibold text-white">
              Project Status Distribution
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={88}
                    paddingAngle={2}
                  >
                    {statusData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#101014',
                      border: '1px solid #27272a',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {monthlyData.length > 0 && (
            <div className="lg:col-span-2 rounded-2xl bg-[#101014] border border-zinc-800 p-6 space-y-4">
              <h3 className="text-base font-display font-semibold text-white">
                Monthly Project Requests
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="month" stroke="#a1a1aa" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#a1a1aa" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#101014',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="requests" fill="#D4AF37" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
