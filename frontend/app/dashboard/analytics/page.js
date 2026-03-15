'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { AlertTriangle, TrendingUp, BarChart2 } from 'lucide-react';

const STATUS_COLORS_MAP = {
  'New': '#94a3b8', 'Assigned': '#38bdf8', 'In Progress': '#a78bfa',
  'Pending': '#fbbf24', 'Resolved': '#34d399', 'Escalated': '#f87171',
};
const CATEGORY_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !['secretariat', 'admin'].includes(user.role)) router.push('/dashboard');
  }, [user]);

  useEffect(() => {
    const load = async () => {
      try {
        const [overviewRes, hotspotsRes, trendsRes] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/analytics/hotspots'),
          api.get('/analytics/trends'),
        ]);
        setData(overviewRes.data);
        setHotspots(hotspotsRes.data);
        setTrends(trendsRes.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div className="p-12 text-center text-muted-foreground text-sm">Loading analytics...</div>;
  if (!data) return null;

  const statusData = data.byStatus.map(s => ({ name: s._id, value: s.count, fill: STATUS_COLORS_MAP[s._id] || '#94a3b8' }));
  const categoryData = data.byCategory.map(c => ({ name: c._id, value: c.count }));
  const departmentData = data.byDepartment.slice(0, 8).map(d => ({ name: d._id, value: d.count }));
  const trendData = trends.map(t => ({
    name: `${['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][t._id.month]}`,
    cases: t.count
  }));
  const resolutionRate = data.total > 0 ? Math.round((data.resolved / data.total) * 100) : 0;

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 size={20} className="text-blue-600" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>Analytics</h1>
        </div>
        <p className="text-muted-foreground text-sm">Department insights, case trends and hotspot detection.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Total Cases', value: data.total, color: 'bg-blue-600' },
          { label: 'Resolved', value: data.resolved, color: 'bg-emerald-600' },
          { label: 'Escalated', value: data.escalated, color: 'bg-red-500' },
          { label: 'Resolution Rate', value: `${resolutionRate}%`, color: 'bg-violet-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="neo-card p-4">
            <div className={`w-1 h-7 rounded-full ${color} mb-2`} />
            <p className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>{value}</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Hotspots */}
      {hotspots.length > 0 && (
        <div className="neo-card p-4 sm:p-5 mb-5 border-l-4 border-red-500">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-red-500" />
            <h2 className="font-semibold text-sm sm:text-base" style={{ fontFamily: 'Syne, sans-serif' }}>
              Hotspot Alert — {hotspots.length} flagged area{hotspots.length !== 1 ? 's' : ''}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Departments with 5+ open cases in the same category.</p>
          <div className="space-y-2">
            {hotspots.map((h, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2.5 bg-red-50 rounded-lg border border-red-100">
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-sm">{h._id.department}</span>
                  <span className="mx-1.5 text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">{h._id.category}</span>
                </div>
                <span className="font-bold text-red-600 text-sm flex-shrink-0">{h.count} cases</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts grid — stack on mobile, 2-col on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-5">
        <div className="neo-card p-4 sm:p-5">
          <h2 className="font-semibold mb-4 text-sm sm:text-base" style={{ fontFamily: 'Syne, sans-serif' }}>Cases by Status</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value">
                {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip formatter={(val, name) => [val, name]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="neo-card p-4 sm:p-5">
          <h2 className="font-semibold mb-4 text-sm sm:text-base" style={{ fontFamily: 'Syne, sans-serif' }}>Cases by Category</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryData} barSize={26}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {categoryData.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department bar */}
      <div className="neo-card p-4 sm:p-5 mb-5">
        <h2 className="font-semibold mb-4 text-sm sm:text-base" style={{ fontFamily: 'Syne, sans-serif' }}>Cases by Department</h2>
        <ResponsiveContainer width="100%" height={Math.max(160, departmentData.length * 30)}>
          <BarChart data={departmentData} layout="vertical" barSize={18}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#3b5bdb" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Trend */}
      {trendData.length > 0 && (
        <div className="neo-card p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={15} className="text-blue-600" />
            <h2 className="font-semibold text-sm sm:text-base" style={{ fontFamily: 'Syne, sans-serif' }}>Monthly Trend</h2>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={trendData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="cases" fill="#3b5bdb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
