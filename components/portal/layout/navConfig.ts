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
import { canManageRoles, canOrganiseEvents, canUsePortalAdmin } from '@/lib/portal/permissions';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
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

function organiseSection(role?: UserRole): NavSection | null {
  const items = organiseItems(role);
  if (!items.length) return null;
  return {
    id: 'organise',
    label: 'Organise',
    action: { label: 'New event', href: '/admin/events/new', icon: PlusCircle },
    items,
  };
}

/**
 * Running the house: who can sign in, who holds which role, the public
 * website and the record of changes. The super admin's alone.
 */
export const HOUSE_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/super-admin/dashboard', icon: Crown },
  { label: 'Members & roles', href: '/super-admin/roles', icon: Users },
  { label: 'Access list', href: '/super-admin/allowed-users', icon: FileSpreadsheet },
  { label: 'Past members', href: '/super-admin/historical-users', icon: FolderArchive },
  { label: 'Website', href: '/admin/content/events', icon: Globe },
  { label: 'Activity log', href: '/super-admin/audit-logs', icon: History },
];

const houseSection: NavSection = {
  id: 'house',
  label: 'House',
  accent: true,
  items: HOUSE_ITEMS,
};

/**
 * The sections a role sees, grouped by what the person is there to do rather
 * than by which part of the codebase a screen lives in. Profile and
 * notifications live on the avatar and the bell in the top bar.
 */
export function getNavSections(role?: UserRole): NavSection[] {
  const sections: NavSection[] = [youSection];
  const organise = organiseSection(role);
  if (organise) sections.push(organise);
  if (canManageRoles(role)) sections.push(houseSection);
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
