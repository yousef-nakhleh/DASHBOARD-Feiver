import { DateTime } from 'luxon';

/**
 * Converts a local business date+time to UTC (for storing in DB)
 */
export function toUTCFromLocal({
  date,       // e.g. '2025-08-01'
  time,       // e.g. '14:30'
  timezone,   // e.g. 'Europe/Rome'
}: {
  date: string;
  time: string;
  timezone: string;
}): string {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);

  return DateTime.fromObject(
    { year, month, day, hour, minute },
    { zone: timezone }
  ).toUTC().toISO();
}

/**
 * Converts a stored UTC string to the business's local time
 */
export function toLocalFromUTC({
  utcString,
  timezone,
}: {
  utcString: string;
  timezone: string;
}) {
  return DateTime.fromISO(utcString, { zone: 'utc' }).setZone(timezone);
}