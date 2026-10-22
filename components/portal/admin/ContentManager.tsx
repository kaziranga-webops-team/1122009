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
    setForm(blankRow(config.fields));
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
  const visible = useMemo(() => rows, [rows]);

  return (
    <div className="space-y-5">
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
          title={query ? 'Nothing matches that search' : `No ${labels.title.toLowerCase()} yet`}
          description={query ? 'Try a different word.' : undefined}
          action={mayCreate && !query ? <Button size="sm" onClick={openCreate}>Add the first one</Button> : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-hairline bg-surface-raised">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-hairline bg-surface-sunken/60">
                  {config.columns.map((c) => (
                    <th key={c.name} className="px-4 py-3 text-eyebrow uppercase text-ink-faint whitespace-nowrap">
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
      )}

      {/* ─── Editor ─── */}
      <Modal
        isOpen={editing !== null}
        onClose={() => (saving ? undefined : setEditing(null))}
        eyebrow={labels.title}
        title={editing === 'new' ? `New ${labels.singular}` : `Edit ${labels.singular}`}
        subtitle="Changes appear on the website straight away."
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

            if (f.type === 'select') {
              return (
                <Field key={f.name} label={f.label} hint={f.hint} error={error} className={f.wide ? 'sm:col-span-2' : ''}>
                  <select
                    value={String(value ?? '')}
                    disabled={locked}
                    onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                    className="ed-select w-full h-11 px-4 rounded-xl border border-hairline bg-surface-sunken text-body text-ink"
                  >
                    {!f.options?.includes(String(value ?? '')) && <option value="">Select…</option>}
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
                type={f.type === 'datetime' ? 'datetime-local' : f.type === 'number' ? 'number' : 'text'}
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
