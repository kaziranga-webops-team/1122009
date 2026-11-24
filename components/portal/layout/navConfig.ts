import {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  CalendarCog,
  ClipboardList,
  Users,
  Shield,
  Crown,
  FileSpreadsheet,
  History,
  FolderArchive,
  PlusCircle,
  Globe,
  Megaphone,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/types/portal';
import { canManageRoles, canOrganiseEvents, canUsePortalAdmin, writableResources } from '@/lib/portal/permissions';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Light this item for every page under these paths (a hub and its tabs). */
  match?: string[];
  /** Paths under `match` that belong to another item. */
  except?: string[];
}

/** Is this item the current page, or the hub the current page belongs to? */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (pathname === item.href) return true;
  const under = (p: string) => pathname === p || pathname.startsWith(p + '/');
  return (item.match ?? []).some(under) && !(item.except ?? []).some(under);
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
  /** Optional shortcut rendered beside the section label. */
  action?: { label: string; href: string; icon: LucideIcon };
  /** Section is styled with the gold accent rather than the default. */
  accent?: boolean;
}

/** What every member comes to do: see what's on, join it, track it. */
const youSection: NavSection = {
  id: 'you',
  label: 'For you',
  items: [
    { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Events', href: '/dashboard/events', icon: Calendar },
    { label: 'My registrations', href: '/dashboard/my-registrations', icon: CalendarCheck },
  ],
};

/**
 * Running events. Community heads, RCs and admins all organise; only the
 * portal admins get the overview, and only roles that can change the public
 * site get its content screen.
 */
/**
 * Running events and talking to members: the organisers' screens, in the order
 * they are used. Insights (numbers across every event) is for the house's
 * event managers, not community heads.
 */
export function organiseItems(role?: UserRole): NavItem[] {
  if (!canOrganiseEvents(role)) return [];
  const items: NavItem[] = [
    { label: 'Events', href: '/admin/events', icon: CalendarCog },
    { label: 'Registrations', href: '/admin/registrations', icon: ClipboardList },
    { label: 'Announcements', href: '/admin/announcements', icon: Megaphone },
    { label: 'Community pages', href: '/admin/community', icon: UsersRound },
  ];
  if (canUsePortalAdmin(role)) items.push({ label: 'Insights', href: '/admin/dashboard', icon: Shield });
  return items;
}

/**
 * The work, as hubs rather than a dozen links: Organise (events and
 * everything around them), House (people and access) and, for the super
 * admin, Website (what the public site shows). Each hub's screens are the
 * tab row at the top of its pages.
 */
function workSection(role?: UserRole): NavSection | null {
  const items: NavItem[] = [];
  if (organiseItems(role).length) {
    items.push({ label: 'Organise', href: '/admin/events', icon: CalendarCog, match: ['/admin'], except: ['/admin/content'] });
  }
  if (canManageRoles(role)) {
    items.push({ label: 'House', href: '/super-admin/dashboard', icon: Crown, match: ['/super-admin'] });
    items.push({ label: 'Website', href: '/admin/content/council_members', icon: Globe, match: ['/admin/content'] });
  } else if (writableResources(role).length) {
    // Admins run events, meetups and the Study zone; other organisers edit
    // the website's events and sessions.
    items.push({
      label: role === 'ADMIN' ? 'Website' : 'Website events',
      href: '/admin/content/events',
      icon: Globe,
      match: ['/admin/content'],
    });
  }
  if (!items.length) return null;
  return {
    id: 'work',
    label: 'Your work',
    action: organiseItems(role).length ? { label: 'New event', href: '/admin/events/new', icon: PlusCircle } : undefined,
    items,
  };
}

/**
 * Running the house: who can sign in, who holds which role and the record of
 * changes. The super admin's alone. The public website has its own link.
 */
export const HOUSE_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/super-admin/dashboard', icon: Crown },
  { label: 'Members & roles', href: '/super-admin/roles', icon: Users },
  { label: 'Access list', href: '/super-admin/allowed-users', icon: FileSpreadsheet },
  { label: 'Past members', href: '/super-admin/historical-users', icon: FolderArchive },
  { label: 'Activity log', href: '/super-admin/audit-logs', icon: History },
];


/**
 * The sections a role sees, grouped by what the person is there to do rather
 * than by which part of the codebase a screen lives in. Profile and
 * notifications live on the avatar and the bell in the top bar.
 */
export function getNavSections(role?: UserRole): NavSection[] {
  const sections: NavSection[] = [youSection];
  const work = workSection(role);
  if (work) sections.push(work);
  return sections;
}

export const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/kaziranga_iitm/',
    hover: 'hover:text-pink-400',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/kaziranga-iitm/posts/?feedView=all',
    hover: 'hover:text-sky-400',
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@KazirangaHouse',
    hover: 'hover:text-red-400',
  },
] as const;
