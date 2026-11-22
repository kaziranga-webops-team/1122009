'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { EventItem } from '@/types/portal';
import { EventForm } from '@/components/portal/admin/EventForm';
import { isMockMode } from '@/lib/firebase';
import { organiserEventsQuery } from '@/lib/portal/organiser';
import { sendNotice } from '@/lib/portal/portalApi';
import { canOrganiseEvents } from '@/lib/portal/permissions';
import { mockStore } from '@/lib/portal/firebase/mockStore';
import { updateDoc, query, where, getDocs } from 'firebase/firestore';
import {
  getEventRef,
  DEFAULT_TENURE_ID,
  DEFAULT_MAIN_EVENT_ID,
} from '@/lib/portal/firebase/paths';
import { Card } from '@/components/portal/ui/Card';
import { Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/portal/ui/Toast';

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && !canOrganiseEvents(user.role)) {
      router.replace('/dashboard');
      return;
    }

    const fetchEvent = async () => {
      setLoading(true);
      if (isMockMode) {
        setEvent(mockStore.getEventById(eventId) || null);
        setLoading(false);
      } else {
        try {
          const scoped = organiserEventsQuery(user);
          if (scoped) {
            const q = user?.role === 'COMMUNITY_HEAD' ? scoped : query(scoped, where('id', '==', eventId));
            const snap = await getDocs(q);
            const match = snap.docs.find((d) => d.id === eventId || d.data().id === eventId);
            if (match) setEvent({ id: match.id, ...match.data() } as EventItem);
          }
        } catch (err) {
          console.error('Error fetching event:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchEvent();
  }, [eventId, user, router]);

  if (!user || !canOrganiseEvents(user.role)) return null;

  if (loading) {
    return <div className="p-8 text-center text-caption text-ink-faint">Loading event data...</div>;
  }

  if (!event) {
    return <div className="p-12 text-center text-caption text-ink-faint">Event not found.</div>;
  }

  const handleUpdate = async (eventData: any) => {
    setIsSubmitting(true);
    try {
      if (isMockMode) {
        mockStore.updateEvent(eventId, eventData, user);
      } else {
        const docRef = getEventRef(
          event?.tenureId || DEFAULT_TENURE_ID,
          event?.mainEventId || DEFAULT_MAIN_EVENT_ID,
          eventId,
        );
        const wasPublished = event.status === 'PUBLISHED';
        const willBePublished = (eventData.status ?? event.status) === 'PUBLISHED';
        const hasBeenPublished = Boolean(event.hasBeenPublished || wasPublished || willBePublished);

        await updateDoc(docRef, {
          ...eventData,
          hasBeenPublished,
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
          updatedAt: new Date().toISOString(),
        });

        const path = {
          tenureId: event.tenureId || DEFAULT_TENURE_ID,
          mainEventId: event.mainEventId || DEFAULT_MAIN_EVENT_ID,
          eventId,
        };
        if (!wasPublished && willBePublished) {
          await sendNotice({ kind: 'EVENT_STATUS', event: path, change: event.hasBeenPublished ? 'REPUBLISHED' : 'PUBLISHED' });
        } else if (wasPublished && !willBePublished) {
          await sendNotice({ kind: 'EVENT_STATUS', event: path, change: 'REMOVED' });
        }

        const scheduleOrVenueChanged =
          (eventData.startDateTime && eventData.startDateTime !== event.startDateTime) ||
          (eventData.endDateTime && eventData.endDateTime !== event.endDateTime) ||
          (eventData.venue && eventData.venue !== event.venue);

        // The server finds the confirmed registrants and tells each of them.
        if (wasPublished && willBePublished && scheduleOrVenueChanged) {
          await sendNotice({ kind: 'EVENT_UPDATED', event: path });
        }
      }
      router.push('/admin/events');
    } catch (err: any) {
      console.error('Failed to update event:', err);
      toast.error('Could not save changes', 'The event was not updated. Please try again.');
    } finally {
      setIsSubmitting(false);
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
            <span>Edit Event</span>
          </h1>
          <p className="text-caption text-ink-muted mt-0.5">
            Modify event rules, venue, registration deadlines, and cover images.
          </p>
        </div>
      </div>

      <Card className="p-5 sm:p-6 overflow-visible">
        <EventForm initialData={event} onSubmit={handleUpdate} isLoading={isSubmitting} />
      </Card>
    </div>
  );
}
