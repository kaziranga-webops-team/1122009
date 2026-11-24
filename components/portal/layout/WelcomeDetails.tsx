'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Modal } from '@/components/portal/ui/Modal';
import { Button } from '@/components/portal/ui/Button';
import { Input, Select } from '@/components/portal/ui/Field';
import { useToast } from '@/components/portal/ui/Toast';
import { REGIONS, toRegion } from '@/lib/portal/regions';
import { LEVELS, isLevel } from '@/lib/study/subjects';

/** The name a new profile gets when Google does not give one. */
const PLACEHOLDER_NAME = 'Kaziranga Student';
const LATER_KEY = 'kz-details-later';
/** A term is four months: the level is confirmed again after about that long. */
const TERM_MS = 120 * 24 * 60 * 60 * 1000;

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
  const [level, setLevel] = useState('');
  const [saving, setSaving] = useState(false);
  const [later, setLater] = useState(true);

  const missingName = !user?.name?.trim() || user.name.trim() === PLACEHOLDER_NAME;
  const missingRegion = !toRegion(user?.region);
  // The level goes on event registrations, and it changes as members move
  // on, so it is asked for once a term.
  const confirmed = Date.parse(user?.levelConfirmedAt || '');
  const levelDue = !isLevel(user?.level) || !Number.isFinite(confirmed) || Date.now() - confirmed > TERM_MS;
  const onlyLevel = !missingName && !missingRegion;
  const needed = Boolean(user) && !viewAs && (missingName || missingRegion || levelDue);

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
    setLevel(isLevel(user.level) ? user.level : '');
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
    if (!name.trim() || !region || !level) return;
    setSaving(true);
    try {
      await updateProfile({ name: name.trim().replace(/\s+/g, ' '), region, level, levelConfirmedAt: new Date().toISOString() });
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
      title={onlyLevel ? 'A new term' : 'Welcome to the portal'}
      subtitle={onlyLevel ? 'Which level are you at this term? It keeps your event registrations right.' : 'A few quick things before you start.'}
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={saving}>
            Later
          </Button>
          <Button onClick={() => void save()} disabled={saving || !name.trim() || !region || !level}>
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
        {!onlyLevel && (
        <Input
          label="Your name"
          hint="As it should appear on registrations and certificates."
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
        />
        )}
        {!onlyLevel && (
        <Select label="Your region" hint="This picks your regional coordinator and local meetups." value={region} onChange={(e) => setRegion(e.target.value)} required>
          <option value="">Choose your region…</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
        )}
        <Select
          label="Your level this term"
          hint="Shown on your event registrations. We ask again next term."
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          required
        >
          <option value="">Choose your level…</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </Select>
      </form>
    </Modal>
  );
};
