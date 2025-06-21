import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CalendarDays, Clock, Phone, Mail } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function CustomerProfile({ contactId }: { contactId: string }) {
  const [contact, setContact] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [nextAppointment, setNextAppointment] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: contactData } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('*')
        .eq('contact_id', contactId)
        .order('appointment_date', { ascending: false });

      setContact(contactData);
      setAppointments(appointmentsData || []);

      const upcoming = appointmentsData?.find((appt: any) =>
        new Date(`${appt.appointment_date}T${appt.appointment_time}`) > new Date()
      );

      setNextAppointment(upcoming);
    };

    fetchData();
  }, [contactId]);

  const totalVisits = appointments.length;
  const lastVisit = appointments.length ? appointments[0] : null;

  return (
    <div className="p-4">
      <div className="flex justify-between">
        <div>
          <h2 className="text-xl font-bold">Contatto</h2>
          <div className="mt-2 flex items-center space-x-2">
            <Phone size={18} />
            <span className="font-semibold">{contact?.phone ?? 'N/D'}</span>
          </div>
          <div className="mt-1 flex items-center space-x-2">
            <Mail size={18} />
            <span className="font-semibold">{contact?.email ?? 'N/D'}</span>
          </div>
          <div className="mt-1 flex items-center space-x-2">
            <Clock size={18} />
            <span className="font-semibold">Visite totali: {totalVisits}</span>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold">Dettagli</h2>
          <div className="mt-2 flex items-center space-x-2">
            <CalendarDays size={18} />
            <span className="font-semibold">
              Ultima visita: {lastVisit ? `${lastVisit.appointment_date}` : 'N/D'}
            </span>
          </div>
          <div className="mt-1 flex items-center space-x-2">
            <CalendarDays size={18} />
            <span className="font-semibold">
              Prossima visita: {nextAppointment ? `${nextAppointment.appointment_date}` : 'N/D'}
            </span>
            {!nextAppointment && (
              <button className="ml-2 px-3 py-1 bg-blue-600 text-white rounded text-sm">
                Prenota ora
              </button>
            )}
          </div>
        </div>
      </div>

      <hr className="my-4" />

      <h3 className="text-lg font-semibold text-gray-700">Storico Appuntamenti</h3>
      {appointments.length === 0 ? (
        <p className="text-gray-500 mt-2">Nessun appuntamento trovato</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {appointments.map((appt) => (
            <li key={appt.id} className="text-gray-800">
              {appt.appointment_date} alle {appt.appointment_time} — {appt.service_id}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}