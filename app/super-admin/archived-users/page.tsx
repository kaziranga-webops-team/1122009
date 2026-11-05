import { redirect } from 'next/navigation';

export default function SuperAdminArchivedUsersRedirect() {
  redirect('/super-admin/historical-users');
}
