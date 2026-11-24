// ─────────────────────────────────────────────────────────────────────────────
// Notices: notifications that go to someone other than the person acting
// (the whole house, a team leader, an event's registrants). Browsers may only
// write notifications addressed to themselves, so these are requested from
// the server, which checks the caller's part in what happened and writes them.
//
// The browser describes what happened; the server reads the records itself and
// never takes a title, message or recipient from the request.
// ─────────────────────────────────────────────────────────────────────────────

/** Where an event lives in Firestore. */
export interface EventPath {
  tenureId: string;
  mainEventId: string;
  eventId: string;
  subEventId?: string | null;
}

export type Notice =
  /** An organiser published, re-published or took down one of their events. */
  | { kind: 'EVENT_STATUS'; event: EventPath; change: 'PUBLISHED' | 'REPUBLISHED' | 'REMOVED' }
  /** An admin deleted an event; it no longer exists to be read. */
  | { kind: 'EVENT_DELETED'; name: string }
  /** An organiser moved a published event's schedule or venue. */
  | { kind: 'EVENT_UPDATED'; event: EventPath }
  /** An organiser published an event's results. */
  | { kind: 'RESULTS_PUBLISHED'; event: EventPath }
  /** The invitee accepted or declined a team invitation. */
  | { kind: 'TEAM_INVITE_RESPONSE'; invitationId: string }
  /** A team member or leader cancelled their registration. */
  | { kind: 'TEAM_WITHDRAWN'; event: EventPath; registrationId: string }
  /** Someone joined a team; tell the leader if it is now complete. */
  | { kind: 'TEAM_READY'; event: EventPath; teamId: string }
  /** "Registration closes soon" notices for events closing within a day. */
  | { kind: 'DEADLINES' };
