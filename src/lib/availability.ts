// src/lib/availability.ts
import { supabase } from './supabase';
import { toLocalFromUTC } from './timeUtils';
import { DateTime } from 'luxon';

export async function getAvailableTimeSlots(
  barberId: string,
  date: string,
  serviceDuration: number,
  businessTimezone: string = 'Europe/Rome'
) {
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('appointment_date, services(duration_min)')
    .eq('appointment_date', date)
    .eq('barber_id', barberId)
    .in('appointment_status', ['pending', 'confirmed'])
    .order('appointment_date', { ascending: true });

  if (error) {
    console.error('Failed to fetch appointments:', error);
    return [];
  }

  const startOfDay = DateTime.fromISO(`${date}T06:00:00`, { zone: businessTimezone });
  const endOfDay = DateTime.fromISO(`${date}T21:00:00`, { zone: businessTimezone });

  const appointmentRanges = appointments.map((a) => {
    const start = toLocalFromUTC({
      utcString: a.appointment_date,
      timezone: businessTimezone,
    });
    const end = start.plus({ minutes: a.services?.duration_min || 30 });
    return { start, end };
  });

  const slots: { start: Date; end: Date }[] = [];
  let current = startOfDay;

  while (current.plus({ minutes: serviceDuration }) <= endOfDay) {
    const potentialEnd = current.plus({ minutes: serviceDuration });

    const conflict = appointmentRanges.some(
      (a) => current < a.end && potentialEnd > a.start
    );

    if (!conflict) {
      slots.push({
        start: current.toJSDate(),
        end: potentialEnd.toJSDate(),
      });
    }

    current = current.plus({ minutes: 15 });
  }

  return slots;
}