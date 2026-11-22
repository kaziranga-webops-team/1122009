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
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/types/portal';
import {
  canManageRoles,
  canOrganiseEvents,
  canUsePortalAdmin,
  writableResources,
} from '@/lib/portal/permissions';

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
function organiseSection(role?: UserRole): NavSection | null {
  if (!canOrganiseEvents(role)) return null;
  const items: NavItem[] = [];
  if (canUsePortalAdmin(role)) {
    items.push({ label: 'Overview', href: '/admin/dashboard', icon: Shield });
  }
  items.push(
    { label: 'Events', href: '/admin/events', icon: CalendarCog },
    { label: 'Registrations', href: '/admin/registrations', icon: ClipboardList },
  );
  const resources = writableResources(role);
  if (resources.length) {
    items.push({ label: 'Site content', href: `/admin/content/${resources[0]}`, icon: Globe });
  }
  return {
    id: 'organise',
    label: 'Organise',
    action: { label: 'New event', href: '/admin/events/new', icon: PlusCircle },
    items,
  };
}

/** Who is in the house and what was changed — the super admin's alone. */
const houseSection: NavSection = {
  id: 'house',
  label: 'House admin',
  accent: true,
  items: [
    { label: 'Overview', href: '/super-admin/dashboard', icon: Crown },
    { label: 'Members', href: '/super-admin/roles', icon: Users },
    { label: 'Allowed list', href: '/super-admin/allowed-users', icon: FileSpreadsheet },
    { label: 'Past members', href: '/super-admin/historical-users', icon: FolderArchive },
    { label: 'Audit log', href: '/super-admin/audit-logs', icon: History },
  ],
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
