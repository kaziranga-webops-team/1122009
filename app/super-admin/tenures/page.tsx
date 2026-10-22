import { redirect } from 'next/navigation';

export default function SuperAdminTenuresRedirect() {
  redirect('/super-admin/dashboard');
}
