'use client';
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { EventForm } from '@/components/portal/admin/EventForm';
import { isMockMode } from '@/lib/firebase';
import { sendNotice } from '@/lib/portal/portalApi';
import { canOrganiseEvents } from '@/lib/portal/permissions';
import { mockStore } from '@/lib/portal/firebase/mockStore';
import { setDoc } from 'firebase/firestore';
import { getEventRef, DEFAULT_TENURE_ID } from '@/lib/portal/firebase/paths';
import { Card } from '@/components/portal/ui/Card';
import { Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/portal/ui/Toast';

export default function ClassicCreateEventPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  if (!user || !canOrganiseEvents(user.role)) {
    return null;
  }

  const handleCreate = async (eventData: any) => {
    setIsLoading(true);
    try {
      if (isMockMode) {
        mockStore.createEvent(
          {
            ...eventData,
            createdBy: user.uid,
          },
          user,
        );
      } else {
        const eventId = 'evt_' + Date.now();
        const mainEvtId = eventData.mainEventId || 'communityDayAug26';
        const docRef = getEventRef(DEFAULT_TENURE_ID, mainEvtId, eventId);
        const isPublished = eventData.status === 'PUBLISHED';
        const newEvent = {
          ...eventData,
          id: eventId,
          mainEventId: mainEvtId,
          tenureId: DEFAULT_TENURE_ID,
          createdBy: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          currentRegistrationCount: 0,
          hasBeenPublished: isPublished,
          customQuestions: eventData.customQuestions || [],
          maximumParticipants: eventData.maximumParticipants ?? null,
          maximumTeamSize: eventData.maximumTeamSize ?? null,
          rulebookUrl: eventData.rulebookUrl ?? null,
          coverImageUrl: eventData.coverImageUrl ?? null,
          requireSubmission: eventData.requireSubmission ?? false,
          submissionTiming: eventData.submissionTiming ?? 'DURING_REGISTRATION',
          submissionType: eventData.submissionType ?? 'LINK',
          submissionInstructions: eventData.submissionInstructions ?? null,
          submissionDeadline: eventData.submissionDeadline ?? null,
        };
        await setDoc(docRef, newEvent);

        if (isPublished) {
          await sendNotice({
            kind: 'EVENT_STATUS',
            event: { tenureId: DEFAULT_TENURE_ID, mainEventId: mainEvtId, eventId },
            change: 'PUBLISHED',
          });
        }
      }

      router.push('/admin/events');
    } catch (err: any) {
      console.error('Failed to create event:', err);
      toast.error('Could not create event', err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/admin/events" className="p-2 rounded-xl hover:bg-brand-soft">
          <ArrowLeft className="w-5 h-5 text-ink-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-ink flex items-center gap-2">
            <Calendar className="w-6 h-6 text-ink-muted" />
            <span>New event</span>
          </h1>
        </div>
      </div>

      <Card className="p-5 sm:p-6 overflow-visible">
        <EventForm onSubmit={handleCreate} isLoading={isLoading} />
      </Card>
    </div>
  );
}
