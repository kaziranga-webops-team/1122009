'use client';

import { useCallback, useEffect, useState } from 'react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db, isMockMode } from '@/lib/firebase';
import type { Announcement } from '@/lib/portal/announcements';

/** The latest announcements, pinned ones first. `reload` re-reads after a change. */
export function useAnnouncements(max = 40) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (isMockMode) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      const snap = await getDocs(query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(max)));
      const list = snap.docs.map((d) => ({ ...(d.data() as Announcement), id: d.id }));
      list.sort((a, b) => Number(b.pinned) - Number(a.pinned));
      setItems(list);
    } catch (err) {
      console.error('Announcements: could not load', err);
    } finally {
      setLoading(false);
    }
  }, [max]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, loading, reload };
}
