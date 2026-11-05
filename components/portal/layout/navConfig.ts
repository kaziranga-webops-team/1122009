import {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  ClipboardList,
  User,
  Bell,
  Users,
  Shield,
  FileSpreadsheet,
  History,
  FolderArchive,
  PlusCircle,
  Globe,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/types/portal';
import { canManageRoles, canUsePortalAdmin, writableResources } from '@/lib/portal/permissions';

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

const studentSection: NavSection = {
  id: 'student',
  label: 'Student Portal',
  items: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Events', href: '/dashboard/events', icon: Calendar },
    { label: 'My Registrations', href: '/dashboard/my-registrations', icon: CalendarCheck },
  ],
};

const adminSection: NavSection = {
  id: 'admin',
  label: 'Admin Suite',
  action: { label: 'Create new event', href: '/admin/events/new', icon: PlusCircle },
  items: [
    { label: 'Admin Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Manage Events', href: '/admin/events', icon: Calendar },
    { label: 'All Registrations', href: '/admin/registrations', icon: ClipboardList },
  ],
};

const superAdminSection: NavSection = {
  id: 'super-admin',
  label: 'Super Admin',
  accent: true,
  items: [
    { label: 'Overview', href: '/super-admin/dashboard', icon: Shield },
    { label: 'Allowed Users', href: '/super-admin/allowed-users', icon: FileSpreadsheet },
    { label: 'Members Directory', href: '/super-admin/roles', icon: Users },
    { label: 'Archived Users', href: '/super-admin/historical-users', icon: FolderArchive },
    { label: 'Audit Logs', href: '/super-admin/audit-logs', icon: History },
  ],
};

/**
 * The website's own content lives behind one nav item, not seven.
 *
 * Seven sibling links pushed the sidebar past twenty items, which is more than
 * anyone scans. The resources become tabs inside the page instead, so the
 * sidebar stays readable and the grouping is still obvious.
 */
function websiteSection(role?: UserRole): NavSection | null {
  const resources = writableResources(role);
  if (!resources.length) return null;
  return {
    id: 'website',
    label: 'Website',
    items: [
      { label: 'Site content', href: `/admin/content/${resources[0]}`, icon: Globe },
    ],
  };
}

const accountSection: NavSection = {
  id: 'account',
  label: 'Account',
  items: [
    { label: 'Profile', href: '/dashboard/profile', icon: User },
    { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  ],
};

/** 
 * The nav sections a given role may see, in display order.
 * Follows Approach 1:
 * - Domain suites: Student Portal, Admin Suite, Super Admin
 * - Dedicated Account section: Profile & Notifications (universal across all roles)
 */
export function getNavSections(role?: UserRole): NavSection[] {
  const sections: NavSection[] = [studentSection];
  if (canUsePortalAdmin(role)) sections.push(adminSection);

  const website = websiteSection(role);
  if (website) sections.push(website);

  if (canManageRoles(role)) sections.push(superAdminSection);
  sections.push(accountSection);
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
