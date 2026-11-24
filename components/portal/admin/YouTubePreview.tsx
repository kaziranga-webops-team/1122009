'use client';

import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { youtubeId, youtubeThumb } from '@/lib/youtube';

type Info = { title: string; channel: string } | null;

/** Video id → its title and channel, asked of YouTube once per page. */
const cache = new Map<string, Promise<Info>>();

function videoInfo(id: string): Promise<Info> {
  let found = cache.get(id);
  if (!found) {
    // YouTube's oEmbed answers browsers directly, without a key.
    found = fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { title?: string; author_name?: string } | null) => (j?.title ? { title: j.title, channel: j.author_name || '' } : null))
      .catch(() => null);
    cache.set(id, found);
  }
  return found;
}

function useVideoInfo(id: string | null): { info: Info; loading: boolean } {
  const [state, setState] = useState<{ id: string | null; info: Info }>({ id: null, info: null });
  useEffect(() => {
    if (!id) return;
    let alive = true;
    void videoInfo(id).then((info) => alive && setState({ id, info }));
    return () => {
      alive = false;
    };
  }, [id]);
  return { info: state.id === id ? state.info : null, loading: Boolean(id) && state.id !== id };
}

/**
 * What a pasted YouTube link points to: the thumbnail, the video's title and
 * its channel, so you can tell at a glance it is the right session.
 * `size="cell"` is the small version for a sheet cell.
 */
export function YouTubePreview({ url, size = 'card', className }: { url: string; size?: 'card' | 'cell'; className?: string }) {
  const id = youtubeId(url);
  const { info, loading } = useVideoInfo(id);
  if (!id) return null;

  if (size === 'cell') {
    return (
      <a
        href={`https://www.youtube.com/watch?v=${id}`}
        target="_blank"
        rel="noopener noreferrer"
        title={info?.title || 'Open on YouTube'}
        className={cn('flex min-w-0 items-center gap-2 text-caption text-ink hover:underline', className)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={youtubeThumb(id, 'mq')} alt="" loading="lazy" className="h-9 w-16 shrink-0 rounded-md object-cover" />
        <span className="line-clamp-2 min-w-0 leading-snug">{info?.title || (loading ? 'Loading…' : 'YouTube video')}</span>
      </a>
    );
  }

  return (
    <a
      href={`https://www.youtube.com/watch?v=${id}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-start gap-3 rounded-xl border border-hairline bg-surface-sunken p-2.5 text-left transition-colors',
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={youtubeThumb(id, 'mq')} alt="" loading="lazy" className="aspect-video w-32 shrink-0 rounded-lg object-cover" />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-[0.875rem] font-semibold leading-snug text-ink">
          {info?.title || (loading ? 'Loading the video…' : 'YouTube video')}
        </span>
        {info?.channel && <span className="mt-0.5 block truncate text-caption text-ink-muted">{info.channel}</span>}
        <span className="mt-1 inline-flex items-center gap-1 text-caption font-medium text-brand">
          Open on YouTube <ExternalLink className="h-3 w-3" />
        </span>
      </span>
    </a>
  );
}

/** The cover a session shows when none is set: its video's thumbnail. */
export function youtubeFallbackCover(youtubeUrl: unknown): string | null {
  const id = youtubeId(String(youtubeUrl || ''));
  return id ? youtubeThumb(id, 'mq') : null;
}
