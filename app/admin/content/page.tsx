import { redirect } from 'next/navigation';

/** The content area always opens on Events — the list everyone with access can edit. */
export default function ContentIndexPage() {
  redirect('/admin/content/events');
}
