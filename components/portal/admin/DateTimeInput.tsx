'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const pad = (n: number) => String(n).padStart(2, '0');
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
/** The time a date starts with until one is picked: house sessions are mostly in the evening. */
const DEFAULT_HOUR = 19;

/**
 * A date and a time, as `YYYY-MM-DDTHH:mm` (what the editor stores before
 * saving). The browser's own date-and-time box makes you scroll tiny time
 * columns; here the date is a normal calendar box and the time is three plain
 * dropdowns — hour, minute (in fives) and AM/PM — that take one click or a
 * key each.
 */
export function DateTimeInput({
  id,
  value,
  onChange,
  disabled,
  invalid,
  compact = false,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  /** Sheet cells: date on one line and the time under it. */
  compact?: boolean;
}) {
  const [date = '', time = ''] = value ? value.split('T') : [];
  const [hh, mm] = time ? time.split(':').map(Number) : [DEFAULT_HOUR, 0];
  const h24 = Number.isFinite(hh) ? hh : DEFAULT_HOUR;
  const min = Number.isFinite(mm) ? mm : 0;
  const hour12 = h24 % 12 || 12;
  const pm = h24 >= 12;

  const set = (d: string, h: number, m: number) => onChange(d ? `${d}T${pad(h)}:${pad(m)}` : '');
  const to24 = (h: number, isPm: boolean) => (h % 12) + (isPm ? 12 : 0);
  // A time saved before (say 7:42) keeps its minute in the list.
  const minutes = MINUTES.includes(min) ? MINUTES : [...MINUTES, min].sort((a, b) => a - b);

  const box = compact ? 'ed-cell' : 'ed-field';
  const sel = cn(box, 'ed-select !pr-7 [background-position:right_0.4rem_center]');
  const noDate = disabled || !date;

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', compact && 'w-[13.5rem]')}>
      <div className={cn('relative', compact ? 'w-full' : 'w-[11rem]')}>
        <input
          id={id}
          type="date"
          value={date}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          onChange={(e) => set(e.target.value, h24, min)}
          className={cn(box, 'pr-8')}
        />
        {date && !disabled && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear the date"
            title="Clear the date"
            className="absolute right-1.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-ink-faint hover:bg-surface-sunken hover:text-ink"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-1">
        <select
          aria-label="Hour"
          value={hour12}
          disabled={noDate}
          onChange={(e) => set(date, to24(Number(e.target.value), pm), min)}
          className={cn(sel, compact ? 'w-[4rem]' : 'w-[4.5rem]')}
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="text-ink-faint">:</span>
        <select
          aria-label="Minute"
          value={min}
          disabled={noDate}
          onChange={(e) => set(date, h24, Number(e.target.value))}
          className={cn(sel, compact ? 'w-[4.25rem]' : 'w-[4.75rem]')}
        >
          {minutes.map((m) => (
            <option key={m} value={m}>
              {pad(m)}
            </option>
          ))}
        </select>
        <select
          aria-label="AM or PM"
          value={pm ? 'PM' : 'AM'}
          disabled={noDate}
          onChange={(e) => set(date, to24(hour12, e.target.value === 'PM'), min)}
          className={cn(sel, compact ? 'w-[4.25rem]' : 'w-[4.75rem]')}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}
