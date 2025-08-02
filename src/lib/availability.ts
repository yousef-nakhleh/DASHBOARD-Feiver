import { supabase } from './supabase';
import { DateTime } from 'luxon';

export async function getAvailableTimeSlots(
  barberId: string,
  date: string,
  serviceDuration: number,
  businessTimezone: string = 'Europe/Rome'
) {
  // Define business hours in the business timezone
  const startOfDay = DateTime.fromISO(`${date}T06:00:00`, { zone: businessTimezone });
  const endOfDay   = DateTime.fromISO(`${date}T21:00:00`, { zone: businessTimezone });

  // Convert to UTC range for querying
  const startUTC = startOfDay.toUTC().toISO();
  const endUTC   = endOfDay.toUTC().toISO();

  // ✅ Fetch appointments based on appointment_start (in UTC range)
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('appointment_start, duration_min')
    .eq('barber_id', barberId)
    .eq('business_id', '6ebf5f92-14ff-430e-850c-f147c3dc16f4') // Replace or inject dynamically if needed
    .in('appointment_status', ['pending', 'confirmed'])
    .gte('appointment_start', startUTC)
    .lt('appointment_start', endUTC)
    .order('appointment_start', { ascending: true });

  if (error) {
    console.error('Failed to fetch appointments:', error);
    return [];
  }

  // Convert existing appointments to business timezone for overlap checking
  const appointmentRanges = appointments.map((a) => {
    const start = DateTime.fromISO(a.appointment_start, { zone: 'utc' }).setZone(businessTimezone);
    const end   = start.plus({ minutes: a.duration_min });
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