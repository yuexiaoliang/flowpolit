export type ScheduleRepeat = 'once' | 'daily' | 'workdays' | 'weekly';

export interface ScheduleRule {
  repeat: ScheduleRepeat;
  time: string;
  enabled: boolean;
  day?: number;
  date?: string;
  skipDates?: string[];
  nextAt?: string | null;
}
