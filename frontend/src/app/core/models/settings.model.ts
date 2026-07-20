/** Indexed 0 = Sunday .. 6 = Saturday, matching Date#getDay(); end < start means the shift wraps past midnight. */
export interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
}

/** Same every day, unlike DaySchedule - end < start means it wraps past midnight. */
export interface SleepSchedule {
  start: string;
  end: string;
}

export interface AppSettings {
  workSchedule: DaySchedule[];
  sleepSchedule: SleepSchedule;
  /** IANA name (e.g. "America/New_York"). All schedule times, and every other date computation
   *  in the app, are interpreted in this timezone. */
  timezone: string;
}

export interface CalendarStatus {
  connected: boolean;
  googleAccountEmail: string | null;
  lastSyncedAt: string | null;
}
