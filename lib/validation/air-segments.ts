// Shared model for the air-ticket trip builder. A submission carries an
// `airTripType` plus an `airSegments` JSON array; this module parses, validates
// and renders that data so the client form, the server schema and the email/admin
// serialisation all agree on one shape.

export const TRIP_TYPES = ["One way", "Round trip", "Multi-city"] as const;
export type TripType = (typeof TRIP_TYPES)[number];

export type AirSegment = {
  from: string;
  to: string;
  date: string;
  /** Round-trip only: the inbound date for the single segment. */
  returnDate?: string;
};

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export const MAX_SEGMENTS = 6;

export function isTripType(value: string): value is TripType {
  return (TRIP_TYPES as readonly string[]).includes(value);
}

export function parseSegments(raw: unknown): AirSegment[] {
  try {
    const arr = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, MAX_SEGMENTS).map((s) => ({
      from: typeof s?.from === "string" ? s.from.trim() : "",
      to: typeof s?.to === "string" ? s.to.trim() : "",
      date: typeof s?.date === "string" ? s.date.trim() : "",
      returnDate: typeof s?.returnDate === "string" ? s.returnDate.trim() : "",
    }));
  } catch {
    return [];
  }
}

export type AirMessages = {
  tripRequired: string;
  multiMin: string;
  fromRequired: string;
  toRequired: string;
  dateRequired: string;
  datePast: string;
  samePlace: string;
  returnRequired: string;
  returnBeforeDepart: string;
};

// Returns a map of per-field error keys → message. Keys: `from-<i>`, `to-<i>`,
// `date-<i>`, `return`, `trip`. An empty map means valid. `today` is ISO.
export function validateAirSegments(
  tripType: string,
  segments: AirSegment[],
  today: string,
  msg: AirMessages,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!isTripType(tripType)) {
    errors.trip = msg.tripRequired;
    return errors;
  }
  if (tripType === "Multi-city" && segments.length < 2) {
    errors.trip = msg.multiMin;
  }

  segments.forEach((seg, i) => {
    const from = seg.from.trim();
    const to = seg.to.trim();
    if (!from) errors[`from-${i}`] = msg.fromRequired;
    if (!to) errors[`to-${i}`] = msg.toRequired;
    else if (from && from.toLowerCase() === to.toLowerCase())
      errors[`to-${i}`] = msg.samePlace;
    if (!ISO_DATE.test(seg.date)) errors[`date-${i}`] = msg.dateRequired;
    else if (seg.date < today) errors[`date-${i}`] = msg.datePast;
  });

  if (tripType === "Round trip") {
    const seg = segments[0];
    const ret = seg?.returnDate ?? "";
    if (!ISO_DATE.test(ret)) errors.return = msg.returnRequired;
    else if (seg && ISO_DATE.test(seg.date) && ret < seg.date)
      errors.return = msg.returnBeforeDepart;
  }

  return errors;
}

// Human-readable one-line route for storage / email / admin.
export function serializeRoute(tripType: string, segments: AirSegment[]): string {
  if (!segments.length) return "";
  if (tripType === "Round trip") {
    const s = segments[0];
    return `${s.from} ⇄ ${s.to}`;
  }
  if (tripType === "Multi-city") {
    return segments.map((s) => `${s.from} → ${s.to}`).join(", ");
  }
  const s = segments[0];
  return `${s.from} → ${s.to}`;
}
