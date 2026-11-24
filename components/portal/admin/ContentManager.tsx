'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, ExternalLink, Lock, Maximize2, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { Button } from '@/components/portal/ui/Button';
import { Badge } from '@/components/portal/ui/Badge';
import { Modal } from '@/components/portal/ui/Modal';
import { ConfirmModal } from '@/components/portal/ui/ConfirmModal';
import { SearchInput } from '@/components/portal/ui/SearchInput';
import { EmptyState } from '@/components/portal/ui/EmptyState';
import { Field } from '@/components/portal/ui/Field';
import { useToast } from '@/components/portal/ui/Toast';
import { FieldControl } from '@/components/portal/admin/FieldControl';
import { YouTubePreview, youtubeFallbackCover } from '@/components/portal/admin/YouTubePreview';
import { youtubeId } from '@/lib/youtube';
import { useAuth } from '@/context/AuthContext';
import { isMockMode } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { can, type ContentResource } from '@/lib/portal/permissions';
import { CONTENT_FIELDS, type FieldConfig } from '@/lib/portal/contentFields';
import { RESOURCE_LABELS } from '@/lib/portal/contentSchema';
import {
  ContentApiError,
  createContent,
  deleteContent,
  listContent,
  updateContent,
  type ContentRow,
} from '@/lib/portal/contentClient';
import { FIRST_TENURE, tenureLabel } from '@/lib/council';

/** '' for text, false for booleans — never undefined, so inputs stay controlled. */
function blankRow(fields: FieldConfig[]): Record<string, unknown> {
  return Object.fromEntries(fields.map((f) => [f.name, f.type === 'boolean' ? false : '']));
}

const pad = (n: number) => String(n).padStart(2, '0');

/** A stored instant as the editor's date-and-time value, in the browser's time. */
function toLocalInput(iso: unknown): string {
  if (!iso) return '';
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** The council year after this one: '2026-27' → '2027-28'. */
function nextTenure(t: string): string {
  const start = Number(t.slice(0, 4)) + 1;
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

const tenureOfRow = (row: ContentRow) => String(row.tenure || '').trim() || FIRST_TENURE;

/** A stored date as people read it, in Indian time: "12 Jul 2026". */
function showDate(value: unknown): string {
  const t = new Date(String(value));
  if (Number.isNaN(t.getTime())) return String(value);
  return t.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' });
}

/** The same with the time: "12 Jul 2026, 7:00 pm". */
function showDateTime(value: unknown): string {
  const t = new Date(String(value));
  if (Number.isNaN(t.getTime())) return String(value);
  return t.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** "youtube.com" for a YouTube link: enough to tell links apart in a cell. */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Link';
  }
}

/** Fields that hold a picture's link, shown as the picture itself. */
const isPictureField = (f: FieldConfig) => f.type === 'image' || /^(image_url|poster)$/.test(f.name);

/** The field that holds each list's real date; the rest sort by when they were added. */
const DATE_FIELD: Partial<Record<ContentResource, string>> = {
  events: 'starts_at',
  meetups: 'starts_at',
  revision_sessions: 'held_at',
  academic_dates: 'starts_on',
};

type SortKey = 'newest' | 'oldest' | 'site' | 'az';
const SORTS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'site', label: 'Website order' },
  { value: 'az', label: 'A to Z' },
];

/** How wide each kind of column is in the sheet. */
function columnWidth(f: FieldConfig, headline: boolean): string {
  if (headline) return '15rem';
  switch (f.type) {
    case 'textarea':
      return '19rem';
    case 'datetime':
      return '15rem';
    case 'image':
      return '17rem';
    case 'boolean':
    case 'number':
      return '7rem';
    case 'select':
      return '11.5rem';
    case 'date':
      return '10rem';
    default:
      return '12.5rem';
  }
}

/** True on screens wide enough for the sheet (1024 px and up). */
function useWideScreen(): boolean {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(min-width: 1024px)');
    const update = () => setWide(m.matches);
    update();
    m.addEventListener('change', update);
    return () => m.removeEventListener('change', update);
  }, []);
  return wide;
}

/** Small dropdowns for the toolbar. */
const toolSelect =
  // On phones they share each row evenly instead of stacking one per line.
  'ed-select h-9 min-w-0 flex-1 basis-[calc(50%-0.25rem)] sm:flex-none sm:basis-auto rounded-lg border border-hairline bg-surface-sunken pl-3 !pr-8 [background-position:right_0.5rem_center] text-[0.8125rem] text-ink';

/**
 * The editor for one kind of website content.
 *
 * On a wide screen it is a sheet: every field is a column, and the pencil
 * turns that one row into inputs, saved with the tick (or Enter) and
 * abandoned with the cross (or Esc). On a phone or tablet each entry is a
 * card, and editing opens a form in a pop-up.
 */
export function ContentManager({ resource }: { resource: ContentResource }) {
  const toast = useToast();
  const { user } = useAuth();
  const config = CONTENT_FIELDS[resource];
  const labels = RESOURCE_LABELS[resource];
  const wide = useWideScreen();

  const [rows, setRows] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const [editing, setEditing] = useState<ContentRow | 'new' | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [initial, setInitial] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<ContentRow | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);
  const sheet = useRef<HTMLDivElement>(null);

  const dirty = editing !== null && JSON.stringify(form) !== initial;

  // The council is kept year by year: the editor shows one year's council at
  // a time (the newest first), and new members join the year in view.
  const isCouncil = resource === 'council_members';
  const [picked, setPicked] = useState<string | null>(null);
  const [extraYear, setExtraYear] = useState<string | null>(null);
  const years = useMemo(() => {
    if (!isCouncil) return [];
    const set = new Set(rows.map(tenureOfRow));
    if (extraYear) set.add(extraYear);
    return Array.from(set).sort().reverse();
  }, [isCouncil, rows, extraYear]);
  const year = picked ?? years[0] ?? FIRST_TENURE;
  const showAll = picked === 'all';

  // An RC may only touch the council row linked to their profile, so the
  // ownership context is the same one the server will re-check.
  const ctxFor = useCallback(
    (row?: ContentRow) =>
      resource === 'council_members' ? { rowId: row?.id ?? null, ownRowId: user?.councilMemberId ?? null } : {},
    [resource, user?.councilMemberId]
  );

  const mayCreate = can(user?.role, resource, 'create', ctxFor());
  const mayEdit = useCallback((row: ContentRow) => can(user?.role, resource, 'update', ctxFor(row)), [ctxFor, resource, user?.role]);
  const mayDelete = useCallback((row: ContentRow) => can(user?.role, resource, 'delete', ctxFor(row)), [ctxFor, resource, user?.role]);

  /** `quiet` keeps the list on screen while it refreshes (after a save). */
  const load = useCallback(
    async (quiet = false) => {
      // Demo mode has no Firebase session, so there is no ID token to send and
      // every call would come back 401. Say that plainly instead.
      if (isMockMode) {
        setLoading(false);
        setLoadError(
          'Demo mode is on, so there is no signed-in account to authorise changes. Set NEXT_PUBLIC_USE_MOCK_FIREBASE=false and sign in to edit website content.'
        );
        return;
      }
      if (!quiet) setLoading(true);
      setLoadError(null);
      try {
        const res = await listContent(resource, { q: query });
        setRows(res.rows);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Could not load this list.');
      } finally {
        setLoading(false);
      }
    },
    [resource, query]
  );

  useEffect(() => {
    void load();
  }, [load]);

  /** Starts editing a row (or a new one), after asking before unsaved changes are dropped. */
  function begin(target: ContentRow | 'new', values: Record<string, unknown>) {
    if (dirty && !window.confirm('Discard the changes you have not saved?')) return;
    // The pencil keeps focus otherwise, and the browser scrolls the sheet to
    // where it thinks that frozen button sits once the row changes.
    (document.activeElement as HTMLElement | null)?.blur();
    setFieldErrors({});
    setForm(values);
    setInitial(JSON.stringify(values));
    setEditing(target);
  }

  function openCreate() {
    const blank = blankRow(config.fields);
    if (isCouncil) blank.tenure = showAll ? years[0] ?? FIRST_TENURE : year;
    begin('new', blank);
    sheet.current?.scrollTo({ top: 0 });
  }

  function openEdit(row: ContentRow) {
    begin(
      row,
      Object.fromEntries(
        config.fields.map((f) => [
          f.name,
          f.type === 'datetime'
            ? toLocalInput(row[f.name])
            : f.type === 'boolean'
              ? Boolean(row[f.name])
              : isCouncil && f.name === 'tenure'
                ? tenureOfRow(row)
                : (row[f.name] ?? ''),
        ])
      )
    );
  }

  function cancel(ask = false) {
    if (saving) return;
    if (ask && dirty && !window.confirm('Discard the changes you have not saved?')) return;
    setEditing(null);
    setFieldErrors({});
  }

  // In the sheet, the cursor goes straight to the row being edited. The sheet
  // stays where it was sideways; it only scrolls up or down to show the row.
  const editKey = editing === 'new' ? 'new' : editing?.id ?? null;
  useEffect(() => {
    if (!wide || !editKey) return;
    requestAnimationFrame(() => {
      const box = sheet.current;
      const tr = box?.querySelector<HTMLElement>('tr[data-editing]');
      if (!box || !tr) return;
      const head = box.querySelector('thead')?.getBoundingClientRect().height ?? 0;
      const r = tr.getBoundingClientRect();
      const c = box.getBoundingClientRect();
      if (r.top < c.top + head) box.scrollTop -= c.top + head - r.top;
      else if (r.bottom > c.bottom) box.scrollTop += r.bottom - c.bottom;
      tr.querySelector<HTMLElement>(':is(input:not([type=checkbox]):not([type=file]), select, textarea):not(:disabled)')?.focus({
        preventScroll: true,
      });
    });
  }, [wide, editKey]);

  // ─── Sliding the sheet sideways ───
  // Arrow buttons on its edges, a thick scrollbar, and click-and-drag on any
  // row that is not being edited, like moving a map.
  const [edges, setEdges] = useState({ left: false, right: false, frozenL: 0, frozenR: 0 });
  const measure = useCallback(() => {
    const box = sheet.current;
    if (!box) return;
    const ths = box.querySelectorAll('thead th');
    const frozenL = (ths[0] as HTMLElement | undefined)?.offsetWidth ?? 0;
    const frozenR = (ths[ths.length - 1] as HTMLElement | undefined)?.offsetWidth ?? 0;
    const left = box.scrollLeft > 4;
    const right = box.scrollLeft + box.clientWidth < box.scrollWidth - 4;
    setEdges((e) =>
      e.left === left && e.right === right && e.frozenL === frozenL && e.frozenR === frozenR ? e : { left, right, frozenL, frozenR }
    );
  }, []);
  useEffect(() => {
    const box = sheet.current;
    if (!box) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    const table = box.querySelector('table');
    if (table) ro.observe(table);
    return () => ro.disconnect();
  });

  /** Tabbing to a cell never leaves it hidden under a frozen column. */
  function keepInView(target: EventTarget) {
    const box = sheet.current;
    const td = (target as HTMLElement).closest?.('td');
    if (!box || !td || td.classList.contains('sticky')) return;
    const r = td.getBoundingClientRect();
    const c = box.getBoundingClientRect();
    const minLeft = c.left + edges.frozenL;
    const maxRight = c.right - edges.frozenR;
    if (r.left < minLeft) box.scrollLeft -= minLeft - r.left + 8;
    else if (r.right > maxRight) box.scrollLeft += r.right - maxRight + 8;
  }

  function slide(direction: 1 | -1) {
    const box = sheet.current;
    if (!box) return;
    const view = box.clientWidth - edges.frozenL - edges.frozenR;
    box.scrollBy({ left: direction * Math.max(view * 0.8, 200), behavior: 'smooth' });
  }

  const drag = useRef<{ x: number; y: number; left: number; top: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  // A button or field in a frozen column, once focused, makes the browser
  // scroll to where that cell would be if it were not frozen (the far end of
  // the row). For a moment after a press there, the sheet keeps its place.
  const hold = useRef<{ left: number; until: number } | null>(null);
  function onSheetScroll() {
    const box = sheet.current;
    const h = hold.current;
    if (box && h && performance.now() < h.until && Math.abs(box.scrollLeft - h.left) > 1) box.scrollLeft = h.left;
    measure();
  }
  function onSheetPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    if (target.closest('td.sticky, th.sticky')) hold.current = { left: e.currentTarget.scrollLeft, until: performance.now() + 500 };
    if (e.button !== 0 || e.pointerType !== 'mouse') return;
    if (target.closest('input, select, textarea, button, a, label, tr[data-editing], thead')) return;
    const box = e.currentTarget;
    drag.current = { x: e.clientX, y: e.clientY, left: box.scrollLeft, top: box.scrollTop, moved: false };
  }
  function onSheetPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      d.moved = true;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    e.currentTarget.scrollLeft = d.left - dx;
    e.currentTarget.scrollTop = d.top - dy;
  }
  function onSheetPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (drag.current?.moved && e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    drag.current = null;
    setDragging(false);
  }

  // The full form, on a wide screen: for a row with long text, or when one
  // line of inputs is too much at once. It edits the same values as the row.
  const [fullForm, setFullForm] = useState(false);
  useEffect(() => {
    if (!editing) setFullForm(false);
  }, [editing]);

  async function save() {
    if (!editing || saving) return;
    setSaving(true);
    setFieldErrors({});

    const payload: Record<string, unknown> = {};
    for (const f of config.fields) {
      if (f.lockedAfterCreate && editing !== 'new') continue;
      payload[f.name] = f.type === 'datetime' ? fromLocalInput(String(form[f.name] ?? '')) : form[f.name];
    }

    try {
      if (editing === 'new') {
        await createContent(resource, payload);
        toast.success(`${labels.singular[0].toUpperCase()}${labels.singular.slice(1)} added`, 'It is live on the website now.');
      } else {
        const { ignored } = await updateContent(resource, editing.id, payload);
        if (ignored?.length) toast.success('Saved', `Some fields were not yours to change: ${ignored.join(', ')}.`);
        else toast.success('Saved', 'The website has been updated.');
      }
      setEditing(null);
      await load(true);
    } catch (e) {
      if (e instanceof ContentApiError) {
        if (e.fieldErrors) setFieldErrors(e.fieldErrors);
        toast.error('Could not save', e.message);
      } else {
        toast.error('Could not save', (e as Error).message);
      }
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusyDelete(true);
    try {
      await deleteContent(resource, deleting.id);
      toast.success('Deleted', `The ${labels.singular} has been removed from the website.`);
      setDeleting(null);
      await load(true);
    } catch (e) {
      toast.error('Could not delete', (e as Error).message);
    } finally {
      setBusyDelete(false);
    }
  }

  const headline = config.columns[0].name;
  const badgeColumns = useMemo(() => new Set(config.columns.filter((c) => c.type === 'badge').map((c) => c.name)), [config.columns]);
  // The sheet's columns: the row's name first, then every other field in form order.
  const sheetFields = useMemo(() => {
    const first = config.fields.find((f) => f.name === headline);
    return first ? [first, ...config.fields.filter((f) => f !== first)] : config.fields;
  }, [config.fields, headline]);

  // Sorting and filters. Newest first by default: the latest is what people look for.
  const [sort, setSort] = useState<SortKey>('newest');
  const [filters, setFilters] = useState<Record<string, string>>({});
  useEffect(() => {
    setFilters({});
    setSort('newest');
    setEditing(null);
  }, [resource]);

  // A list with a real date sorts by it, and entries without one go last.
  // Other lists sort by when each entry was added.
  const dateOf = useCallback(
    (row: ContentRow): number | null => {
      const field = DATE_FIELD[resource];
      const t = Date.parse(String((field ? row[field] : row.created_at) || ''));
      return Number.isFinite(t) ? t : null;
    },
    [resource]
  );
  const byDate = useCallback(
    (a: ContentRow, b: ContentRow, newestFirst: boolean) => {
      const x = dateOf(a);
      const y = dateOf(b);
      if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1;
      return newestFirst ? y - x : x - y;
    },
    [dateOf]
  );

  // One dropdown per list field that actually has more than one value here.
  const filterFields = useMemo(
    () =>
      config.fields
        .filter((f) => f.type === 'select' && !(isCouncil && f.name === 'tenure'))
        .map((f) => ({
          f,
          values: Array.from(new Set(rows.map((r) => String(r[f.name] ?? '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
        }))
        .filter((x) => x.values.length > 1),
    [config.fields, rows, isCouncil]
  );

  const visible = useMemo(() => {
    let list = isCouncil && !showAll ? rows.filter((r) => tenureOfRow(r) === year) : rows;
    for (const [name, value] of Object.entries(filters)) {
      if (value) list = list.filter((r) => String(r[name] ?? '').trim() === value);
    }
    const title = (r: ContentRow) => String(r[headline] ?? '').toLowerCase();
    const order = (r: ContentRow) => Number(r.sort_order ?? 0);
    const sorted = [...list];
    if (sort === 'newest') sorted.sort((a, b) => byDate(a, b, true));
    else if (sort === 'oldest') sorted.sort((a, b) => byDate(a, b, false));
    else if (sort === 'az') sorted.sort((a, b) => title(a).localeCompare(title(b)));
    else sorted.sort((a, b) => order(a) - order(b));
    return sorted;
  }, [isCouncil, showAll, rows, year, filters, sort, byDate, headline]);
  const filtering = Object.values(filters).some(Boolean);

  // The years a council member can be put in: every year already on record,
  // plus the next one, so a new council can be started from the form too.
  const tenureOptions = useMemo(() => {
    if (!isCouncil) return [];
    const set = new Set(years.length ? years : [FIRST_TENURE]);
    set.add(nextTenure(Array.from(set).sort().reverse()[0]));
    const current = String(form.tenure ?? '').trim();
    if (current) set.add(current);
    return Array.from(set).sort().reverse();
  }, [isCouncil, years, form.tenure]);
  const tenureFor = (f: FieldConfig) => (isCouncil && f.name === 'tenure' ? { options: tenureOptions, existing: years } : undefined);

  function pickYear(value: string) {
    if (value === '__next__') {
      const next = nextTenure(years[0] ?? FIRST_TENURE);
      setExtraYear(next);
      setPicked(next);
    } else {
      setPicked(value);
    }
  }

  const set = (name: string) => (v: unknown) => setForm((s) => ({ ...s, [name]: v }));

  /** One cell of a row that is not being edited. */
  function showCell(f: FieldConfig, row: ContentRow) {
    const value = row[f.name];
    if (f.type === 'boolean') {
      return (
        <Badge tone={value ? 'live' : 'neutral'} size="sm">
          {value ? 'Yes' : 'No'}
        </Badge>
      );
    }
    if (isCouncil && f.name === 'tenure') return <span className="text-caption text-ink">{tenureLabel(tenureOfRow(row))}</span>;
    if (value === null || value === undefined || value === '') {
      // A session with no cover but a video: the website shows the video's thumbnail.
      const fallback = f.name === 'image_url' ? youtubeFallbackCover(row.youtube_url) : null;
      if (fallback) {
        return (
          <span className="flex items-center gap-2 text-caption text-ink-faint" title="No cover set: the website shows the video's thumbnail">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fallback} alt="" loading="lazy" className="h-9 w-16 shrink-0 rounded-md object-cover opacity-80" />
            From YouTube
          </span>
        );
      }
      return <span className="text-ink-faint">—</span>;
    }
    if (f.type === 'datetime') return <span className="text-caption tabular-nums text-ink">{showDateTime(value)}</span>;
    if (f.type === 'date') return <span className="text-caption tabular-nums text-ink">{showDate(value)}</span>;
    if (isPictureField(f)) {
      return (
        <a href={String(value)} target="_blank" rel="noopener noreferrer" title="Open the picture">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={String(value)} alt="" loading="lazy" className="h-10 w-16 rounded-md object-cover" />
        </a>
      );
    }
    const text = String(value);
    if (youtubeId(text)) return <YouTubePreview url={text} size="cell" />;
    if (/^(https?:|mailto:)/i.test(text)) {
      return (
        <a href={text} target="_blank" rel="noopener noreferrer" title={text} className="inline-flex max-w-full items-center gap-1 text-caption text-brand hover:underline">
          <span className="truncate">{text.startsWith('mailto:') ? text.slice(7) : hostOf(text)}</span>
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      );
    }
    if (badgeColumns.has(f.name)) return <Badge tone="brand" size="sm">{text}</Badge>;
    if (f.name === headline) return <span className="line-clamp-2 font-semibold text-ink" title={text}>{text}</span>;
    return (
      <span className="line-clamp-2 text-caption text-ink-muted" title={text}>
        {text}
      </span>
    );
  }

  /** The row being edited, as inputs in the same columns. */
  function editRow(key: string) {
    const isNew = editing === 'new';
    return (
      <tr
        key={key}
        data-editing=""
        onFocus={(e) => keepInView(e.target)}
        onKeyDown={(e) => {
          const el = e.target as HTMLInputElement;
          if (e.key === 'Escape') {
            e.preventDefault();
            cancel(true);
          } else if (e.key === 'Enter' && el.tagName === 'INPUT' && el.type !== 'checkbox' && el.type !== 'file') {
            e.preventDefault();
            void save();
          }
        }}
      >
        {sheetFields.map((f, i) => {
          const error = fieldErrors[f.name]?.[0];
          return (
            <td
              key={f.name}
              className={cn(
                'border-b border-r border-hairline px-2 py-2 align-top',
                i === 0 && 'sticky left-0 z-10 shadow-[1px_0_0_rgb(var(--hairline))]'
              )}
            >
              <FieldControl
                field={f}
                id={`cell-${f.name}`}
                compact
                value={form[f.name]}
                onChange={set(f.name)}
                disabled={Boolean(f.lockedAfterCreate && !isNew)}
                invalid={Boolean(error)}
                tenure={tenureFor(f)}
                fallbackCover={f.name === 'image_url' ? youtubeFallbackCover(form.youtube_url) : null}
              />
              {error && <p className="mt-1 text-[0.75rem] leading-snug text-signal-danger">{error}</p>}
            </td>
          );
        })}
        <td className="sticky right-0 z-10 border-b border-hairline px-2 py-2 align-top shadow-[-1px_0_0_rgb(var(--hairline))]">
          <div className="flex items-center justify-end gap-1">
            <Button size="sm" onClick={() => void save()} isLoading={saving} leftIcon={<Check className="h-4 w-4" />}>
              {isNew ? 'Add' : 'Save'}
            </Button>
            <Button variant="ghost" size="icon" aria-label="Open as a form" title="Open as a form" onClick={() => setFullForm(true)} disabled={saving}>
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Cancel" title="Cancel (Esc)" onClick={() => cancel()} disabled={saving}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  const noun = labels.title.toLowerCase();
  const nextYear = nextTenure(years[0] ?? FIRST_TENURE);
  const showSheet = wide && (visible.length > 0 || editing === 'new');

  return (
    <div className="space-y-4">
      {/* ─── One toolbar: year, search, sort, filters, count, actions ─── */}
      <div className="flex flex-wrap items-center gap-2">
        {isCouncil && !loading && !loadError && (
          <select aria-label="Council year" value={showAll ? 'all' : year} onChange={(e) => pickYear(e.target.value)} className={cn(toolSelect, 'font-semibold')}>
            {years.map((y) => (
              <option key={y} value={y}>
                {tenureLabel(y)} · {rows.filter((r) => tenureOfRow(r) === y).length}
              </option>
            ))}
            <option value="all">All years · {rows.length}</option>
            {mayCreate && !extraYear && <option value="__next__">+ Start {tenureLabel(nextYear)}</option>}
          </select>
        )}
        <SearchInput value={query} onChange={setQuery} size="sm" placeholder={`Search ${noun}…`} containerClassName="w-full sm:w-56" />
        {!loading && !loadError && rows.length > 1 && (
          <>
            <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={toolSelect}>
              {SORTS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {filterFields.map(({ f, values }) => (
              <select
                key={f.name}
                aria-label={f.label}
                value={filters[f.name] ?? ''}
                onChange={(e) => setFilters((x) => ({ ...x, [f.name]: e.target.value }))}
                className={cn(toolSelect, 'sm:max-w-[11rem]', filters[f.name] && 'border-brand font-semibold')}
              >
                <option value="">{`Any ${f.label.toLowerCase()}`}</option>
                {values.map((v) => (
                  <option key={v} value={v}>
                    {v} ({rows.filter((r) => String(r[f.name] ?? '').trim() === v).length})
                  </option>
                ))}
              </select>
            ))}
            {filtering && (
              <button type="button" onClick={() => setFilters({})} className="h-9 rounded-lg px-2.5 text-[0.8125rem] font-semibold text-brand hover:bg-surface-sunken">
                Clear
              </button>
            )}
          </>
        )}
        <span className="ml-auto whitespace-nowrap text-caption text-ink-faint">
          {loading ? 'Loading…' : visible.length === rows.length ? `${rows.length} ${rows.length === 1 ? labels.singular : noun}` : `${visible.length} of ${rows.length}`}
        </span>
        <Button variant="ghost" size="icon" aria-label="Refresh" title="Refresh" onClick={() => void load()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        {mayCreate && (
          <Button size="sm" onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />} disabled={editing === 'new' && wide}>
            Add {labels.singular}
          </Button>
        )}
      </div>

      {/* ─── List ─── */}
      {loadError ? (
        <EmptyState title="Could not load this list" description={loadError} action={<Button size="sm" onClick={() => void load()}>Try again</Button>} />
      ) : loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-sunken" />
          ))}
        </div>
      ) : !showSheet && visible.length === 0 ? (
        <EmptyState
          title={query ? 'Nothing matches that search' : isCouncil && !showAll ? `No one in the ${tenureLabel(year)} council yet` : `No ${noun} yet`}
          description={query ? 'Try a different word.' : undefined}
          action={mayCreate && !query ? <Button size="sm" onClick={openCreate}>Add the first one</Button> : undefined}
        />
      ) : showSheet ? (
        /* Wide screens: the sheet. */
        <div className="relative overflow-hidden rounded-xl border border-hairline bg-surface-raised">
          {edges.left && (
            <button
              type="button"
              onClick={() => slide(-1)}
              aria-label="Show the columns to the left"
              title="Show the columns to the left"
              style={{ left: edges.frozenL + 10 }}
              className="ed-sheet-arrow absolute top-1/2 z-40 -translate-y-1/2"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {edges.right && (
            <button
              type="button"
              onClick={() => slide(1)}
              aria-label="Show more columns"
              title="Show more columns"
              style={{ right: edges.frozenR + 10 }}
              className="ed-sheet-arrow absolute top-1/2 z-40 -translate-y-1/2"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
          <div
            ref={sheet}
            onScroll={onSheetScroll}
            onPointerDown={onSheetPointerDown}
            onPointerMove={onSheetPointerMove}
            onPointerUp={onSheetPointerUp}
            onPointerCancel={onSheetPointerUp}
            className={cn('ed-sheet-scroll max-h-[calc(100vh-13rem)] overflow-auto', dragging && 'is-dragging')}
          >
            <table className="ed-sheet w-max min-w-full border-separate border-spacing-0 text-left">
              <thead>
                <tr>
                  {sheetFields.map((f, i) => (
                    <th
                      key={f.name}
                      scope="col"
                      title={f.hint}
                      style={{ minWidth: columnWidth(f, i === 0), width: columnWidth(f, i === 0) }}
                      className={cn(
                        'sticky top-0 z-20 whitespace-nowrap border-b border-r border-hairline bg-surface-sunken px-3 py-2 text-[0.75rem] font-semibold text-ink-muted',
                        i === 0 && 'left-0 z-30 shadow-[1px_0_0_rgb(var(--hairline))]'
                      )}
                    >
                      {isCouncil && f.name === 'tenure' ? 'Council year' : f.label}
                    </th>
                  ))}
                  <th className="sticky right-0 top-0 z-30 w-px border-b border-hairline bg-surface-sunken px-3 py-2 shadow-[-1px_0_0_rgb(var(--hairline))]">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {editing === 'new' && editRow('new')}
                {visible.map((row) => {
                  if (editing !== 'new' && editing?.id === row.id) return editRow(`edit-${row.id}`);
                  const editable = mayEdit(row);
                  const removable = mayDelete(row);
                  return (
                    <tr key={row.id}>
                      {sheetFields.map((f, i) => (
                        <td
                          key={f.name}
                          onDoubleClick={editable ? () => openEdit(row) : undefined}
                          className={cn(
                            'max-w-0 border-b border-r border-hairline px-3 py-2 align-middle',
                            i === 0 && 'sticky left-0 z-10 shadow-[1px_0_0_rgb(var(--hairline))]'
                          )}
                        >
                          {showCell(f, row)}
                        </td>
                      ))}
                      <td className="sticky right-0 z-10 border-b border-hairline px-2 py-1.5 shadow-[-1px_0_0_rgb(var(--hairline))]">
                        <div className="flex items-center justify-end gap-0.5">
                          {editable ? (
                            <Button variant="ghost" size="icon" aria-label="Edit this row" title="Edit this row" onClick={() => openEdit(row)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="grid h-10 w-10 place-items-center text-ink-faint" title="You can only edit your own entry">
                              <Lock className="h-4 w-4" />
                            </span>
                          )}
                          {removable && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Delete"
                              title="Delete"
                              onClick={() => setDeleting(row)}
                              className="text-signal-danger hover:bg-signal-danger/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Phones and tablets: one card per entry; editing opens the form. */
        <ul className="grid gap-2 sm:grid-cols-2">
          {visible.map((row) => {
            const editable = mayEdit(row);
            const removable = mayDelete(row);
            const details = config.columns
              .slice(1)
              .map((c) => (c.name === 'starts_at' || c.name === 'held_at') && row[c.name] ? showDate(row[c.name]) : row[c.name])
              .filter((v) => typeof v === 'string' && v && !/^https?:\/\//.test(v))
              .join(' · ');
            const pic = config.columns[0].type === 'image' ? String(row[headline] || '') : '';
            return (
              <li key={row.id} className="flex gap-3 rounded-xl border border-hairline bg-surface-raised p-3.5">
                {pic && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pic} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  {!pic && <p className="font-semibold text-ink">{String(row[headline] || '—')}</p>}
                  {details && <p className={cn('text-[0.875rem] text-ink-muted line-clamp-2', !pic && 'mt-0.5')}>{details}</p>}
                  {(editable || removable) && (
                    <div className="mt-2.5 flex gap-2">
                      {editable && (
                        <Button variant="secondary" size="sm" onClick={() => openEdit(row)} leftIcon={<Pencil className="h-4 w-4" />}>
                          Edit
                        </Button>
                      )}
                      {removable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleting(row)}
                          leftIcon={<Trash2 className="h-4 w-4" />}
                          className="text-signal-danger hover:bg-signal-danger/10"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* ─── Phones and tablets: the form in a pop-up ─── */}
      <Modal
        isOpen={editing !== null && (!wide || fullForm)}
        // On a wide screen closing the form goes back to the row, edits kept.
        onClose={() => (wide ? setFullForm(false) : cancel())}
        title={editing === 'new' ? `Add ${labels.singular}` : `Edit ${labels.singular}`}
        maxWidth="3xl"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => cancel()} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void save()} isLoading={saving}>
              {editing === 'new' ? 'Add' : 'Save changes'}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {config.fields.map((f) => {
            const error = fieldErrors[f.name]?.[0] ?? null;
            return (
              <Field
                key={f.name}
                label={isCouncil && f.name === 'tenure' ? 'Council year' : f.label}
                hint={f.hint}
                error={error}
                htmlFor={`f-${f.name}`}
                className={f.wide || f.type === 'textarea' || f.type === 'image' ? 'sm:col-span-2' : ''}
              >
                <FieldControl
                  field={f}
                  id={`f-${f.name}`}
                  value={form[f.name]}
                  onChange={set(f.name)}
                  disabled={Boolean(f.lockedAfterCreate && editing !== 'new')}
                  invalid={Boolean(error)}
                  tenure={tenureFor(f)}
                  fallbackCover={f.name === 'image_url' ? youtubeFallbackCover(form.youtube_url) : null}
                />
              </Field>
            );
          })}
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
        isLoading={busyDelete}
        variant="danger"
        title={`Delete this ${labels.singular}?`}
        message={`"${String(deleting?.[headline] ?? '')}" will be removed from the website immediately. This cannot be undone, though the deleted row is kept in the audit log.`}
        confirmText="Delete"
      />
    </div>
  );
}
