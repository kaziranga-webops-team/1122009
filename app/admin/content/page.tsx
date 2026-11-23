import { redirect } from 'next/navigation';

/** The website editor opens on the council, the part edited most. */
export default function ContentIndexPage() {
  redirect('/admin/content/council_members');
}
