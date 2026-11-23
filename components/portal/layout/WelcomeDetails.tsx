'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Modal } from '@/components/portal/ui/Modal';
import { Button } from '@/components/portal/ui/Button';
import { Input, Select } from '@/components/portal/ui/Field';
import { useToast } from '@/components/portal/ui/Toast';
import { REGIONS, toRegion } from '@/lib/portal/regions';

/** The name a new profile gets when Google does not give one. */
const PLACEHOLDER_NAME = 'Kaziranga Student';
const LATER_KEY = 'kz-details-later';

/**
 * On first sign-in, ask for the two things the portal cannot guess: the name
 * to show (on registrations, teams and certificates) and the region (which
 * decides your regional coordinator and local meetups). Shown until both are
 * set; "Later" hides it for this visit.
 */
export const WelcomeDetails: React.FC = () => {
  const { user, viewAs, updateProfile } = useAuth();
  const toast = useToast();
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [saving, setSaving] = useState(false);
  const [later, setLater] = useState(true);

  const missingName = !user?.name?.trim() || user.name.trim() === PLACEHOLDER_NAME;
  const missingRegion = !toRegion(user?.region);
  const needed = Boolean(user) && !viewAs && (missingName || missingRegion);

  useEffect(() => {
    try {
      setLater(sessionStorage.getItem(LATER_KEY) === '1');
    } catch {
      setLater(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    setName(user.name?.trim() === PLACEHOLDER_NAME ? '' : user.name || '');
    setRegion(toRegion(user.region) || '');
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!needed || later) return null;

  const close = () => {
    try {
      sessionStorage.setItem(LATER_KEY, '1');
    } catch {
      // ignore
    }
    setLater(true);
  };

  const save = async () => {
    if (!name.trim() || !region) return;
    setSaving(true);
    try {
      await updateProfile({ name: name.trim().replace(/\s+/g, ' '), region });
      toast.success('Thanks!', 'Your details are saved.');
    } catch (e) {
      toast.error('Could not save', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={close}
      title="Welcome to the portal"
      subtitle="Two quick things before you start."
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={saving}>
            Later
          </Button>
          <Button onClick={() => void save()} disabled={saving || !name.trim() || !region}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <Input
          label="Your name"
          hint="As it should appear on registrations and certificates."
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
        />
        <Select label="Your region" hint="This picks your regional coordinator and local meetups." value={region} onChange={(e) => setRegion(e.target.value)} required>
          <option value="">Choose your region…</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </form>
    </Modal>
  );
};
