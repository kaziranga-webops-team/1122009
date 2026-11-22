'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/portal/ui/Toast';
import { userProfileSchema } from '@/lib/portal/validation/schemas';
import { Registration, EventItem } from '@/types/portal';
import { isMockMode } from '@/lib/firebase';
import { mockStore } from '@/lib/portal/firebase/mockStore';
import { query, where, getDocs } from 'firebase/firestore';
import { getAllRegistrationsGroupRef, getAllEventsGroupRef } from '@/lib/portal/firebase/paths';
import { formatDate } from '@/lib/portal/utils/formatDate';
import { Card } from '@/components/portal/ui/Card';
import { Badge } from '@/components/portal/ui/Badge';
import { Button } from '@/components/portal/ui/Button';
import { Input, Select } from '@/components/portal/ui/Field';
import { SectionHeading } from '@/components/portal/ui/Section';
import { Reveal } from '@/components/portal/ui/Motion';
import { ConfirmModal } from '@/components/portal/ui/ConfirmModal';
import { BrandSeal } from '@/components/portal/layout/Sidebar';
import { REGIONS } from '@/lib/portal/regions';
import {
  Lock,
  Crown,
  Shield,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  User,
  QrCode,
  Calendar,
  LogOut,
  ArrowRight,
  ExternalLink,
  MapPin,
  GraduationCap,
  Sparkles,
  RefreshCw,
  Printer,
  Compass,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const toast = useToast();

  // Form field state
  const [phone, setPhone] = useState(user?.phone || '');
  const [region, setRegion] = useState(user?.region || '');
  const [level, setLevel] = useState(user?.level || '');
  const [programme, setProgramme] = useState(user?.programme || '');

  // Keep fields synchronized if user context updates from database
  useEffect(() => {
    if (user) {
      setPhone(user.phone || '');
      setRegion(user.region || '');
      setLevel(user.level || '');
      setProgramme(user.programme || '');
    }
  }, [user?.phone, user?.region, user?.level, user?.programme]);

  // Form action state
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tab & UI state
  type TabId = 'details' | 'id-card' | 'registrations' | 'security';
  const [activeTab, setActiveTab] = useState<TabId>('details');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Registrations state
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [eventsMap, setEventsMap] = useState<Record<string, EventItem>>({});
  const [loadingRegs, setLoadingRegs] = useState(true);

  // Sign out modal state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Derive Roll Number from IITM student email
  const rollNumber = useMemo(() => {
    if (!user?.email) return 'KAZI-STUDENT';
    const prefix = user.email.split('@')[0];
    return prefix ? prefix.toUpperCase() : 'KAZI-STUDENT';
  }, [user?.email]);

  // Check if form has unsaved modifications
  const hasChanges = useMemo(() => {
    return (
      phone !== (user?.phone || '') ||
      region !== (user?.region || '') ||
      level !== (user?.level || '') ||
      programme !== (user?.programme || '')
    );
  }, [phone, region, level, programme, user]);

  // Calculate profile completeness
  const completeness = useMemo(() => {
    let completed = 0;
    const total = 4;
    if (phone.trim().length >= 10) completed += 1;
    if (region.trim().length > 0) completed += 1;
    if (level.trim().length > 0) completed += 1;
    if (programme.trim().length > 0) completed += 1;
    const percentage = Math.round((completed / total) * 100);
    return {
      percentage,
      completed,
      total,
      isComplete: completed === total,
    };
  }, [phone, region, level, programme]);

  // Available options
  const availableRegions = useMemo(() => {
    const defaultList: string[] = [...REGIONS];
    const list = [...defaultList];
    if (user?.region && !list.includes(user.region)) list.push(user.region);
    if (region && !list.includes(region)) list.push(region);
    return Array.from(new Set(list));
  }, [user?.region, region]);

  const availableLevels = useMemo(() => {
    const defaultList = ['Foundation', 'Diploma', 'Degree'];
    const list = [...defaultList];
    if (user?.level && !list.includes(user.level)) list.push(user.level);
    if (level && !list.includes(level)) list.push(level);
    return Array.from(new Set(list));
  }, [user?.level, level]);

  const availableProgrammes = useMemo(() => {
    const defaultList = [
      'Data Science & Applications',
      'Diploma in Programming',
      'Diploma in Data Science',
      'Electronic Systems',
      'Management and Data Science',
      'Aeronautics and Space Technology',
    ];
    const list = [...defaultList];
    if (user?.programme && !list.includes(user.programme)) list.push(user.programme);
    if (programme && !list.includes(programme)) list.push(programme);
    return Array.from(new Set(list));
  }, [user?.programme, programme]);

  // Fetch registered events for this user
  useEffect(() => {
    if (!user?.uid) return;
    let isMounted = true;

    const fetchMyRegs = async () => {
      setLoadingRegs(true);
      try {
        if (isMockMode) {
          const userRegs = mockStore.getRegistrationsForUser(user.uid);
          const mockEvents = mockStore.getEvents();
          const map: Record<string, EventItem> = {};
          mockEvents.forEach((e) => {
            map[e.id] = e;
          });
          if (isMounted) {
            setRegistrations(userRegs);
            setEventsMap(map);
          }
        } else {
          const q = query(getAllRegistrationsGroupRef(), where('userId', '==', user.uid));
          const snap = await getDocs(q);
          const items: Registration[] = [];
          snap.forEach((doc) => {
            if (doc.ref.path.includes('tenures/')) {
              const data = doc.data();
              items.push({
                id: doc.id,
                ...data,
                nameSnapshot: data.nameSnapshot || data.name || '',
                emailSnapshot: data.emailSnapshot || data.email || '',
                phoneSnapshot: data.phoneSnapshot || data.phone || '',
                regionSnapshot: data.regionSnapshot || data.region || '',
                levelSnapshot: data.levelSnapshot || data.level || '',
                programmeSnapshot: data.programmeSnapshot || data.programme || '',
              } as Registration);
            }
          });

          const eventsSnap = await getDocs(getAllEventsGroupRef());
          const map: Record<string, EventItem> = {};
          eventsSnap.forEach((doc) => {
            map[doc.id] = { id: doc.id, ...doc.data() } as EventItem;
          });

          if (isMounted) {
            setRegistrations(items);
            setEventsMap(map);
          }
        }
      } catch (err) {
        console.error('Failed to load profile registrations:', err);
      } finally {
        if (isMounted) {
          setLoadingRegs(false);
        }
      }
    };

    fetchMyRegs();
    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  // Clipboard copy handler with toast feedback
  const handleCopy = (text: string, fieldKey: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    toast.success('Copied to clipboard', `${label}: ${text}`);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const handleReset = () => {
    if (!user) return;
    setPhone(user.phone || '');
    setRegion(user.region || '');
    setLevel(user.level || '');
    setProgramme(user.programme || '');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const validated = userProfileSchema.parse({
        phone,
        region,
        level,
        programme,
      });

      await updateProfile(validated);
      const msg = 'Profile updated! Your details are now synced for 1-click event entries.';
      setSuccessMsg(msg);
      toast.success('Profile saved', msg);
    } catch (err: any) {
      let message = 'Failed to update profile';
      if (err.errors && err.errors[0]?.message) {
        message = err.errors[0].message;
      } else if (err.message) {
        message = err.message;
      }
      setErrorMsg(message);
      toast.error('Update failed', message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  const roleBadge =
    user.role === 'SUPER_ADMIN' ? (
      <Badge tone="accent" solid size="md">
        <Crown className="w-3.5 h-3.5" aria-hidden />
        Super Admin
      </Badge>
    ) : user.role === 'ADMIN' ? (
      <Badge tone="info" solid size="md">
        <Shield className="w-3.5 h-3.5" aria-hidden />
        Event Admin
      </Badge>
    ) : user.role === 'RC' ? (
      <Badge tone="brand" size="md">
        <Compass className="w-3.5 h-3.5" aria-hidden />
        Regional Coordinator
      </Badge>
    ) : (
      <Badge tone="neutral" size="md">
        Student Member
      </Badge>
    );

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* ─── Hero Profile Header Card ─── */}
      <Card elevation={2} className="overflow-hidden border border-hairline">
        {/* Subtle top highlight strip */}
        <div className="h-1.5 w-full bg-brand" />

        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            {/* User Identity Info */}
            <div className="flex items-center gap-4 sm:gap-5 min-w-0">
              <div className="relative shrink-0">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="w-20 h-20 rounded-full object-cover ring-2 ring-hairline-strong shadow-xs"
                  />
                ) : (
                  <span
                    className="grid place-items-center w-20 h-20 rounded-full shrink-0
                      bg-surface-sunken text-ink border border-hairline-strong font-display font-extrabold text-title-lg shadow-xs"
                    aria-hidden
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
                {/* Active verified dot */}
                <span
                  title="IIT Madras BS Google SSO Verified"
                  className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-surface-raised border-2 border-surface-raised flex items-center justify-center"
                >
                  <span className="w-3 h-3 rounded-full bg-brand ring-2 ring-brand/20" />
                </span>
              </div>

              <div className="min-w-0 space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-display font-extrabold text-title-lg text-ink tracking-tight truncate">
                    {user.name}
                  </h1>
                  <span
                    title="Name managed by IIT Madras Google Workspace"
                    className="inline-flex items-center text-ink-faint hover:text-ink cursor-help"
                  >
                    <Lock className="w-3.5 h-3.5" aria-hidden />
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Roll Number Pill */}
                  <button
                    type="button"
                    onClick={() => handleCopy(rollNumber, 'roll', 'Student Roll Number')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-sunken hover:bg-surface-overlay text-ink border border-hairline text-caption font-mono font-bold transition-colors group"
                    title="Click to copy student roll number"
                  >
                    <span>{rollNumber}</span>
                    {copiedField === 'roll' ? (
                      <Check className="w-3 h-3 text-brand" />
                    ) : (
                      <Copy className="w-3 h-3 text-ink-faint group-hover:text-ink" />
                    )}
                  </button>

                  {/* Role Badge */}
                  {roleBadge}

                  {/* Verified Tag */}
                  <Badge tone="live" size="sm">
                    <CheckCircle2 className="w-3 h-3" aria-hidden />
                    IITM BS Verified
                  </Badge>
                </div>

                {/* Email with copy */}
                <p className="text-caption font-mono text-ink-muted truncate flex items-center gap-1.5">
                  <span className="truncate">{user.email}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(user.email, 'email', 'IITM Email')}
                    className="text-ink-faint hover:text-ink transition-colors p-0.5 rounded"
                    title="Copy email address"
                  >
                    {copiedField === 'email' ? (
                      <Check className="w-3 h-3 text-brand" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </p>
              </div>
            </div>

            {/* Quick Header Actions */}
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-hairline">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('id-card')}
                leftIcon={<QrCode className="w-4 h-4" />}
                className="flex-1 sm:flex-initial"
              >
                Digital Pass
              </Button>

              <Link href="/dashboard/my-registrations" className="flex-1 sm:flex-initial">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Calendar className="w-4 h-4" />}
                  fullWidth
                >
                  My Events
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLogoutConfirm(true)}
                title="Sign out of portal"
                className="text-ink-muted hover:text-signal-danger"
              >
                <LogOut className="w-4 h-4" />
                <span className="sr-only sm:not-sr-only text-caption">Sign out</span>
              </Button>
            </div>
          </div>

          {/* ─── Metric & Readiness Stats Strip ─── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-hairline">
            {/* Metric 1: Completeness */}
            <div className="p-3.5 rounded-xl bg-surface-sunken border border-hairline space-y-1">
              <span className="text-micro font-semibold text-ink-faint block">
                Profile Readiness
              </span>
              <div className="flex items-center justify-between">
                <span className="text-body font-display font-extrabold text-ink">
                  {completeness.percentage}%
                </span>
                {completeness.isComplete ? (
                  <Badge tone="live" size="sm">
                    Ready
                  </Badge>
                ) : (
                  <Badge tone="warn" size="sm">
                    {completeness.completed}/{completeness.total}
                  </Badge>
                )}
              </div>
              <div className="w-full bg-hairline-strong rounded-full h-1 mt-1 overflow-hidden">
                <div
                  className="bg-brand h-1 rounded-full transition-all duration-300"
                  style={{ width: `${completeness.percentage}%` }}
                />
              </div>
            </div>

            {/* Metric 2: Registrations */}
            <Link
              href="/dashboard/my-registrations"
              className="p-3.5 rounded-xl bg-surface-sunken border border-hairline space-y-1 hover:border-hairline-strong transition-colors block group"
            >
              <div className="flex items-center justify-between">
                <span className="text-micro font-semibold text-ink-faint">
                  Events Joined
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-ink-faint group-hover:text-ink transition-transform group-hover:translate-x-0.5" />
              </div>
              <span className="text-body font-display font-extrabold text-ink block">
                {loadingRegs ? '...' : registrations.length}
              </span>
              <span className="text-micro text-ink-muted block truncate">
                {registrations.length === 1 ? '1 active registration' : `${registrations.length} registrations`}
              </span>
            </Link>

            {/* Metric 3: House Affiliation */}
            <div className="p-3.5 rounded-xl bg-surface-sunken border border-hairline space-y-1">
              <span className="text-micro font-semibold text-ink-muted block">
                House
              </span>
              <span className="text-body font-display font-extrabold text-ink block truncate">
                Kaziranga House
              </span>
              <span className="text-micro text-ink-muted block truncate">
                IIT Madras BS Degree
              </span>
            </div>

            {/* Metric 4: Region */}
            <div className="p-3.5 rounded-xl bg-surface-sunken border border-hairline space-y-1">
              <span className="text-micro font-semibold text-ink-faint block">
                Assigned Region
              </span>
              <span className="text-body font-display font-extrabold text-ink block truncate flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
                <span className="truncate">{user.region || 'Not set'}</span>
              </span>
              <span className="text-micro text-ink-muted block truncate">
                {user.region ? 'Regional Meetups' : 'Choose your city'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* ─── Navigation Tabs Bar ─── */}
      <div className="flex items-center gap-2 border-b border-hairline overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`flex items-center gap-2 px-4 py-2.5 text-caption font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'details'
              ? 'text-ink border-brand bg-surface-raised'
              : 'text-ink-muted border-transparent hover:text-ink hover:bg-surface-sunken'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile Details</span>
          {hasChanges && <span className="w-2 h-2 rounded-full bg-brand" />}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('id-card')}
          className={`flex items-center gap-2 px-4 py-2.5 text-caption font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'id-card'
              ? 'text-ink border-brand bg-surface-raised'
              : 'text-ink-muted border-transparent hover:text-ink hover:bg-surface-sunken'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Digital House Pass</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('registrations')}
          className={`flex items-center gap-2 px-4 py-2.5 text-caption font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'registrations'
              ? 'text-ink border-brand bg-surface-raised'
              : 'text-ink-muted border-transparent hover:text-ink hover:bg-surface-sunken'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Event Participations</span>
          <span className="px-1.5 py-0.2 rounded-full text-micro bg-surface-sunken text-ink-muted font-mono">
            {registrations.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 text-caption font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'security'
              ? 'text-ink border-brand bg-surface-raised'
              : 'text-ink-muted border-transparent hover:text-ink hover:bg-surface-sunken'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Security &amp; Account</span>
        </button>
      </div>

      {/* ─── Feedback Banners ─── */}
      {successMsg && (
        <Reveal y={8}>
          <div
            role="status"
            className="flex items-start gap-3 p-4 rounded-xl bg-signal-live/10 border border-signal-live/25 text-signal-live text-caption"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
            <div className="space-y-0.5">
              <span className="font-semibold block">Changes Saved</span>
              <span>{successMsg}</span>
            </div>
          </div>
        </Reveal>
      )}

      {errorMsg && (
        <Reveal y={8}>
          <div
            role="alert"
            className="flex items-start gap-3 p-4 rounded-xl bg-signal-danger/10 border border-signal-danger/25 text-signal-danger text-caption"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
            <div className="space-y-0.5">
              <span className="font-semibold block">Update Error</span>
              <span>{errorMsg}</span>
            </div>
          </div>
        </Reveal>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 1: Profile Details & Academic Edit Form               */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'details' && (
        <Reveal y={10}>
          <div className="space-y-6">
            <Card elevation={1} className="p-6 sm:p-7 space-y-6 border border-hairline">
              <div className="border-b border-hairline pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="font-display font-extrabold text-title text-ink">
                    Academic &amp; Contact Information
                  </h2>
                  <p className="text-caption text-ink-muted mt-1">
                    These credentials automatically populate into every event registration, workshop ticket, and certificate.
                  </p>
                </div>
                {hasChanges && (
                  <Badge tone="brand" size="sm" pulse>
                    Unsaved Changes
                  </Badge>
                )}
              </div>

              {/* Identity Snapshot (Google SSO locked) */}
              <div className="p-4 rounded-xl bg-surface-sunken border border-hairline space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-micro font-semibold text-ink-faint flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-ink-faint" />
                    Managed by IIT Madras Google Workspace
                  </span>
                  <span className="text-micro text-ink-muted">Read-Only</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-caption">
                  <div>
                    <span className="text-ink-faint text-micro block">Student Name</span>
                    <span className="font-semibold text-ink font-mono">{user.name}</span>
                  </div>
                  <div>
                    <span className="text-ink-faint text-micro block">Student Roll Number</span>
                    <span className="font-semibold text-ink font-mono">{rollNumber}</span>
                  </div>
                  <div>
                    <span className="text-ink-faint text-micro block">Institutional Email</span>
                    <span className="font-semibold text-ink font-mono truncate block">{user.email}</span>
                  </div>
                </div>
              </div>

              {/* Editable Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <Input
                    type="tel"
                    required
                    label="WhatsApp Mobile Number"
                    hint="Organisers and team captains use this number for urgent communications and WhatsApp groups."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210 or +919876543210"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Select
                      required
                      label="Regional Chapter"
                      hint="Connects you to local city meetups"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                    >
                      <option value="" disabled>
                        Select your region
                      </option>
                      {availableRegions.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </Select>

                    <Select
                      required
                      label="Academic Level"
                      hint="Current degree stage"
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                    >
                      <option value="" disabled>
                        Select academic level
                      </option>
                      {availableLevels.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </Select>

                    <Select
                      required
                      label="Programme"
                      hint="BS degree specialization"
                      value={programme}
                      onChange={(e) => setProgramme(e.target.value)}
                    >
                      <option value="" disabled>
                        Select programme
                      </option>
                      {availableProgrammes.map((pr) => (
                        <option key={pr} value={pr}>
                          {pr}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-hairline">
                  <div className="text-micro text-ink-muted">
                    {hasChanges ? (
                      <span className="text-signal-warn font-medium flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        You have unsaved edits
                      </span>
                    ) : (
                      <span>All details in sync with your account profile.</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    {hasChanges && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="md"
                        onClick={handleReset}
                        disabled={isSaving}
                      >
                        Discard
                      </Button>
                    )}
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      isLoading={isSaving}
                      leftIcon={<Check className="w-4 h-4" />}
                    >
                      Save changes
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          </div>
        </Reveal>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 2: Digital Student House ID Pass                      */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'id-card' && (
        <Reveal y={10}>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display font-extrabold text-title text-ink">
                  Kaziranga Digital House Pass
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  leftIcon={<Printer className="w-4 h-4" />}
                >
                  Print Pass
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(rollNumber, 'pass-roll', 'Student ID')}
                  leftIcon={<Copy className="w-4 h-4" />}
                >
                  Copy Roll No
                </Button>
              </div>
            </div>

            {/* Aesthetic Pass Container */}
            <div className="max-w-xl mx-auto">
              <div className="rounded-2xl bg-surface-raised border border-hairline-strong shadow-e-2 overflow-hidden relative">
                {/* Visual Top Band */}
                <div className="bg-surface-sunken border-b border-hairline px-6 py-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <BrandSeal className="w-12 h-12" />
                    <div>
                      <span className="block text-[0.75rem] font-semibold text-ink-muted">
                        Indian Institute of Technology Madras
                      </span>
                      <span className="block font-display font-extrabold text-body text-ink leading-tight">
                        Kaziranga House
                      </span>
                    </div>
                  </div>
                  <Badge tone="live" size="sm" pulse>
                    Active Pass
                  </Badge>
                </div>

                {/* Pass Main Body */}
                <div className="p-6 sm:p-7 space-y-6">
                  <div className="flex items-center gap-5">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt=""
                        className="w-20 h-20 rounded-xl object-cover ring-2 ring-hairline-strong shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-surface-sunken border border-hairline-strong grid place-items-center text-ink font-display font-extrabold text-title-lg shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 space-y-1">
                      <span className="text-micro font-semibold text-ink-faint">
                        Official House Member
                      </span>
                      <h3 className="font-display font-extrabold text-title-lg text-ink truncate">
                        {user.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-surface-sunken border border-hairline font-mono font-bold text-caption text-ink">
                          {rollNumber}
                        </span>
                        {roleBadge}
                      </div>
                    </div>
                  </div>

                  {/* Pass Metadata Grid */}
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-surface-sunken border border-hairline text-caption">
                    <div>
                      <span className="text-micro text-ink-faint block font-semibold">
                        Programme
                      </span>
                      <span className="font-semibold text-ink truncate block">
                        {user.programme || 'Not specified'}
                      </span>
                    </div>

                    <div>
                      <span className="text-micro text-ink-faint block font-semibold">
                        Academic Level
                      </span>
                      <span className="font-semibold text-ink">
                        {user.level || 'Not specified'}
                      </span>
                    </div>

                    <div>
                      <span className="text-micro text-ink-faint block font-semibold">
                        Regional Chapter
                      </span>
                      <span className="font-semibold text-ink flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
                        <span className="truncate">{user.region || 'Unassigned'}</span>
                      </span>
                    </div>

                    <div>
                      <span className="text-micro text-ink-faint block font-semibold">
                        Tenure
                      </span>
                      <span className="font-semibold text-ink">
                        2026 – 2027
                      </span>
                    </div>
                  </div>

                  {/* Digital Security Stamp & Barcode Aesthetic Strip */}
                  <div className="pt-2 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center sm:text-left">
                      <span className="text-micro font-mono text-ink-faint block">
                        PASS VERIFICATION HASH
                      </span>
                      <span className="text-micro font-mono font-bold text-ink tracking-widest block">
                        KAZI-{rollNumber}-{user.uid.slice(0, 8).toUpperCase()}
                      </span>
                    </div>

                    {/* Barcode graphic */}
                    <div
                      className="flex items-center gap-0.5 px-3 py-1.5 rounded bg-surface-sunken border border-hairline"
                      title="Digital QR / Barcode pass representation"
                      aria-label="Digital barcode"
                    >
                      {[12, 24, 16, 28, 14, 22, 18, 30, 20, 14, 26, 18, 24, 12, 28, 16, 22, 30].map(
                        (h, idx) => (
                          <div
                            key={idx}
                            className="w-1 bg-ink rounded-xs opacity-75"
                            style={{ height: `${h}px` }}
                          />
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Authenticity Strip */}
                <div className="bg-surface-sunken/60 border-t border-hairline px-6 py-3 flex items-center justify-between text-micro text-ink-faint">
                  <span>IIT Madras BS Degree Official House Pass</span>
                  <span className="font-mono">Rhino Spirit • Pride &amp; Grit</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 3: Event Participations & Quick Overview              */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'registrations' && (
        <Reveal y={10}>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display font-extrabold text-title text-ink">
                  Event Participations
                </h2>
              </div>

              <Link href="/dashboard/events">
                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Browse Upcoming Events
                </Button>
              </Link>
            </div>

            {loadingRegs ? (
              <div className="p-12 text-center space-y-3 rounded-2xl bg-surface-raised border border-hairline">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand" />
                <p className="text-caption text-ink-muted">Loading your event registrations...</p>
              </div>
            ) : registrations.length === 0 ? (
              <Card elevation={1} className="p-10 text-center space-y-4 border border-hairline">
                <div className="w-14 h-14 rounded-2xl bg-surface-sunken border border-hairline mx-auto grid place-items-center text-ink-faint">
                  <Calendar className="w-7 h-7" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="font-display font-bold text-title text-ink">
                    No active registrations
                  </h3>
                  <p className="text-caption text-ink-muted">
                    You have not registered for any events yet. Explore upcoming hackathons, quizzes, and sports tournaments in the portal.
                  </p>
                </div>
                <Link href="/dashboard/events">
                  <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Explore Events
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {registrations.map((reg) => {
                  const event = eventsMap[reg.eventId];
                  const eventTitle = reg.eventTitle || event?.name || 'Kaziranga House Event';
                  const eventDate = event?.startDateTime ? formatDate(event.startDateTime) : 'Date TBA';

                  return (
                    <Card
                      key={reg.id}
                      elevation={1}
                      className="p-5 border border-hairline flex flex-col justify-between gap-4 hover:border-hairline-strong transition-colors"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <span className="text-micro font-mono text-ink-faint block">
                              {reg.registrationType === 'TEAM'
                                ? `Team: ${reg.teamName || 'Team Entry'}`
                                : 'Individual Registration'}
                            </span>
                            <h4 className="font-display font-extrabold text-body text-ink truncate">
                              {eventTitle}
                            </h4>
                          </div>

                          <Badge
                            tone={reg.status === 'CONFIRMED' ? 'live' : 'warn'}
                            size="sm"
                          >
                            {reg.status}
                          </Badge>
                        </div>

                        <div className="text-caption text-ink-muted space-y-1">
                          <p className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-ink-faint shrink-0" />
                            <span>{eventDate}</span>
                          </p>
                          {event?.venue && (
                            <p className="flex items-center gap-2 truncate">
                              <MapPin className="w-3.5 h-3.5 text-ink-faint shrink-0" />
                              <span className="truncate">{event.venue}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-hairline flex items-center justify-between">
                        <span className="text-micro text-ink-faint font-mono">
                          Registered: {formatDate(reg.createdAt, false)}
                        </span>
                        <Link href="/dashboard/my-registrations">
                          <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </Reveal>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* TAB 4: Security, Metadata & Account Operations            */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'security' && (
        <Reveal y={10}>
          <div className="space-y-6">
            <Card elevation={1} className="p-6 sm:p-7 space-y-6 border border-hairline">
              <div className="border-b border-hairline pb-4">
                <h2 className="font-display font-extrabold text-title text-ink">
                  Security &amp; Account Metadata
                </h2>
                <p className="text-caption text-ink-muted mt-1">
                  Single Sign-On provider credentials, unique system identifiers, and session controls.
                </p>
              </div>

              {/* Single Sign-On Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface-sunken border border-hairline space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-micro font-semibold text-ink-faint">
                      Authentication Provider
                    </span>
                    <Badge tone="live" size="sm">
                      Active
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <span className="font-display font-bold text-body text-ink block">
                      Google Workspace SSO
                    </span>
                    <span className="text-caption text-ink-muted block">
                      Synced with IIT Madras institutional domain (@study.iitm.ac.in).
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-sunken border border-hairline space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-micro font-semibold text-ink-faint">
                      Portal Whitelist Status
                    </span>
                    <Badge tone="live" size="sm">
                      Whitelisted
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <span className="font-display font-bold text-body text-ink block">
                      Kaziranga House Member
                    </span>
                    <span className="text-caption text-ink-muted block">
                      Granted event registration, team formation, and submission privileges.
                    </span>
                  </div>
                </div>
              </div>

              {/* System UID & Helpdesk Tokens */}
              <div className="p-4 rounded-xl bg-surface-sunken border border-hairline space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-micro font-semibold text-ink-faint">
                    System User ID (UID)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(user.uid, 'uid', 'System UID')}
                    className="inline-flex items-center gap-1.5 text-micro font-semibold text-brand hover:underline"
                  >
                    {copiedField === 'uid' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied UID</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy UID</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-caption font-mono text-ink bg-surface-raised p-2.5 rounded-lg border border-hairline break-all">
                  {user.uid}
                </p>
                <p className="text-micro text-ink-faint">
                  Provide this unique identifier when opening a helpdesk ticket or contacting House Admins for registration disputes.
                </p>
              </div>

              {/* Account History */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-caption border-t border-hairline pt-4">
                <div>
                  <span className="text-micro text-ink-faint block font-semibold">
                    Account Created
                  </span>
                  <span className="font-semibold text-ink">
                    {user.createdAt ? formatDate(user.createdAt) : 'Initial Registration'}
                  </span>
                </div>

                <div>
                  <span className="text-micro text-ink-faint block font-semibold">
                    Last Active Session
                  </span>
                  <span className="font-semibold text-ink">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Currently active'}
                  </span>
                </div>
              </div>

              {/* Sign out Action Area */}
              <div className="p-4 rounded-xl bg-surface-sunken border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="font-semibold text-caption text-ink block">
                    Sign Out of Kaziranga Portal
                  </span>
                  <span className="text-micro text-ink-muted block">
                    Terminates your current session on this browser.
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLogoutConfirm(true)}
                  leftIcon={<LogOut className="w-4 h-4 text-signal-danger" />}
                  className="hover:border-signal-danger hover:text-signal-danger"
                >
                  Sign Out
                </Button>
              </div>
            </Card>
          </div>
        </Reveal>
      )}

      {/* ─── Logout Confirmation Modal ─── */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={async () => {
          setIsLoggingOut(true);
          try {
            await logout();
          } finally {
            setIsLoggingOut(false);
            setShowLogoutConfirm(false);
          }
        }}
        title="Sign out of Kaziranga Portal"
        message="Are you sure you want to sign out? You will need your IIT Madras Google account to sign in again to access your event registrations and submissions."
        confirmText="Sign out"
        cancelText="Stay signed in"
        variant="danger"
        isLoading={isLoggingOut}
      />
    </div>
  );
}