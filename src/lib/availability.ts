// src/lib/availability.ts
import { supabase } from './supabase';

export async function getAvailableTimeSlots(
  barberId: string,
  date: string,
  serviceDuration: number
) {
  /* ➜  PRIMA ED UNICA MODIFICA */
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('appointment_time, duration_min')
    .eq('appointment_date', date)
    .eq('barber_id', barberId)
    .in('appointment_status', ['pending', 'confirmed'])   // ← filtriamo SOLO questi
    .order('appointment_time', { ascending: true });

  if (error) {
    console.error('Failed to fetch appointments:', error);
    return [];
  }

  /* --- codice già presente, invariato --- */
  const startOfDay = new Date(`${date}T06:00:00`);
  const endOfDay   = new Date(`${date}T21:00:00`);
  const slots: { start: Date; end: Date }[] = [];

  const appointmentRanges = appointments.map((a) => {
    const start = new Date(`${date}T${a.appointment_time}`);
    const end   = new Date(start.getTime() + a.duration_min * 60000);
    return { start, end };
  });

  let current = new Date(startOfDay);

  while (current.getTime() + serviceDuration * 60000 <= endOfDay.getTime()) {
    const potentialEnd = new Date(current.getTime() + serviceDuration * 60000);

    const conflict = appointmentRanges.some(
      (a) => current < a.end && potentialEnd > a.start
    );

    if (!conflict) slots.push({ start: new Date(current), end: new Date(potentialEnd) });

    current = new Date(current.getTime() + 15 * 60000); // +15'
  }

  return slots;
}