import { collection, doc, collectionGroup } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const DEFAULT_TENURE_ID = '2026-2027';
export const DEFAULT_MAIN_EVENT_ID = 'communityDayAug26';

// ---------------------------------------------------------
// Main Event Layer
// ---------------------------------------------------------
export const getMainEventsCollectionRef = (tenureId: string = DEFAULT_TENURE_ID) => 
  collection(db, 'tenures', tenureId, 'mainEvents');
export const getMainEventRef = (tenureId: string = DEFAULT_TENURE_ID, mainEventId: string = DEFAULT_MAIN_EVENT_ID) => 
  doc(db, 'tenures', tenureId, 'mainEvents', mainEventId);

// ---------------------------------------------------------
// Event Layer
// ---------------------------------------------------------
export const getEventsCollectionRef = (tenureId: string = DEFAULT_TENURE_ID, mainEventId: string = DEFAULT_MAIN_EVENT_ID) => 
  collection(db, 'tenures', tenureId, 'mainEvents', mainEventId, 'events');
export const getEventRef = (tenureId: string = DEFAULT_TENURE_ID, mainEventId: string = DEFAULT_MAIN_EVENT_ID, eventId: string) => 
  doc(db, 'tenures', tenureId, 'mainEvents', mainEventId, 'events', eventId);

// ---------------------------------------------------------
// Data Collections (Registrations, Submissions, Winners)
// ---------------------------------------------------------

/**
 * Registrations can technically live under an Event or a Sub-Event. 
 * For legacy events (e.g., Spotlight Showdown), they live under the Event directly.
 * For new nested events, they live under the Sub-Event.
 */
export const getRegistrationsCollectionRef = (
  tenureId: string = DEFAULT_TENURE_ID, 
  mainEventId: string = DEFAULT_MAIN_EVENT_ID, 
  eventId: string, 
  subEventId?: string | null
) => {
  if (subEventId) {
    return collection(db, 'tenures', tenureId, 'mainEvents', mainEventId, 'events', eventId, 'subEvents', subEventId, 'registrations');
  }
  return collection(db, 'tenures', tenureId, 'mainEvents', mainEventId, 'events', eventId, 'registrations');
};

export const getRegistrationRef = (
  tenureId: string = DEFAULT_TENURE_ID, 
  mainEventId: string = DEFAULT_MAIN_EVENT_ID, 
  eventId: string, 
  subEventId: string | null | undefined, 
  registrationId: string
) => {
  if (subEventId) {
    return doc(db, 'tenures', tenureId, 'mainEvents', mainEventId, 'events', eventId, 'subEvents', subEventId, 'registrations', registrationId);
  }
  return doc(db, 'tenures', tenureId, 'mainEvents', mainEventId, 'events', eventId, 'registrations', registrationId);
};

// ---------------------------------------------------------
// Cross-Hierarchy Queries (Collection Groups)
// ---------------------------------------------------------

/**
 * Used for querying across all instances regardless of hierarchy path.
 */
export const getAllEventsGroupRef = () => collectionGroup(db, 'events');
export const getAllRegistrationsGroupRef = () => collectionGroup(db, 'registrations');

// ---------------------------------------------------------
// Team Invitations (Top-level collection for easy querying)
// ---------------------------------------------------------
export const getTeamInvitationsCollectionRef = () => collection(db, 'teamInvitations');
export const getTeamInvitationRef = (invitationId: string) => doc(db, 'teamInvitations', invitationId);
