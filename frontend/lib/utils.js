import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const STATUS_COLORS = {
  'New': 'bg-slate-100 text-slate-700 border border-slate-200',
  'Assigned': 'bg-sky-100 text-sky-700 border border-sky-200',
  'In Progress': 'bg-violet-100 text-violet-700 border border-violet-200',
  'Pending': 'bg-amber-100 text-amber-700 border border-amber-200',
  'Resolved': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  'Escalated': 'bg-red-100 text-red-700 border border-red-200',
};

export const SEVERITY_COLORS = {
  'Low': 'bg-green-100 text-green-700',
  'Medium': 'bg-yellow-100 text-yellow-700',
  'High': 'bg-red-100 text-red-700',
};

export const CATEGORY_ICONS = {
  'Safety': '🦺',
  'Policy': '📋',
  'Facilities': '🏢',
  'HR': '👥',
  'Other': '📌',
};

export function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function timeAgo(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export const ROLE_LABELS = {
  staff: 'Staff',
  secretariat: 'Secretariat',
  case_manager: 'Case Manager',
  admin: 'Admin',
};

export const ROLE_COLORS = {
  staff: 'bg-slate-100 text-slate-700',
  secretariat: 'bg-blue-100 text-blue-700',
  case_manager: 'bg-purple-100 text-purple-700',
  admin: 'bg-rose-100 text-rose-700',
};
