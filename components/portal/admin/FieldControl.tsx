'use client';

import { cn } from '@/lib/utils';
import type { FieldConfig } from '@/lib/portal/contentFields';
import { tenureLabel } from '@/lib/council';
import { DateTimeInput } from '@/components/portal/admin/DateTimeInput';
import { CompactImageInput, ImageField } from '@/components/portal/admin/ImageField';
import { YouTubePreview } from '@/components/portal/admin/YouTubePreview';
import { youtubeId } from '@/lib/youtube';

/**
 * The input for one field of a website entry. `compact` sizes it for a cell
 * of the sheet; otherwise it fills a row of the pop-up form. Labels, hints
 * and errors are drawn by whoever places it.
 */
export function FieldControl({
  field: f,
  value,
  onChange,
  id,
  compact = false,
  disabled,
  invalid,
  tenure,
  fallbackCover,
}: {
  field: FieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  id: string;
  compact?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  /** For the council year: the years to offer, and which of them already exist. */
  tenure?: { options: string[]; existing: string[] };
  /** For an empty cover image: the picture the website shows instead (a video's thumbnail). */
  fallbackCover?: string | null;
}) {
  const box = compact ? 'ed-cell' : 'ed-field';
  const select = cn(box, 'ed-select', compact ? '!pr-8 [background-position:right_0.5rem_center]' : 'h-11');
  const text = String(value ?? '');

  if (f.type === 'image') {
    return compact ? (
      <CompactImageInput id={id} value={text} disabled={disabled} invalid={invalid} onChange={onChange} />
    ) : (
      <ImageField id={id} label="" value={text} disabled={disabled} onChange={onChange} />
    );
  }

  if (f.type === 'datetime') {
    return <DateTimeInput id={id} value={text} onChange={onChange} disabled={disabled} invalid={invalid} compact={compact} />;
  }

  if (f.type === 'boolean') {
    return (
      <label className={cn('inline-flex cursor-pointer items-center gap-2.5', !compact && 'h-11 rounded-xl border border-hairline bg-surface-sunken px-4')}>
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value)}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-[rgb(var(--brand))]"
        />
        <span className="text-caption text-ink-muted">{value ? 'Yes' : 'No'}</span>
      </label>
    );
  }

  if (f.type === 'textarea') {
    return (
      <textarea
        id={id}
        rows={compact ? 2 : 4}
        value={text}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(e.target.value)}
        placeholder={f.placeholder}
        className={box}
      />
    );
  }

  if (tenure) {
    return (
      <select id={id} value={text} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={select}>
        {tenure.options.map((t) => (
          <option key={t} value={t}>
            {tenureLabel(t)}
            {tenure.existing.includes(t) ? '' : ' (new year)'}
          </option>
        ))}
      </select>
    );
  }

  if (f.type === 'select') {
    return (
      <select
        id={id}
        value={text}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(e.target.value)}
        className={select}
      >
        {!text ? <option value="">Select…</option> : null}
        {/* An older entry typed before this was a list keeps its value. */}
        {text && !f.options?.includes(text) ? <option value={text}>{text}</option> : null}
        {f.options?.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  const input = (
    <input
      id={id}
      type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'}
      // A number box steps by 1 and rejects decimals unless told otherwise;
      // latitude 27.175255 would not be typeable.
      step={f.type === 'number' ? 'any' : undefined}
      inputMode={f.type === 'url' ? 'url' : undefined}
      value={text}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      onChange={(e) => onChange(e.target.value)}
      placeholder={f.type === 'url' ? f.placeholder || 'https://…' : f.placeholder}
      className={box}
    />
  );

  // A YouTube video: show what the link points to, so a wrong link is obvious.
  if (youtubeId(text)) {
    return (
      <div className="space-y-2">
        {input}
        <YouTubePreview url={text} size={compact ? 'cell' : 'card'} />
      </div>
    );
  }

  // An empty cover image with a video to fall back on: say what will show.
  if (!text.trim() && fallbackCover) {
    return (
      <div className="space-y-1.5">
        {input}
        <p className="flex items-center gap-2 text-caption text-ink-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fallbackCover} alt="" className="h-7 w-12 shrink-0 rounded object-cover" />
          {compact ? 'Using the video thumbnail' : 'Left empty, the website shows the video’s thumbnail.'}
        </p>
      </div>
    );
  }

  return input;
}
