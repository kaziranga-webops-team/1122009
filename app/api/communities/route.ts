// GET /api/communities — the edits community heads have saved, keyed by slug.
// Public: it is the same text the communities page shows to anyone.
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/portal/firebase/admin';
import type { CommunityPage } from '@/lib/portal/communityPages';

export const runtime = 'nodejs';
export const revalidate = 300;

export async function GET() {
  if (!adminDb) return NextResponse.json({});
  try {
    const snap = await adminDb.collection('communities').get();
    const pages: Record<string, CommunityPage> = {};
    snap.forEach((d) => {
      const { focus, line, joinUrl, instagramUrl } = d.data() as CommunityPage;
      pages[d.id] = { focus, line, joinUrl, instagramUrl };
    });
    return NextResponse.json(pages);
  } catch (e) {
    console.error('[communities]', e);
    return NextResponse.json({});
  }
}
