'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AdminNavTabs } from '@/components/portal/admin/AdminNavTabs';
import { SectionHeading } from '@/components/portal/ui/Section';
import { Card } from '@/components/portal/ui/Card';
import { Button } from '@/components/portal/ui/Button';
import { EmptyState } from '@/components/portal/ui/EmptyState';
import { useToast } from '@/components/portal/ui/Toast';
import { COMMUNITIES } from '@/lib/communities';
import { canManageCommunity } from '@/lib/portal/permissions';
import { COMMUNITY_PAGE_LIMITS, withPage, type CommunityPage } from '@/lib/portal/communityPages';
import { saveCommunityPage } from '@/lib/portal/portalApi';

/**
 * Community heads keep their community's public card current: what it is
 * about and where to join. Admins and RCs can edit any community.
 */
export default function CommunityPagesPage() {
  const { user } = useAuth();
  const toast = useToast();

  const mine = useMemo(
    () => (user ? COMMUNITIES.filter((c) => canManageCommunity(user, c.slug)) : []),
    [user]
  );
  const [slug, setSlug] = useState('');
  const [pages, setPages] = useState<Record<string, CommunityPage>>({});
  const [focus, setFocus] = useState('');
  const [line, setLine] = useState('');
  const [joinUrl, setJoinUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!slug && mine[0]) setSlug(mine[0].slug);
  }, [mine, slug]);

  useEffect(() => {
    fetch('/api/communities', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : {}))
      .then((p: Record<string, CommunityPage>) => setPages(p || {}))
      .catch(() => {});
  }, []);

  const community = mine.find((c) => c.slug === slug);

  // Fill the form with the saved page, or the built-in text when nothing is saved.
  useEffect(() => {
    if (!community) return;
    const p = pages[community.slug] || {};
    setFocus(p.focus || community.focus);
    setLine(p.line || community.line);
    setJoinUrl(p.joinUrl || '');
    setInstagramUrl(p.instagramUrl || '');
  }, [community, pages]);

  if (!user) return null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!community) return;
    setSaving(true);
    try {
      await saveCommunityPage({ slug: community.slug, focus, line, joinUrl, instagramUrl });
      setPages((p) => ({ ...p, [community.slug]: { focus, line, joinUrl, instagramUrl } }));
      toast.success('Saved', `${community.name}'s page is updated. The public site picks it up within a few minutes.`);
    } catch (err) {
      toast.error('Not saved', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const preview = community ? withPage(community, { focus, line, joinUrl, instagramUrl }) : null;

  return (
    <div>
      <AdminNavTabs />
      <div className="space-y-6">
        <SectionHeading title="Community pages" size="lg" as="h1" />

        {mine.length === 0 ? (
          <EmptyState title="No communities to edit" description="Community heads edit the communities they lead." />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] items-start">
            <Card elevation={1} className="p-5">
              <form onSubmit={save} className="space-y-4">
                {mine.length > 1 && (
                  <div className="space-y-1.5">
                    <label htmlFor="cp-community" className="block text-[0.8125rem] font-medium text-ink">Community</label>
                    <select id="cp-community" value={slug} onChange={(e) => setSlug(e.target.value)} className="ed-select">
                      {mine.map((c) => (
                        <option key={c.slug} value={c.slug}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="cp-focus" className="block text-[0.8125rem] font-medium text-ink">Focus</label>
                  <input id="cp-focus" value={focus} maxLength={COMMUNITY_PAGE_LIMITS.focus} onChange={(e) => setFocus(e.target.value)} className="ed-field" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <label htmlFor="cp-line" className="block text-[0.8125rem] font-medium text-ink">Description</label>
                    <span className="text-[0.75rem] text-ink-faint nums">{line.length}/{COMMUNITY_PAGE_LIMITS.line}</span>
                  </div>
                  <textarea id="cp-line" rows={3} value={line} maxLength={COMMUNITY_PAGE_LIMITS.line} onChange={(e) => setLine(e.target.value)} className="ed-field" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="cp-join" className="block text-[0.8125rem] font-medium text-ink">
                      Join link <span className="font-normal text-ink-faint">(WhatsApp or form)</span>
                    </label>
                    <input id="cp-join" type="url" value={joinUrl} onChange={(e) => setJoinUrl(e.target.value)} placeholder="https://chat.whatsapp.com/…" className="ed-field" />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="cp-ig" className="block text-[0.8125rem] font-medium text-ink">Instagram</label>
                    <input id="cp-ig" type="url" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/…" className="ed-field" />
                  </div>
                </div>

                <Button type="submit" variant="primary" isLoading={saving}>Save</Button>
              </form>
            </Card>

            {preview && (
              <aside aria-label="Preview">
                <p className="mb-2 text-[0.8125rem] font-medium text-ink-muted">Preview</p>
                <div
                  className="rounded-[14px] p-6 text-center"
                  style={{ background: preview.bg, color: preview.ink, outline: '2px solid currentColor', outlineOffset: '-8px' }}
                >
                  <preview.Icon className="mx-auto w-9 h-9" aria-hidden />
                  <p className="mt-3 text-[1.25rem]" style={{ fontFamily: 'var(--kz-f-display)' }}>{preview.name}</p>
                  <p className="mt-2 text-[0.75rem] font-semibold opacity-85">{preview.focus}</p>
                  <p className="mt-2 text-[0.875rem] opacity-90">{preview.line}</p>
                  {(preview.joinUrl || preview.instagramUrl) && (
                    <p className="mt-4 flex justify-center gap-4 text-[0.8125rem] font-semibold">
                      {preview.joinUrl && <span className="inline-flex items-center gap-1">Join <ExternalLink className="w-3.5 h-3.5" /></span>}
                      {preview.instagramUrl && <span className="inline-flex items-center gap-1">Instagram <ExternalLink className="w-3.5 h-3.5" /></span>}
                    </p>
                  )}
                </div>
              </aside>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
