'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { StatusBadge, SeverityBadge } from '@/components/Badges';
import { formatDate, CATEGORY_ICONS, timeAgo } from '@/lib/utils';
import Link from 'next/link';
import { FileText, TrendingUp, AlertTriangle, CheckCircle, Clock, ArrowRight, Plus } from 'lucide-react';

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="neo-card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={17} className="text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-foreground" style={{ fontFamily: 'Syne, sans-serif' }}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const casesRes = await api.get('/cases');
        setCases(casesRes.data.slice(0, 8));
        if (['secretariat', 'admin'].includes(user?.role)) {
          const analRes = await api.get('/analytics/overview');
          setAnalytics(analRes.data);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, [user]);

  const openCases = cases.filter(c => !['Resolved'].includes(c.status)).length;
  const escalated = cases.filter(c => c.status === 'Escalated').length;
  const resolved = cases.filter(c => c.status === 'Resolved').length;

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="page-subtitle">Here's what's happening across the platform today.</p>
        </div>
        {user?.role === 'staff' && (
          <Link href="/dashboard/submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> New Case
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Cases" value={analytics?.total ?? cases.length} icon={FileText} color="bg-blue-600" />
        <StatCard label="Open Cases" value={openCases} icon={Clock} color="bg-violet-600" />
        <StatCard label="Resolved" value={analytics?.resolved ?? resolved} icon={CheckCircle} color="bg-emerald-600" />
        <StatCard label="Escalated" value={analytics?.escalated ?? escalated} icon={AlertTriangle} color="bg-red-500" sub={escalated > 0 ? 'Needs attention' : 'All clear'} />
      </div>

      {/* Recent Cases */}
      <div className="neo-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground" style={{ fontFamily: 'Syne, sans-serif' }}>Recent Cases</h2>
          <Link href={user?.role === 'staff' ? '/dashboard/my-cases' : '/dashboard/cases'}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : cases.length === 0 ? (
          <div className="p-10 text-center">
            <FileText size={36} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No cases yet.</p>
            {user?.role === 'staff' && (
              <Link href="/dashboard/submit" className="mt-3 inline-flex items-center gap-2 text-blue-600 hover:underline text-sm font-medium">
                Submit your first case <ArrowRight size={13} />
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {cases.map(c => (
              <Link key={c._id} href={`/dashboard/cases/${c._id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors group">
                <span className="text-xl w-8 text-center flex-shrink-0">{CATEGORY_ICONS[c.category]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-blue-600 font-semibold">{c.trackingId}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.department} · {timeAgo(c.createdAt)}</p>
                </div>
                <SeverityBadge severity={c.severity} />
                <ArrowRight size={15} className="text-muted-foreground/40 group-hover:text-blue-500 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
