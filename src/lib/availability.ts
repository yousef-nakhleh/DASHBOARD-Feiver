import { supabase } from './supabase';
import { DateTime } from 'luxon';

export async function getAvailableTimeSlots(
  barberId: string,
  date: string,
  serviceDuration: number,
  businessTimezone: string = 'Europe/Rome'
) {
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('appointment_start, duration_min')
    .eq('appointment_date', date)
    .eq('barber_id', barberId)
    .in('appointment_status', ['pending', 'confirmed'])
    .order('appointment_start', { ascending: true });

  if (error) {
    console.error('Failed to fetch appointments:', error);
    return [];
  }

  // Define business hours in the business timezone
  const startOfDay = DateTime.fromISO(`${date}T06:00:00`, { zone: businessTimezone });
  const endOfDay = DateTime.fromISO(`${date}T21:00:00`, { zone: businessTimezone });
  const slots: { start: Date; end: Date }[] = [];

  // Convert existing appointments to business timezone for comparison
  const appointmentRanges = appointments.map((a) => {
    const start = DateTime.fromISO(a.appointment_start, { zone: 'utc' }).setZone(businessTimezone);
    const end = start.plus({ minutes: a.duration_min });
    return { start, end };
  });

  let current = startOfDay;

  while (current.plus({ minutes: serviceDuration }) <= endOfDay) {
    const potentialEnd = current.plus({ minutes: serviceDuration });

    const conflict = appointmentRanges.some(
      (a) => current < a.end && potentialEnd > a.start
    );

    if (!conflict) {
      slots.push({ 
        start: current.toJSDate(), 
        end: potentialEnd.toJSDate() 
      });
    }

    current = current.plus({ minutes: 15 }); // +15 minutes
  }

  return slots;
}