'use client';

import React, { useRef, useState } from 'react';
import { ImageUp, Loader2 } from 'lucide-react';
import { Field } from '@/components/portal/ui/Field';
import { useToast } from '@/components/portal/ui/Toast';
import { auth } from '@/lib/firebase';

/**
 * A picture for the website: upload one (it goes to the house's Cloudinary
 * account) or paste a link, with a preview of what will show.
 */
export function ImageField({
  id,
  label,
  hint,
  error,
  value,
  disabled,
  onChange,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  value: string;
  disabled?: boolean;
  onChange: (url: string) => void;
  className?: string;
}) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    try {
      const token = await auth?.currentUser?.getIdToken();
      if (!token) throw new Error('You are signed out. Sign in again to upload.');
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || 'Upload failed. Try again.');
      onChange(data.url);
      toast.success('Picture uploaded', 'Save to put it on the website.');
    } catch (e) {
      toast.error('Upload failed', (e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <Field label={label} hint={hint} error={error} htmlFor={id} className={className}>
      <div className="flex gap-3">
        <div className="grid h-[5.5rem] w-[5.5rem] shrink-0 place-items-center overflow-hidden rounded-xl border border-hairline bg-surface-sunken">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageUp className="h-6 w-6 text-ink-faint" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            id={id}
            type="url"
            value={value}
            disabled={disabled || busy}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://…"
            className="ed-field"
          />
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
            }}
          />
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => input.current?.click()}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-hairline bg-surface-raised px-3.5 text-[0.875rem] font-semibold text-ink hover:bg-surface-sunken disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ImageUp className="h-4 w-4" aria-hidden />}
            {busy ? 'Uploading…' : value ? 'Replace picture' : 'Upload picture'}
          </button>
        </div>
      </div>
    </Field>
  );
}
