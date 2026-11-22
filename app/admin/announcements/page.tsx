'use client';
export const dynamic = 'force-dynamic';

import React, { useMemo, useState } from 'react';
import { Pin, PinOff, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AdminNavTabs } from '@/components/portal/admin/AdminNavTabs';
import { SectionHeading } from '@/components/portal/ui/Section';
import { Card } from '@/components/portal/ui/Card';
import { Button } from '@/components/portal/ui/Button';
import { Badge } from '@/components/portal/ui/Badge';
import { ConfirmModal } from '@/components/portal/ui/ConfirmModal';
import { EmptyState } from '@/components/portal/ui/EmptyState';
import { RowSkeleton } from '@/components/portal/ui/Skeleton';
import { useToast } from '@/components/portal/ui/Toast';
import { useAnnouncements } from '@/components/portal/home/useAnnouncements';
import {
  ANNOUNCEMENT_LIMITS,
  announceTargets,
  canAnnounce,
  canPin,
  canRemoveAnnouncement,
  type Announcement,
  type AnnouncementAudience,
} from '@/lib/portal/announcements';
import { postAnnouncement, removeAnnouncement, setAnnouncementPinned } from '@/lib/portal/portalApi';
import { COMMUNITIES, communityBySlug } from '@/lib/communities';

function audienceLabel(a: Pick<Announcement, 'audience' | 'region' | 'communitySlug'>) {
  if (a.audience === 'REGION') return a.region || 'Region';
  if (a.audience === 'COMMUNITY') return communityBySlug(a.communitySlug || '')?.name || 'Community';
  return 'Whole house';
}

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const { items, loading, reload } = useAnnouncements(60);

  const targets = useMemo(() => announceTargets(user ?? { role: undefined }), [user]);
  const communityChoices = targets.communities === null
    ? COMMUNITIES
    : COMMUNITIES.filter((c) => targets.communities!.includes(c.slug));

  const firstAudience: AnnouncementAudience = targets.house ? 'HOUSE' : 'COMMUNITY';
  const [audience, setAudience] = useState<AnnouncementAudience>(firstAudience);
  const [region, setRegion] = useState<string>(targets.regions[0] ?? '');
  const [communitySlug, setCommunitySlug] = useState<string>(communityChoices[0]?.slug ?? '');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [pinned, setPinned] = useState(false);
  const [posting, setPosting] = useState(false);
  const [removing, setRemoving] = useState<Announcement | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // The route guard already keeps members out; this covers a stale view.
  if (!user || !canAnnounce(user)) return null;

  // Heads see what is posted to their communities and the house; admins see all.
  const visible = items.filter(
    (a) => targets.communities === null || a.audience !== 'COMMUNITY' || targets.communities.includes(a.communitySlug || '')
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosting(true);
    try {
      await postAnnouncement({
        title,
        body,
        linkUrl: linkUrl.trim() || undefined,
        audience,
        region: audience === 'REGION' ? region : null,
        communitySlug: audience === 'COMMUNITY' ? communitySlug : null,
        pinned,
      });
      setTitle('');
      setBody('');
      setLinkUrl('');
      setPinned(false);
      toast.success('Announcement posted', audience === 'HOUSE' ? 'Everyone in the house will see it.' : undefined);
      reload();
    } catch (err) {
      toast.error('Not posted', (err as Error).message);
    } finally {
      setPosting(false);
    }
  };

  const togglePin = async (a: Announcement) => {
    setBusyId(a.id);
    try {
      await setAnnouncementPinned(a.id, !a.pinned);
      reload();
    } catch (err) {
      toast.error('Could not update', (err as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    setBusyId(removing.id);
    try {
      await removeAnnouncement(removing.id);
      toast.success('Announcement removed');
      setRemoving(null);
      reload();
    } catch (err) {
      toast.error('Could not remove', (err as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <AdminNavTabs />

      <div className="space-y-6">
        <SectionHeading title="Announcements" size="lg" as="h1" />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] items-start">
          {/* ─── Composer ─── */}
          <Card elevation={1} className="p-5">
            <form onSubmit={submit} className="space-y-4">
              <h2 className="text-[0.9375rem] font-semibold text-ink">New announcement</h2>

              <div className="space-y-1.5">
                <label htmlFor="an-audience" className="block text-[0.8125rem] font-medium text-ink">For</label>
                <select
                  id="an-audience"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as AnnouncementAudience)}
                  className="ed-select"
                >
                  {targets.house && <option value="HOUSE">Whole house</option>}
                  {targets.regions.length > 0 && <option value="REGION">One region</option>}
                  {communityChoices.length > 0 && <option value="COMMUNITY">A community</option>}
                </select>
              </div>

              {audience === 'REGION' && (
                <select aria-label="Region" value={region} onChange={(e) => setRegion(e.target.value)} className="ed-select">
                  {targets.regions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              )}
              {audience === 'COMMUNITY' && (
                <select
                  aria-label="Community"
                  value={communitySlug}
                  onChange={(e) => setCommunitySlug(e.target.value)}
                  className="ed-select"
                  disabled={communityChoices.length <= 1}
                >
                  {communityChoices.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              )}

              <div className="space-y-1.5">
                <label htmlFor="an-title" className="block text-[0.8125rem] font-medium text-ink">Title</label>
                <input
                  id="an-title"
                  required
                  minLength={3}
                  maxLength={ANNOUNCEMENT_LIMITS.title}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="ed-field"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <label htmlFor="an-body" className="block text-[0.8125rem] font-medium text-ink">Message</label>
                  <span className="text-[0.75rem] text-ink-faint nums">{body.length}/{ANNOUNCEMENT_LIMITS.body}</span>
                </div>
                <textarea
                  id="an-body"
                  required
                  rows={5}
                  maxLength={ANNOUNCEMENT_LIMITS.body}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="ed-field"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="an-link" className="block text-[0.8125rem] font-medium text-ink">
                  Link <span className="font-normal text-ink-faint">(optional)</span>
                </label>
                <input
                  id="an-link"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="/dashboard/events or https://…"
                  className="ed-field"
                />
              </div>

              {canPin(user.role) && (
                <label className="flex items-center gap-2 text-[0.8125rem] text-ink">
                  <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
                  Pin to the top
                </label>
              )}

              <Button type="submit" variant="primary" isLoading={posting} fullWidth>
                Post
              </Button>
            </form>
          </Card>

          {/* ─── Posted ─── */}
          <section aria-label="Posted announcements" className="space-y-3">
            {loading ? (
              <>
                <RowSkeleton />
                <RowSkeleton />
              </>
            ) : visible.length === 0 ? (
              <EmptyState title="Nothing posted yet" description="Announcements you post appear here and on everyone's home page." />
            ) : (
              visible.map((a) => (
                <Card key={a.id} elevation={1} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[0.9375rem] font-semibold text-ink">{a.title}</h3>
                        <Badge tone="neutral" size="sm">{audienceLabel(a)}</Badge>
                        {a.pinned && <Badge tone="accent" size="sm">Pinned</Badge>}
                      </div>
                      <p className="text-[0.875rem] text-ink-muted whitespace-pre-line">{a.body}</p>
                      <p className="text-[0.75rem] text-ink-faint">
                        {a.authorName} · {dateFmt.format(new Date(a.createdAt))}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {canPin(user.role) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={a.pinned ? 'Unpin' : 'Pin'}
                          title={a.pinned ? 'Unpin' : 'Pin'}
                          disabled={busyId === a.id}
                          onClick={() => togglePin(a)}
                        >
                          {a.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                        </Button>
                      )}
                      {canRemoveAnnouncement(user, a) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remove"
                          title="Remove"
                          disabled={busyId === a.id}
                          onClick={() => setRemoving(a)}
                          className="text-signal-danger hover:bg-signal-danger/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </section>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={confirmRemove}
        title="Remove this announcement?"
        message="It disappears from everyone's home page. This cannot be undone."
        confirmText="Remove"
        cancelText="Keep it"
        variant="danger"
        isLoading={busyId === removing?.id}
      />
    </div>
  );
}
