import type { ScheduleRule } from '@flowpilot/contracts';

export const localDate = (date = new Date()): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const localTime = (date = new Date()): string =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
export function nextOccurrence(
  schedule: ScheduleRule | null | undefined,
  after = new Date(),
): string | null {
  if (!schedule?.enabled) return null;
  const [hour, minute] = (schedule.time || '09:00').split(':').map(Number);
  if (
    !Number.isInteger(hour) ||
    hour < 0 ||
    hour > 23 ||
    !Number.isInteger(minute) ||
    minute < 0 ||
    minute > 59
  )
    return null;
  const start = new Date(after);
  if (schedule.repeat === 'once') {
    const date = new Date(`${schedule.date}T${schedule.time}:00`);
    return Number.isFinite(date.getTime()) &&
      date > start &&
      !schedule.skipDates?.includes(localDate(date))
      ? date.toISOString()
      : null;
  }
  for (let i = 0; i < 370; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    date.setHours(hour, minute, 0, 0);
    if (date <= start || schedule.skipDates?.includes(localDate(date))) continue;
    if (schedule.repeat === 'weekly' && date.getDay() !== Number(schedule.day)) continue;
    if (schedule.repeat === 'workdays' && (date.getDay() === 0 || date.getDay() === 6)) continue;
    return date.toISOString();
  }
  return null;
}
