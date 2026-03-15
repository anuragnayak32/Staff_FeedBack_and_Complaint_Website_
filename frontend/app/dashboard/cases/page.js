'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { StatusBadge, SeverityBadge } from '@/components/Badges';
import { timeAgo, CATEGORY_ICONS } from '@/lib/utils';
import Link from 'next/link';
import { Search, ArrowRight, FileText, SlidersHorizontal, X } from 'lucide-react';

const STATUSES = ['New', 'Assigned', 'In Progress', 'Pending', 'Resolved', 'Escalated'];
const CATEGORIES = ['Safety', 'Policy', 'Facilities', 'HR', 'Other'];
const SEVERITIES = ['Low', 'Medium', 'High'];

export default function CasesPage() {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', category: '', severity: '', search: '' });
  const [showFilters, setShowFilters] = useState(false);

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

  const hasFilters = Object.values(filters).some(Boolean);
  const title = user?.role === 'staff' ? 'My Cases' : 'All Cases';

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>{title}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{cases.length} case{cases.length !== 1 ? 's' : ''} found</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-border hover:bg-slate-50'}`}>
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Filters</span>
            {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
          </button>
          {user?.role === 'staff' && (
            <Link href="/dashboard/submit"
              className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              + <span className="hidden sm:inline">New Case</span><span className="sm:hidden">New</span>
            </Link>
          )}
        </div>
      </div>

      {/* Search bar always visible */}
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search by title or tracking ID..."
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
        />
        {filters.search && (
          <button onClick={() => setFilters(f => ({ ...f, search: '' }))}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Collapsible filter row */}
      {showFilters && (
        <div className="neo-card p-3 sm:p-4 mb-4 animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {[
              { key: 'status', opts: STATUSES, placeholder: 'All Statuses' },
              { key: 'category', opts: CATEGORIES, placeholder: 'All Categories' },
              { key: 'severity', opts: SEVERITIES, placeholder: 'All Severities' },
            ].map(({ key, opts, placeholder }) => (
              <select key={key} value={filters[key]}
                onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
                className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none bg-white text-foreground col-span-1">
                <option value="">{placeholder}</option>
                {opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ))}
          </div>
          {hasFilters && (
            <button onClick={() => setFilters({ status: '', category: '', severity: '', search: '' })}
              className="mt-2 text-xs text-muted-foreground hover:text-foreground underline">
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Cases list */}
      <div className="neo-card divide-y divide-border">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground text-sm">Loading cases...</div>
        ) : cases.length === 0 ? (
          <div className="p-10 sm:p-12 text-center">
            <FileText size={36} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-medium text-foreground text-sm mb-1">No cases found</p>
            <p className="text-xs text-muted-foreground">Try adjusting your filters.</p>
          </div>
        ) : (
          cases.map(c => (
            <Link key={c._id} href={`/dashboard/cases/${c._id}`}
              className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-4 hover:bg-slate-50 transition-colors group cursor-pointer">
              <span className="text-xl sm:text-2xl w-8 sm:w-9 text-center flex-shrink-0">{CATEGORY_ICONS[c.category]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-0.5">
                  <span className="text-xs font-mono text-blue-600 font-semibold">{c.trackingId}</span>
                  <StatusBadge status={c.status} />
                  <span className="hidden sm:inline"><SeverityBadge severity={c.severity} /></span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-foreground truncate mb-0.5">{c.title}</p>
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs text-muted-foreground">
                  <span>{c.department}</span>
                  <span>·</span>
                  <span>{c.category}</span>
                  {c.assignedTo && <><span>·</span><span className="hidden sm:inline">Assigned to {c.assignedTo.name}</span></>}
                  <span>·</span>
                  <span>{timeAgo(c.createdAt)}</span>
                </div>
              </div>
              <ArrowRight size={14} className="text-muted-foreground/40 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
