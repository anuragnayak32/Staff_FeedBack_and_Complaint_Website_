'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { cn, ROLE_LABELS, ROLE_COLORS } from '@/lib/utils';
import {
  LayoutDashboard, FileText, Users, BarChart2,
  Globe, Vote, LogOut, ChevronRight, Shield, Inbox
} from 'lucide-react';

const NAV_ITEMS = {
  staff: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/submit', label: 'Submit Case', icon: FileText },
    { href: '/dashboard/my-cases', label: 'My Cases', icon: Inbox },
    { href: '/dashboard/hub', label: 'Public Hub', icon: Globe },
    { href: '/dashboard/polls', label: 'Polls', icon: Vote },
  ],
  secretariat: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/cases', label: 'All Cases', icon: Inbox },
    { href: '/dashboard/hub', label: 'Public Hub', icon: Globe },
    { href: '/dashboard/polls', label: 'Polls', icon: Vote },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart2 },
  ],
  case_manager: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/my-cases', label: 'My Cases', icon: Inbox },
    { href: '/dashboard/hub', label: 'Public Hub', icon: Globe },
  ],
  admin: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/cases', label: 'All Cases', icon: Inbox },
    { href: '/dashboard/users', label: 'User Management', icon: Users },
    { href: '/dashboard/hub', label: 'Public Hub', icon: Globe },
    { href: '/dashboard/polls', label: 'Polls', icon: Vote },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart2 },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;
  const items = NAV_ITEMS[user.role] || NAV_ITEMS.staff;

  return (
    <aside className="w-64 min-h-screen bg-[#0f1b3d] flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none" style={{ fontFamily: 'Syne, sans-serif' }}>NeoConnect</p>
            <p className="text-blue-300 text-xs mt-0.5">Staff Platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon size={18} className={cn(active ? 'text-white' : 'text-slate-500 group-hover:text-white')} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 font-bold text-sm">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user.name}</p>
            <span className={cn('text-xs px-1.5 py-0.5 rounded-full', ROLE_COLORS[user.role])}>
              {ROLE_LABELS[user.role]}
            </span>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-slate-400 hover:text-red-400 text-sm w-full px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
