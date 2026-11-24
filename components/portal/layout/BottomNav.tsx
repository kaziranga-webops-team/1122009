'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  Briefcase,
  Calendar,
  CalendarCheck,
  ChevronRight,
  Crown,
  FileSpreadsheet,
  FolderArchive,
  Globe,
  History,
  Home,
  LogOut,
  PlusCircle,
  User as UserIcon,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import { canManageRoles, ROLE_LABELS, writableResources } from '@/lib/portal/permissions';
import { EASE_EDITORIAL } from '@/components/portal/ui/Motion';
import { isNavItemActive, organiseItems, type NavItem } from './navConfig';
import { SocialRow } from './NavList';
import { ThemeToggle } from './ThemeToggle';
import { Avatar } from './Navbar';

interface Group {
  label: string;
  items: NavItem[];
}

/** Names that read well on a phone, where the hub's own tab row is out of sight. */
const SHORT_NAMES: Record<string, string> = {
  '/admin/events': 'Manage events',
  '/admin/dashboard': 'Event insights',
};

/** Everything a role manages, grouped by what it is for. */
function manageGroups(role: Parameters<typeof organiseItems>[0]): Group[] {
  const groups: Group[] = [];
  const organise = organiseItems(role).map((i) => ({ ...i, label: SHORT_NAMES[i.href] ?? i.label, match: [i.href] }));
  if (organise.length) groups.push({ label: 'Events', items: organise });
  if (canManageRoles(role)) {
    groups.push({
      label: 'People and access',
      items: [
        { label: 'House overview', href: '/super-admin/dashboard', icon: Crown, match: ['/super-admin/dashboard'] },
        { label: 'Members and roles', href: '/super-admin/roles', icon: Users, match: ['/super-admin/roles'] },
        { label: 'Who can sign in', href: '/super-admin/allowed-users', icon: FileSpreadsheet, match: ['/super-admin/allowed-users'] },
        { label: 'Past members', href: '/super-admin/historical-users', icon: FolderArchive, match: ['/super-admin/historical-users'] },
        { label: 'Activity log', href: '/super-admin/audit-logs', icon: History, match: ['/super-admin/audit-logs'] },
      ],
    });
    groups.push({
      label: 'Website',
      items: [{ label: 'Edit the website', href: '/admin/content/council_members', icon: Globe, match: ['/admin/content'] }],
    });
  } else if (writableResources(role).length) {
    groups.push({
      label: 'Website',
      items: [{ label: role === 'ADMIN' ? 'Edit the website' : 'Sessions on the website', href: '/admin/content/events', icon: Globe, match: ['/admin/content'] }],
    });
  }
  return groups;
}

/** A panel that rises from the bottom of the screen. */
function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.32, ease: EASE_EDITORIAL }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => (info.offset.y > 90 || info.velocity.y > 500) && onClose()}
            className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[82vh] max-w-lg flex-col rounded-t-[26px] border border-b-0 border-hairline bg-surface-raised shadow-e-4"
          >
            <div className="shrink-0 cursor-grab px-5 pb-2 pt-2.5 active:cursor-grabbing">
              <span className="mx-auto block h-1.5 w-10 rounded-full bg-[rgb(var(--hairline-strong))]" aria-hidden />
              <div className="mt-3 flex items-center justify-between gap-3">
                <h2 className="font-display text-[1.125rem] font-bold text-ink">{title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="grid h-9 w-9 place-items-center rounded-full bg-surface-sunken text-ink-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-[calc(env(safe-area-inset-bottom)+1rem)]">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** One row in a sheet: icon, name, and an arrow. */
function SheetLink({ href, icon: Icon, label, active, badge }: { href: string; icon: LucideIcon; label: string; active?: boolean; badge?: number }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-h-12 items-center gap-3 rounded-2xl px-3 text-[0.9375rem] font-semibold transition-colors',
        active ? 'bg-brand-soft text-brand' : 'text-ink'
      )}
    >
      <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', active ? 'bg-surface-raised' : 'bg-surface-sunken')}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge ? (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-signal-danger px-1.5 text-[0.6875rem] font-bold text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      ) : (
        <ChevronRight className="h-4 w-4 text-ink-faint" aria-hidden />
      )}
    </Link>
  );
}

/**
 * The phone and tablet navigation: a floating bar with Home raised in the
 * middle. Events and your own registrations sit on the left; on the right,
 * everything you manage (one panel, grouped) and you (profile, alerts,
 * theme, the website, sign out). Members, who manage nothing, get their
 * alerts in that slot instead.
 */
export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [sheet, setSheet] = useState<'manage' | 'profile' | null>(null);

  useEffect(() => setSheet(null), [pathname]);

  if (!user) return null;

  const under = (p: string) => pathname === p || pathname.startsWith(p + '/');
  const groups = manageGroups(user.role);
  const manages = groups.length > 0;
  const manageActive = groups.some((g) => g.items.some((i) => isNavItemActive(i, pathname)));
  const firstName = user.name?.trim().split(/\s+/)[0] || 'You';

  const tab = (active: boolean) =>
    cn('flex h-[3.6rem] w-full flex-col items-center justify-center gap-1 rounded-2xl transition-colors', active ? 'text-brand' : 'text-ink-muted');
  const iconWrap = (active: boolean) =>
    cn('relative grid h-7 w-12 place-items-center rounded-full transition-colors duration-300', active && 'bg-brand-soft');
  const label = (active: boolean) => cn('max-w-full truncate px-0.5 text-[0.6875rem] leading-none', active ? 'font-bold' : 'font-medium');

  const side = (href: string, text: string, Icon: LucideIcon, active: boolean, badge?: number) => (
    <li className="min-w-0">
      <Link href={href} aria-current={active ? 'page' : undefined} className={tab(active)}>
        <span className={iconWrap(active)}>
          <Icon className={cn('h-5 w-5', active ? 'stroke-[2.3]' : 'stroke-[1.8]')} />
          {badge ? (
            <span className="absolute -right-0.5 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-signal-danger px-1 text-[0.625rem] font-bold text-white">
              {badge > 9 ? '9+' : badge}
            </span>
          ) : null}
        </span>
        <span className={label(active)}>{text}</span>
      </Link>
    </li>
  );

  const homeActive = pathname === '/dashboard';
  const profileActive = sheet === 'profile' || under('/dashboard/profile') || under('/dashboard/notifications');

  return (
    <>
      <nav aria-label="Primary" className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] lg:hidden">
        <ul className="pointer-events-auto mx-auto grid max-w-md grid-cols-5 items-end rounded-[24px] border border-hairline bg-surface-raised px-1.5 py-1 shadow-e-3">
          {side('/dashboard/events', 'Events', Calendar, under('/dashboard/events'))}
          {side('/dashboard/my-registrations', 'My events', CalendarCheck, under('/dashboard/my-registrations'))}

          {/* Home, raised in the middle. */}
          <li className="flex min-w-0 justify-center">
            <Link
              href="/dashboard"
              aria-label="Home"
              aria-current={homeActive ? 'page' : undefined}
              className="flex flex-col items-center gap-1"
            >
              <span
                className={cn(
                  '-mt-6 grid h-14 w-14 place-items-center rounded-full bg-brand text-white transition-transform duration-300 active:scale-95',
                  'shadow-[0_0_0_5px_rgb(var(--surface)),0_10px_22px_-8px_rgba(0,0,0,0.45)]'
                )}
              >
                <Home className={cn('h-6 w-6', homeActive ? 'stroke-[2.5]' : 'stroke-[2]')} />
              </span>
              <span className={cn(label(homeActive), homeActive ? 'text-brand' : 'text-ink-muted')}>Home</span>
            </Link>
          </li>

          {manages ? (
            <li className="min-w-0">
              <button
                type="button"
                onClick={() => setSheet('manage')}
                aria-haspopup="dialog"
                aria-expanded={sheet === 'manage'}
                className={tab(manageActive || sheet === 'manage')}
              >
                <span className={iconWrap(manageActive || sheet === 'manage')}>
                  <Briefcase className={cn('h-5 w-5', manageActive ? 'stroke-[2.3]' : 'stroke-[1.8]')} />
                </span>
                <span className={label(manageActive || sheet === 'manage')}>Manage</span>
              </button>
            </li>
          ) : (
            side('/dashboard/notifications', 'Alerts', Bell, under('/dashboard/notifications'), unreadCount)
          )}

          <li className="min-w-0">
            <button
              type="button"
              onClick={() => setSheet('profile')}
              aria-haspopup="dialog"
              aria-expanded={sheet === 'profile'}
              className={tab(profileActive)}
            >
              <span className="relative">
                <Avatar
                  src={user.avatarUrl}
                  name={user.name}
                  className={cn('h-7 w-7 text-[0.75rem] transition-shadow', profileActive && 'shadow-[0_0_0_2px_rgb(var(--brand))]')}
                />
                {manages && unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[rgb(var(--surface-raised))] bg-signal-danger" aria-hidden />
                )}
              </span>
              <span className={label(profileActive)}>{firstName}</span>
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={sheet === 'manage'} onClose={() => setSheet(null)} title="Manage">
        {organiseItems(user.role).length > 0 && (
          <Link
            href="/admin/events/new"
            className="mb-2 flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand text-[0.9375rem] font-bold text-white"
          >
            <PlusCircle className="h-5 w-5" /> New event
          </Link>
        )}
        {groups.map((g) => (
          <section key={g.label} className="pt-3">
            <h3 className="px-3 pb-1 text-[0.75rem] font-semibold text-ink-faint">{g.label}</h3>
            {g.items.map((i) => (
              <SheetLink key={i.href} href={i.href} icon={i.icon} label={i.label} active={isNavItemActive(i, pathname)} />
            ))}
          </section>
        ))}
      </Sheet>

      <Sheet open={sheet === 'profile'} onClose={() => setSheet(null)} title="You">
        <div className="mb-2 flex items-center gap-3 rounded-2xl bg-surface-sunken p-3">
          <Avatar src={user.avatarUrl} name={user.name} className="h-12 w-12 shrink-0 text-[1.125rem]" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-ink">{user.name}</p>
            <p className="truncate text-caption text-ink-muted">{user.email}</p>
          </div>
          <span className="shrink-0 rounded-full bg-surface-raised px-2.5 py-1 text-[0.75rem] font-semibold text-ink-muted">
            {ROLE_LABELS[user.role] ?? 'Member'}
          </span>
        </div>
        <SheetLink href="/dashboard/profile" icon={UserIcon} label="My profile" active={under('/dashboard/profile')} />
        <SheetLink href="/dashboard/notifications" icon={Bell} label="Notifications" active={under('/dashboard/notifications')} badge={unreadCount} />
        <SheetLink href="/" icon={Globe} label="Go to the website" />
        <div className="flex min-h-12 items-center justify-between gap-3 rounded-2xl px-3">
          <span className="text-[0.9375rem] font-semibold text-ink">Theme</span>
          <ThemeToggle />
        </div>
        <SocialRow className="justify-center py-2" />
        <button
          type="button"
          onClick={logout}
          className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[rgb(var(--signal-danger)/0.1)] text-[0.9375rem] font-semibold text-signal-danger"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </Sheet>
    </>
  );
};
