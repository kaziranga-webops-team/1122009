/**
 * YouTube links: the video id inside one, and the pictures YouTube serves
 * for every video, which need no key or account.
 */

/** The 11-character video id from any usual YouTube link, or null (a channel link has none). */
export function youtubeId(url: string | null | undefined): string | null {
  const raw = (url || '').trim();
  if (!raw) return null;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^(www|m|music)\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = u.searchParams.get('v');
    if (!id) {
      const m = u.pathname.match(/^\/(?:live|shorts|embed|v)\/([^/?#]+)/);
      id = m ? m[1] : null;
    }
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

/**
 * A thumbnail for a video. `hq` (480×360) exists for every video; `maxres`
 * (1280×720) only for most, so check it before relying on it.
 */
export function youtubeThumb(id: string, size: 'maxres' | 'hq' | 'mq' = 'hq'): string {
  const file = size === 'maxres' ? 'maxresdefault' : size === 'hq' ? 'hqdefault' : 'mqdefault';
  return `https://i.ytimg.com/vi/${id}/${file}.jpg`;
}
