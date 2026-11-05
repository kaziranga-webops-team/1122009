import { redirect } from 'next/navigation';

export default function MyRegistrationsRedirect() {
  redirect('/dashboard/my-registrations');
}
