/**
 * The house's regions — the same cities the meetup gallery is filed under.
 * Profiles, registrations and the member ID card all use this list.
 */
export const REGIONS = [
  'Bengaluru',
  'Chandigarh',
  'Chennai',
  'Delhi',
  'Hyderabad',
  'Kolkata',
  'Lucknow',
  'Mumbai',
  'Patna',
  'Other',
] as const;

export type Region = (typeof REGIONS)[number];

/** Matches older free-text regions ("mumbai ", "MUMBAI") to the list. */
export function toRegion(value: string | null | undefined): Region | '' {
  const v = (value || '').trim().toLowerCase();
  if (!v) return '';
  return REGIONS.find((r) => r.toLowerCase() === v) ?? 'Other';
}
