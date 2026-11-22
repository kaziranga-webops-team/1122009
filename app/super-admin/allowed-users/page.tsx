'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AllowedUser, SpreadsheetParseResult } from '@/types/portal';
import { isMockMode, db } from '@/lib/firebase';
import { mockStore } from '@/lib/portal/firebase/mockStore';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, query, where } from 'firebase/firestore';
import { SectionHeading } from '@/components/portal/ui/Section';
import { SpreadsheetUploader } from '@/components/portal/super-admin/SpreadsheetUploader';
import { SyncPreviewModal } from '@/components/portal/super-admin/SyncPreviewModal';
import { SuperAdminNavTabs } from '@/components/portal/super-admin/SuperAdminNavTabs';
import { Card } from '@/components/portal/ui/Card';
import { Badge } from '@/components/portal/ui/Badge';
import { Button } from '@/components/portal/ui/Button';
import { Modal } from '@/components/portal/ui/Modal';
import {
  FileSpreadsheet,
  CheckCircle2,
  ShieldCheck,
  UserX,
  AlertTriangle,
  ShieldAlert,
  UserPlus,
} from 'lucide-react';
import { SearchInput } from '@/components/portal/ui/SearchInput';
import { useToast } from '@/components/portal/ui/Toast';
import { DataTable } from '@/components/portal/ui/DataTable';
import { EmptyState } from '@/components/portal/ui/EmptyState';
import { RowSkeleton } from '@/components/portal/ui/Skeleton';

export default function SuperAdminAllowedUsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [allowedUsers, setAllowedUsers] = useState<AllowedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [parsedResult, setParsedResult] = useState<SpreadsheetParseResult | null>(null);
  const [parsedFilename, setParsedFilename] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Revoke Access Modal State
  const [revokingUser, setRevokingUser] = useState<AllowedUser | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // Add one person: the everyday case, and how an access request is approved.
  const [addEmail, setAddEmail] = useState('');
  const [adding, setAdding] = useState(false);

  // Arriving from an access request (?email=…) fills the box in.
  useEffect(() => {
    const fromRequest = new URLSearchParams(window.location.search).get('email');
    if (fromRequest) setAddEmail(fromRequest);
  }, []);

  const addOne = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const email = addEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Check the email', 'Enter a full address, like 24f1000123@ds.study.iitm.ac.in.');
      return;
    }
    if (allowedUsers.some((u) => u.email.toLowerCase() === email)) {
      toast.error('Already on the list', `${email} can already sign in.`);
      return;
    }
    if (isMockMode) {
      toast.error('Not available in demo mode');
      return;
    }
    setAdding(true);
    try {
      const now = new Date().toISOString();
      await setDoc(doc(db, 'allowedUsers', email), { email, importBatchId: 'manual', importedAt: now, addedBy: user.uid });
      // Any request this answers is done.
      const pending = await getDocs(
        query(collection(db, 'accessRequests'), where('email', '==', email), where('status', '==', 'PENDING'))
      );
      await Promise.all(pending.docs.map((d) => updateDoc(d.ref, { status: 'APPROVED', read: true })));
      const auditRef = doc(db, 'auditLogs', 'log_' + Date.now());
      await setDoc(auditRef, {
        id: auditRef.id,
        actorUserId: user.uid,
        actorEmail: user.email,
        action: 'ALLOWED_USER_ADDED',
        target: email,
        timestamp: now,
        metadata: { approvedRequests: pending.size },
      });
      toast.success('Added to the access list', `${email} can sign in now.`);
      setAddEmail('');
      fetchAllowedUsers();
    } catch (err) {
      console.error('Add to access list failed:', err);
      toast.error('Not added', 'The email was not added. Try again.');
    } finally {
      setAdding(false);
    }
  };

  const fetchAllowedUsers = async () => {
    setLoading(true);
    if (isMockMode) {
      setAllowedUsers(mockStore.getAllowedUsers());
      setLoading(false);
    } else {
      try {
        const snap = await getDocs(collection(db, 'allowedUsers'));
        const list: AllowedUser[] = [];
        snap.forEach((d) => list.push({ email: d.id, ...d.data() } as AllowedUser));
        setAllowedUsers(list);
      } catch (err) {
        console.error('Error fetching allowed users:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
      router.replace('/dashboard');
      return;
    }
    fetchAllowedUsers();

    if (isMockMode) {
      const unsubscribe = mockStore.subscribe(() => {
        fetchAllowedUsers();
      });
      return () => {
        unsubscribe();
      };
    }
  }, [user, router]);

  const handleParsed = (result: SpreadsheetParseResult, filename: string) => {
    setParsedResult(result);
    setParsedFilename(filename);
    setIsPreviewOpen(true);
  };

  const handleConfirmSync = async () => {
    if (!parsedResult || !user) return;

    if (isMockMode) {
      const res = mockStore.replaceAllowedUsers(parsedResult.validRows, user, parsedFilename);
      setSuccessBanner(
        `Successfully synchronized ${res.total} active allowed users from ${parsedFilename} (+${res.addedCount} added, -${res.deactivatedCount} deactivated).`,
      );
      setIsPreviewOpen(false);
      fetchAllowedUsers();
    } else {
      try {
        // Fetch current allowedUsers docs to remove
        const snap = await getDocs(collection(db, 'allowedUsers'));
        const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
        await Promise.all(deletePromises);

        // Add new allowedUsers docs
        const batchId = 'batch_' + Date.now();
        const importedAt = new Date().toISOString();

        const createPromises = parsedResult.validRows.map((email) => {
          const docRef = doc(db, 'allowedUsers', email.trim().toLowerCase());
          return setDoc(docRef, {
            email: email.trim().toLowerCase(),
            importBatchId: batchId,
            importedAt,
          });
        });
        await Promise.all(createPromises);

        // Record audit log
        const auditRef = doc(db, 'auditLogs', 'log_' + Date.now());
        await setDoc(auditRef, {
          id: auditRef.id,
          actorUserId: user.uid,
          actorEmail: user.email,
          action: 'ALLOWED_USERS_SYNCHRONIZED',
          target: 'allowedUsers Collection',
          timestamp: importedAt,
          metadata: {
            validCount: parsedResult.validRows.length,
            invalidCount: parsedResult.invalidRows.length,
            filename: parsedFilename,
          },
        });

        setSuccessBanner(
          `Successfully synchronized ${parsedResult.validRows.length} active allowed users.`,
        );
        setIsPreviewOpen(false);
        fetchAllowedUsers();
      } catch (err) {
        console.error('Spreadsheet replacement error:', err);
        toast.error('Import failed', 'The allowed-users list was not replaced.');
      }
    }
  };

  const handleRevokeAccess = async () => {
    if (!revokingUser || !user) return;
    setIsRevoking(true);

    try {
      if (isMockMode) {
        mockStore.removeAllowedUser(revokingUser.email, user);
        setSuccessBanner(
          `Revoked login access for ${revokingUser.email}. Historical records and registrations remain preserved.`,
        );
      } else {
        await deleteDoc(doc(db, 'allowedUsers', revokingUser.email.trim().toLowerCase()));

        // Log audit event
        const auditRef = doc(db, 'auditLogs', 'log_' + Date.now());
        await setDoc(auditRef, {
          id: auditRef.id,
          actorUserId: user.uid,
          actorEmail: user.email,
          action: 'USER_ACCESS_REVOKED',
          target: revokingUser.email,
          timestamp: new Date().toISOString(),
          metadata: { revokedEmail: revokingUser.email },
        });

        setSuccessBanner(`Revoked login access for ${revokingUser.email}.`);
      }

      setRevokingUser(null);
      fetchAllowedUsers();
    } catch (err) {
      console.error('Revoke access error:', err);
      toast.error('Could not revoke access', 'Please try again.');
    } finally {
      setIsRevoking(false);
    }
  };

  if (!user || user.role !== 'SUPER_ADMIN') return null;

  const filteredList = allowedUsers.filter(
    (u) => searchQuery === '' || u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <SuperAdminNavTabs />
      <SectionHeading title="Access list" size="lg" as="h1" description="Who can sign in to the portal." />

      {successBanner && (
        <div className="p-4 rounded-2xl bg-signal-live/10 border border-signal-live/25 text-signal-live text-caption flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-signal-live shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="font-bold text-caption hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <form onSubmit={addOne} className="space-y-3">
            <h2 className="text-[1rem] font-semibold text-ink">Add one person</h2>
            <label htmlFor="add-email" className="block text-[0.875rem] text-ink-muted">
              Their IIT Madras email
            </label>
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <input
                id="add-email"
                type="email"
                inputMode="email"
                autoComplete="off"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="24f1000123@ds.study.iitm.ac.in"
                className="ed-field flex-1"
              />
              <Button type="submit" variant="primary" isLoading={adding} leftIcon={<UserPlus className="w-4 h-4" />}>
                Add
              </Button>
            </div>
            <p className="text-[0.8125rem] text-ink-faint">They can sign in straight away. Any access request from them is marked approved.</p>
          </form>
        </Card>

        <Card className="p-5 sm:p-6 space-y-3">
          <h2 className="text-[1rem] font-semibold text-ink">Replace the whole list</h2>
          <p className="text-[0.8125rem] text-ink-faint">
            Upload the official spreadsheet. It replaces everyone on the list; past members keep their history.
          </p>
          <SpreadsheetUploader onParsed={handleParsed} />
        </Card>
      </div>

      {/* Current Allowed List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-[1rem] font-semibold text-ink">
              On the list <span className="font-normal text-ink-muted">({allowedUsers.length})</span>
            </h2>
          </div>

          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by email"
            aria-label="Search the access list by email"
            containerClassName="w-full sm:w-80"
          />
        </div>

        <DataTable
          columns={[
            {
              id: 'email',
              header: 'Allowed email',
              primary: true,
              sortValue: (u) => u.email,
              cell: (u) => (
                <span className="font-mono text-caption text-ink break-all">{u.email}</span>
              ),
            },
            {
              id: 'status',
              header: 'Access',
              cell: () => (
                <Badge tone="live" size="sm">
                  Granted
                </Badge>
              ),
            },
          ]}
          rows={filteredList}
          rowKey={(u) => u.email}
          caption="Allowed users registry"
          actions={(u) => (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRevokingUser(u)}
              leftIcon={<UserX className="w-3.5 h-3.5" />}
              className="text-signal-danger hover:text-signal-danger hover:bg-signal-danger/10"
            >
              Revoke
            </Button>
          )}
          empty={
            loading ? (
              <div className="space-y-3">
                <RowSkeleton />
                <RowSkeleton />
                <RowSkeleton />
              </div>
            ) : (
              <EmptyState
                icon={<ShieldAlert />}
                title={searchQuery ? 'No matches' : 'Nobody on the list yet'}
                description={
                  searchQuery
                    ? 'No email on the list matches that search.'
                    : 'Add someone above, or upload the official spreadsheet.'
                }
              />
            )
          }
        />
      </div>

      {/* Sync Preview Confirmation Modal */}
      <SyncPreviewModal
        isOpen={isPreviewOpen}
        result={parsedResult}
        filename={parsedFilename}
        onClose={() => setIsPreviewOpen(false)}
        onConfirm={handleConfirmSync}
      />

      {/* Revoke Access Confirmation Modal */}
      <Modal
        isOpen={!!revokingUser}
        onClose={() => setRevokingUser(null)}
        title="Revoke Current Login Access"
        maxWidth="md"
      >
        <div className="space-y-4 text-caption sm:text-sm">
          <div className="p-3.5 rounded-xl bg-signal-warn/10 border border-signal-warn/25 text-signal-warn text-caption flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-signal-warn shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Historical Record Retention Policy:</span>
              <p className="leading-relaxed">
                Remove this user&apos;s current access? Their previous event participation,
                registration snapshots, and historical profile will be{' '}
                <strong>fully retained</strong> for record-keeping.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-sunken border border-hairline font-mono text-caption">
            <span className="text-ink-faint font-sans block text-caption mb-1">
              Target Student Email:
            </span>
            <span className="font-bold text-ink">{revokingUser?.email}</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-hairline">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRevokingUser(null)}
              disabled={isRevoking}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={isRevoking}
              onClick={handleRevokeAccess}
              leftIcon={<UserX className="w-4 h-4" />}
            >
              Confirm & Revoke Access
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
