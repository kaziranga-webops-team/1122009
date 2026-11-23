'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, RefreshCw, Trash2, ExternalLink, Lock } from 'lucide-react';
import { Button } from '@/components/portal/ui/Button';
import { Badge } from '@/components/portal/ui/Badge';
import { Modal } from '@/components/portal/ui/Modal';
import { ConfirmModal } from '@/components/portal/ui/ConfirmModal';
import { SearchInput } from '@/components/portal/ui/SearchInput';
import { EmptyState } from '@/components/portal/ui/EmptyState';
import { Field, Input, Textarea } from '@/components/portal/ui/Field';
import { useToast } from '@/components/portal/ui/Toast';
import { ImageField } from '@/components/portal/admin/ImageField';
import { useAuth } from '@/context/AuthContext';
import { isMockMode } from '@/lib/firebase';
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

/** An ISO instant as the value <input type="datetime-local"> expects. */
function toLocalInput(iso: unknown): string {
  if (!iso) return '';
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

/** The field that holds each list's real date; the rest sort by when they were added. */
const DATE_FIELD: Partial<Record<ContentResource, string>> = {
  events: 'starts_at',
  meetups: 'starts_at',
  revision_sessions: 'held_at',
};

type SortKey = 'newest' | 'oldest' | 'site' | 'az';
const SORTS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'site', label: 'Order on the website' },
  { value: 'az', label: 'A to Z' },
];

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function ContentManager({ resource }: { resource: ContentResource }) {
  const toast = useToast();
  const { user } = useAuth();
  const config = CONTENT_FIELDS[resource];
  const labels = RESOURCE_LABELS[resource];

  const [rows, setRows] = useState<ContentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const [editing, setEditing] = useState<ContentRow | 'new' | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<ContentRow | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);

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
      resource === 'council_members'
        ? { rowId: row?.id ?? null, ownRowId: user?.councilMemberId ?? null }
        : {},
    [resource, user?.councilMemberId]
  );

  const mayCreate = can(user?.role, resource, 'create', ctxFor());
  const mayEdit = useCallback((row: ContentRow) => can(user?.role, resource, 'update', ctxFor(row)), [can, ctxFor, resource, user?.role]);
  const mayDelete = useCallback((row: ContentRow) => can(user?.role, resource, 'delete', ctxFor(row)), [ctxFor, resource, user?.role]);

  const load = useCallback(async () => {
    // Demo mode has no Firebase session, so there is no ID token to send and
    // every call would come back 401. Say that plainly instead.
    if (isMockMode) {
      setLoading(false);
      setLoadError(
        'Demo mode is on, so there is no signed-in account to authorise changes. Set NEXT_PUBLIC_USE_MOCK_FIREBASE=false and sign in to edit website content.'
      );
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const res = await listContent(resource, { q: query });
      setRows(res.rows);
      setTotal(res.total);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load this list.');
    } finally {
      setLoading(false);
    }
  }, [resource, query]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setFieldErrors({});
    const blank = blankRow(config.fields);
    if (isCouncil) blank.tenure = showAll ? years[0] ?? FIRST_TENURE : year;
    setForm(blank);
    setEditing('new');
  }

  function openEdit(row: ContentRow) {
    setFieldErrors({});
    setForm(
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
    setEditing(row);
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    setFieldErrors({});

    const payload: Record<string, unknown> = {};
    for (const f of config.fields) {
      if (f.lockedAfterCreate && editing !== 'new') continue;
      payload[f.name] =
        f.type === 'datetime' ? fromLocalInput(String(form[f.name] ?? '')) : form[f.name];
    }

    try {
      if (editing === 'new') {
        await createContent(resource, payload);
        toast.success(`${labels.singular} created`, 'It is live on the website now.');
      } else {
        const { ignored } = await updateContent(resource, editing.id, payload);
        if (ignored?.length) {
          toast.success('Saved', `Some fields were not yours to change: ${ignored.join(', ')}.`);
        } else {
          toast.success('Saved', 'The website has been updated.');
        }
      }
      setEditing(null);
      await load();
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
      await load();
    } catch (e) {
      toast.error('Could not delete', (e as Error).message);
    } finally {
      setBusyDelete(false);
    }
  }

  const headline = config.columns[0].name;

  // Sorting and filters. Newest first by default: the latest is what people look for.
  const [sort, setSort] = useState<SortKey>('newest');
  const [filters, setFilters] = useState<Record<string, string>>({});
  useEffect(() => {
    setFilters({});
    setSort('newest');
  }, [resource]);

  const dateOf = useCallback(
    (row: ContentRow) => {
      const field = DATE_FIELD[resource];
      const t = Date.parse(String((field && row[field]) || ''));
      return Number.isFinite(t) ? t : Date.parse(String(row.created_at || '')) || 0;
    },
    [resource]
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
    if (sort === 'newest') sorted.sort((a, b) => dateOf(b) - dateOf(a));
    else if (sort === 'oldest') sorted.sort((a, b) => dateOf(a) - dateOf(b));
    else if (sort === 'az') sorted.sort((a, b) => title(a).localeCompare(title(b)));
    else sorted.sort((a, b) => order(a) - order(b));
    return sorted;
  }, [isCouncil, showAll, rows, year, filters, sort, dateOf, headline]);
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

  function startNextYear() {
    const next = nextTenure(years[0] ?? FIRST_TENURE);
    setExtraYear(next);
    setPicked(next);
  }

  return (
    <div className="space-y-5">
      {/* ─── Sort and filters ─── */}
      {!loading && !loadError && rows.length > 1 && (
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1">
            <span className="block text-micro font-semibold text-ink-muted">Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="ed-select h-10 rounded-xl border border-hairline bg-surface-sunken px-3 text-[0.875rem] text-ink">
              {SORTS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {filterFields.map(({ f, values }) => (
            <label key={f.name} className="space-y-1">
              <span className="block text-micro font-semibold text-ink-muted">{f.label}</span>
              <select
                value={filters[f.name] ?? ''}
                onChange={(e) => setFilters((x) => ({ ...x, [f.name]: e.target.value }))}
                className="ed-select h-10 max-w-[14rem] rounded-xl border border-hairline bg-surface-sunken px-3 text-[0.875rem] text-ink"
              >
                <option value="">All</option>
                {values.map((v) => (
                  <option key={v} value={v}>
                    {v} ({rows.filter((r) => String(r[f.name] ?? '').trim() === v).length})
                  </option>
                ))}
              </select>
            </label>
          ))}
          {filtering && (
            <Button variant="ghost" size="sm" onClick={() => setFilters({})}>
              Clear filters
            </Button>
          )}
          <span className="ml-auto self-center text-caption text-ink-faint">
            Showing {visible.length} of {rows.length}
          </span>
        </div>
      )}

      {/* ─── Toolbar ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={`Search ${labels.title.toLowerCase()}…`}
            containerClassName="w-full sm:w-72"
          />
          <span className="text-caption text-ink-faint whitespace-nowrap">
            {loading ? 'Loading…' : `${total} ${total === 1 ? labels.singular : labels.title.toLowerCase()}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => void load()} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          {mayCreate && (
            <Button size="sm" onClick={openCreate} leftIcon={<Plus className="w-4 h-4" />}>
              New {labels.singular}
            </Button>
          )}
        </div>
      </div>

      {/* ─── Council years ─── */}
      {isCouncil && !loading && !loadError && (
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Council year">
          {years.map((y) => {
            const n = rows.filter((r) => tenureOfRow(r) === y).length;
            const active = !showAll && y === year;
            return (
              <button
                key={y}
                type="button"
                onClick={() => setPicked(y)}
                aria-pressed={active}
                className={`h-8 rounded-full px-3 text-[0.8125rem] font-medium transition-colors ${
                  active ? 'bg-ink text-surface' : 'bg-surface-sunken text-ink-muted hover:text-ink'
                }`}
              >
                {tenureLabel(y)} <span className="opacity-70">· {n}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setPicked('all')}
            aria-pressed={showAll}
            className={`h-8 rounded-full px-3 text-[0.8125rem] font-medium transition-colors ${
              showAll ? 'bg-ink text-surface' : 'bg-surface-sunken text-ink-muted hover:text-ink'
            }`}
          >
            All years
          </button>
          {mayCreate && !extraYear && (
            <Button variant="ghost" size="sm" onClick={startNextYear} leftIcon={<Plus className="w-4 h-4" />}>
              Start {tenureLabel(nextTenure(years[0] ?? FIRST_TENURE))}
            </Button>
          )}
        </div>
      )}

      {/* ─── List ─── */}
      {loadError ? (
        <EmptyState
          title="Could not load this list"
          description={loadError}
          action={<Button size="sm" onClick={() => void load()}>Try again</Button>}
        />
      ) : loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-surface-sunken animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          title={
            query
              ? 'Nothing matches that search'
              : isCouncil && !showAll
                ? `No one in the ${tenureLabel(year)} council yet`
                : `No ${labels.title.toLowerCase()} yet`
          }
          description={
            query
              ? 'Try a different word.'
              : isCouncil && !showAll
                ? 'Add each member here. They appear on the website once saved, and the newest year shows first there.'
                : undefined
          }
          action={mayCreate && !query ? <Button size="sm" onClick={openCreate}>Add the first one</Button> : undefined}
        />
      ) : (
        <>
        {/* Phones: one card per entry, with its actions at hand. */}
        <ul className="space-y-2 md:hidden">
          {visible.map((row) => {
            const editable = mayEdit(row);
            const removable = mayDelete(row);
            const details = config.columns
              .slice(1)
              .map((c) => (c.name === 'starts_at' || c.name === 'held_at') && row[c.name] ? showDate(row[c.name]) : row[c.name])
              .filter((v) => typeof v === 'string' && v && !/^https?:\/\//.test(v))
              .join(' · ');
            return (
              <li key={row.id} className="rounded-2xl border border-hairline bg-surface-raised p-4">
                <p className="font-semibold text-ink">{String(row[headline] || '—')}</p>
                {details && <p className="mt-0.5 text-[0.875rem] text-ink-muted line-clamp-2">{details}</p>}
                {(editable || removable) && (
                  <div className="mt-3 flex gap-2">
                    {editable && (
                      <Button variant="secondary" size="sm" onClick={() => openEdit(row)} leftIcon={<Pencil className="w-4 h-4" />}>
                        Edit
                      </Button>
                    )}
                    {removable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleting(row)}
                        leftIcon={<Trash2 className="w-4 h-4" />}
                        className="text-signal-danger hover:bg-signal-danger/10"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <div className="hidden overflow-hidden rounded-2xl border border-hairline bg-surface-raised md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-hairline bg-surface-sunken/60">
                  {config.columns.map((c) => (
                    <th key={c.name} className="px-4 py-2.5 text-[0.75rem] font-semibold text-ink-muted whitespace-nowrap">
                      {c.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 w-px" />
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => {
                  const editable = mayEdit(row);
                  const removable = mayDelete(row);
                  return (
                    <tr key={row.id} className="border-b border-hairline last:border-b-0 hover:bg-surface-sunken/40">
                      {config.columns.map((c) => {
                        const value = row[c.name];
                        return (
                          <td key={c.name} className="px-4 py-3 align-middle max-w-[22rem]">
                            {c.type === 'boolean' ? (
                              <Badge tone={value ? 'live' : 'neutral'} size="sm">
                                {value ? 'Yes' : 'No'}
                              </Badge>
                            ) : (c.name === 'starts_at' || c.name === 'held_at') && value ? (
                              <span className="text-caption tabular-nums text-ink">{showDate(value)}</span>
                            ) : c.type === 'image' && value ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={String(value)} alt="" className="h-12 w-12 rounded-lg object-cover" />
                            ) : c.type === 'badge' && value ? (
                              <Badge tone="brand" size="sm">{String(value)}</Badge>
                            ) : c.name === headline ? (
                              <span className="font-display font-bold text-ink line-clamp-1">
                                {String(value || '—')}
                              </span>
                            ) : typeof value === 'string' && /^https?:\/\//.test(value) ? (
                              <a
                                href={value}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-caption text-brand hover:underline"
                              >
                                Open <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-caption text-ink-muted line-clamp-1">
                                {String(value ?? '') || '—'}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {editable ? (
                            <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => openEdit(row)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                          ) : (
                            <span
                              className="grid h-10 w-10 place-items-center text-ink-faint"
                              title="You can only edit your own entry"
                            >
                              <Lock className="w-4 h-4" />
                            </span>
                          )}
                          {removable && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Delete"
                              onClick={() => setDeleting(row)}
                              className="text-signal-danger hover:bg-signal-danger/10"
                            >
                              <Trash2 className="w-4 h-4" />
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
        </>
      )}

      {/* ─── Editor ─── */}
      <Modal
        isOpen={editing !== null}
        onClose={() => (saving ? undefined : setEditing(null))}
        title={editing === 'new' ? `New ${labels.singular}` : `Edit ${labels.singular}`}
        maxWidth="3xl"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void save()} isLoading={saving}>
              {editing === 'new' ? `Create ${labels.singular}` : 'Save changes'}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {config.fields.map((f) => {
            const locked = Boolean(f.lockedAfterCreate && editing !== 'new');
            const error = fieldErrors[f.name]?.[0] ?? null;
            const value = form[f.name];
            const common = {
              id: `f-${f.name}`,
              disabled: locked,
              error,
              hint: f.hint,
              label: f.label,
              placeholder: f.placeholder,
            };

            if (f.type === 'image') {
              return (
                <ImageField
                  key={f.name}
                  id={`f-${f.name}`}
                  label={f.label}
                  hint={f.hint}
                  error={error}
                  value={String(value ?? '')}
                  disabled={locked}
                  onChange={(url) => setForm((s) => ({ ...s, [f.name]: url }))}
                  className={f.wide ? 'sm:col-span-2' : ''}
                />
              );
            }

            if (f.type === 'textarea') {
              return (
                <Textarea
                  key={f.name}
                  {...common}
                  rows={4}
                  containerClassName="sm:col-span-2"
                  value={String(value ?? '')}
                  onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                />
              );
            }

            if (f.type === 'boolean') {
              return (
                <Field key={f.name} label={f.label} hint={f.hint} error={error} className={f.wide ? 'sm:col-span-2' : ''}>
                  <label className="flex items-center gap-3 h-11 px-4 rounded-xl border border-hairline bg-surface-sunken cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(value)}
                      disabled={locked}
                      onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.checked }))}
                      className="h-4 w-4 accent-[rgb(var(--brand))]"
                    />
                    <span className="text-caption text-ink-muted">{value ? 'Yes' : 'No'}</span>
                  </label>
                </Field>
              );
            }

            if (isCouncil && f.name === 'tenure') {
              return (
                <Field key={f.name} label="Council year" hint="Pick the year this person served. The newest year shows first on the website." error={error}>
                  <select
                    id={`f-${f.name}`}
                    value={String(value || FIRST_TENURE)}
                    disabled={locked}
                    onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                    className="ed-select w-full h-11 px-4 rounded-xl border border-hairline bg-surface-sunken text-body text-ink"
                  >
                    {tenureOptions.map((t) => (
                      <option key={t} value={t}>
                        {tenureLabel(t)}
                        {years.includes(t) ? '' : ' (new year)'}
                      </option>
                    ))}
                  </select>
                </Field>
              );
            }

            if (f.type === 'select') {
              return (
                <Field key={f.name} label={f.label} hint={f.hint} error={error} className={f.wide ? 'sm:col-span-2' : ''}>
                  <select
                    value={String(value ?? '')}
                    disabled={locked}
                    onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                    className="ed-select w-full h-11 px-4 rounded-xl border border-hairline bg-surface-sunken text-body text-ink"
                  >
                    {!value ? <option value="">Select…</option> : null}
                    {/* An older entry typed before this was a list keeps its value. */}
                    {value && !f.options?.includes(String(value)) ? <option value={String(value)}>{String(value)}</option> : null}
                    {f.options?.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </Field>
              );
            }

            return (
              <Input
                key={f.name}
                {...common}
                type={f.type === 'datetime' ? 'datetime-local' : f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'}
                // Without this a number input steps by 1, and a browser
                // rejects a decimal outright — latitude 27.175255 would not
                // be typeable at all.
                step={f.type === 'number' ? 'any' : undefined}
                containerClassName={f.wide ? 'sm:col-span-2' : ''}
                value={String(value ?? '')}
                onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
              />
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
