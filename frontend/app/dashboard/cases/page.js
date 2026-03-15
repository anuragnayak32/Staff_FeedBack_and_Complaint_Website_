'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { StatusBadge, SeverityBadge } from '@/components/Badges';
import { formatDate, CATEGORY_ICONS, timeAgo } from '@/lib/utils';
import Link from 'next/link';
import { Search, Filter, ArrowRight, FileText } from 'lucide-react';

const STATUSES = ['New', 'Assigned', 'In Progress', 'Pending', 'Resolved', 'Escalated'];
const CATEGORIES = ['Safety', 'Policy', 'Facilities', 'HR', 'Other'];
const SEVERITIES = ['Low', 'Medium', 'High'];

export default function CasesPage({ isMyOnly = false }) {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', category: '', severity: '', search: '' });

  const fetchCases = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      if (filters.severity) params.severity = filters.severity;
      if (filters.search) params.search = filters.search;
      const { data } = await api.get('/cases', { params });
      setCases(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCases(); }, [filters]);

  const title = isMyOnly || user?.role === 'staff' ? 'My Cases' : 'All Cases';

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{cases.length} case{cases.length !== 1 ? 's' : ''} found</p>
        </div>
        {user?.role === 'staff' && (
          <Link href="/dashboard/submit" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            + New Case
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="neo-card p-4 mb-5 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search by title or tracking ID..."
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
          />
        </div>
        {[
          { key: 'status', opts: STATUSES, placeholder: 'Status' },
          { key: 'category', opts: CATEGORIES, placeholder: 'Category' },
          { key: 'severity', opts: SEVERITIES, placeholder: 'Severity' },
        ].map(({ key, opts, placeholder }) => (
          <select key={key} value={filters[key]} onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none bg-white text-foreground">
            <option value="">{placeholder}</option>
            {opts.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
        {Object.values(filters).some(Boolean) && (
          <button onClick={() => setFilters({ status: '', category: '', severity: '', search: '' })}
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-slate-50 transition-colors">
            Clear
          </button>
        )}
      </div>

      {/* Cases list */}
      <div className="neo-card divide-y divide-border">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground">Loading cases...</div>
        ) : cases.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={40} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-medium text-foreground mb-1">No cases found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters or submit a new case.</p>
          </div>
        ) : (
          cases.map(c => (
            <Link key={c._id} href={`/dashboard/cases/${c._id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group cursor-pointer">
              <span className="text-2xl w-9 text-center flex-shrink-0">{CATEGORY_ICONS[c.category]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-blue-600 font-semibold">{c.trackingId}</span>
                  <StatusBadge status={c.status} />
                  <SeverityBadge severity={c.severity} />
                </div>
                <p className="text-sm font-medium text-foreground truncate mb-0.5">{c.title}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{c.department}</span>
                  <span>·</span>
                  <span>{c.category}</span>
                  {c.assignedTo && <><span>·</span><span>Assigned to {c.assignedTo.name}</span></>}
                  <span>·</span>
                  <span>{timeAgo(c.createdAt)}</span>
                </div>
              </div>
              <ArrowRight size={15} className="text-muted-foreground/40 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
