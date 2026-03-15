'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { cn, ROLE_LABELS, ROLE_COLORS } from '@/lib/utils';
import {
  LayoutDashboard, FileText, Users, BarChart2,
  Globe, Vote, LogOut, ChevronRight, Shield, Inbox, Menu, X
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

function NavLinks({ items, pathname, onClose }) {
  return (
    <>
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            onClick={onClose}
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
    </>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;
  const items = NAV_ITEMS[user.role] || NAV_ITEMS.staff;

  const SidebarContent = ({ onClose = () => {} }) => (
    <div className="flex flex-col h-full bg-[#0f1b3d]">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none" style={{ fontFamily: 'Syne, sans-serif' }}>NeoConnect</p>
            <p className="text-blue-300 text-xs mt-0.5">Staff Platform</p>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white p-1">
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavLinks items={items} pathname={pathname} onClose={onClose} />
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 font-bold text-sm flex-shrink-0">
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
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex w-64 min-h-screen flex-col bg-[#0f1b3d] flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#0f1b3d] border-b border-white/10 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Shield size={15} className="text-white" />
          </div>
          <p className="text-white font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>NeoConnect</p>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl animate-slide-in">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
