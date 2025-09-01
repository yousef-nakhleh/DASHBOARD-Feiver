// src/components/agenda/CreateAppointmentModal.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import ContactPickerModal from './ContactPickerModal';
import NewContactForm from '../rubrica/NewContactForm';
import { UserRoundSearch, X, Plus } from 'lucide-react';
import { toUTCFromLocal } from '../../lib/timeUtils';
import { useAuth } from '../auth/AuthContext';

type Props = {
  businessTimezone: string;
  onClose: () => void;
  onCreated: () => void;
  initialBarberId?: string;
  initialDate?: string;   // 'yyyy-MM-dd'
  initialTime?: string;   // 'HH:mm'
};

const CreateAppointmentModal: React.FC<Props> = ({
  businessTimezone,
  onClose,
  onCreated,
  initialBarberId = '',
  initialDate = '',
  initialTime = '',
}) => {
  const { profile } = useAuth();
  const businessId = profile?.business_id;

  // UI state
  const [customerName, setCustomerName] = useState('');
  const [selectedContactId, setSelectedContactId] = useState('');

  // data for selects
  const [services, setServices] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);

  // selection
  const [selectedService, setSelectedService] = useState('');
  const [selectedBarber, setSelectedBarber] = useState(initialBarberId);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedTime, setSelectedTime] = useState(initialTime);

  // derived
  const [duration, setDuration] = useState<number>(30);

  // availability check
  const [appointments, setAppointments] = useState<any[]>([]);

  // ux
  const [errorMsg, setErrorMsg] = useState('');
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showNewContactForm, setShowNewContactForm] = useState(false);

  // fetch base data
  useEffect(() => {
    if (!businessId) return;
    (async () => {
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', businessId);

      const { data: barbersData } = await supabase
        .from('barbers')
        .select('*')
        .eq('business_id', businessId);

      setServices(servicesData || []);
      setBarbers(barbersData || []);
    })();
  }, [businessId]);

  // when service changes, sync duration
  useEffect(() => {
    if (!selectedService) return;
    const s = services.find((x) => x.id === selectedService);
    if (s?.duration_min) setDuration(s.duration_min);
  }, [selectedService, services]);

  // fetch existing appointments for the selected date/barber for overlap marking
  useEffect(() => {
    if (!businessId) return;
    if (!selectedDate || !selectedBarber) {
      setAppointments([]);
      return;
    }

    (async () => {
      const startOfDay = toUTCFromLocal({
        date: selectedDate,
        time: '00:00',
        timezone: businessTimezone,
      });
      const endOfDay = toUTCFromLocal({
        date: selectedDate,
        time: '23:59',
        timezone: businessTimezone,
      });

      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_date, services(duration_min)')
        .eq('barber_id', selectedBarber)
        .eq('business_id', businessId)
        .gte('appointment_date', startOfDay)
        .lte('appointment_date', endOfDay)
        .or('appointment_status.is.null,appointment_status.neq.cancelled');

      if (!error) setAppointments(data || []);
      else setAppointments([]);
    })();
  }, [selectedDate, selectedBarber, businessTimezone, businessId]);

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedService(id);
    const matched = services.find((s) => s.id === id);
    if (matched?.duration_min) setDuration(matched.duration_min);
  };

  const handleCreate = async () => {
    setErrorMsg('');

    if (!businessId) {
      setErrorMsg('Profilo non configurato.');
      return;
    }
    if (!selectedContactId || !selectedService || !selectedBarber || !selectedDate || !selectedTime) {
      setErrorMsg('Compila tutti i campi (cliente, servizio, barbiere, data e orario).');
      return;
    }

    // convert to UTC for storage
    const appointmentStartUTC = toUTCFromLocal({
      date: selectedDate,
      time: selectedTime,
      timezone: businessTimezone,
    });

    // local overlap check based on UTC values already in DB
    const start = new Date(appointmentStartUTC);
    const end = new Date(start.getTime() + duration * 60000);

    const overlaps = appointments.some((appt) => {
      const aStart = new Date(appt.appointment_date);
      const aEnd = new Date(aStart.getTime() + (appt.services?.duration_min || 30) * 60000);
      return start < aEnd && end > aStart;
    });

    if (overlaps) {
      setErrorMsg('Questo orario è già occupato.');
      return;
    }

    const { error } = await supabase.from('appointments').insert([
      {
        contact_id: selectedContactId,
        service_id: selectedService,
        barber_id: selectedBarber,
        appointment_date: appointmentStartUTC,
        duration_min: duration,
        business_id: businessId,
      },
    ]);

    if (error) {
      console.error(error);
      setErrorMsg('Errore durante la creazione dell’appuntamento.');
      return;
    }

    onCreated();
    onClose();
  };

  const handleSelectContact = (contact: any) => {
    setCustomerName(contact.customer_name);
    setSelectedContactId(contact.id);
    setShowContactPicker(false);
  };

  const handleNewContactCreated = (newContact: any) => {
    setCustomerName(newContact.full_name);
    setSelectedContactId(newContact.id);
    setShowNewContactForm(false);
  };

  // build 10-minute time options (06:00 → 21:00)
  const timeOptions = Array.from({ length: 90 }, (_, i) => {
    const hour = 6 + Math.floor(i / 6);
    const minute = (i % 6) * 10;
    const t = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    // If date/barber missing, we can’t compute occupancy; just return free option.
    if (!selectedDate || !selectedBarber) {
      return { value: t, label: t, disabled: false };
    }

    // candidate interval in UTC
    const candidateStartUTC = toUTCFromLocal({
      date: selectedDate,
      time: t,
      timezone: businessTimezone,
    });
    const slotStart = new Date(candidateStartUTC);
    const slotEnd = new Date(slotStart.getTime() + duration * 60000);

    const occupied = appointments.some((appt) => {
      const apptStart = new Date(appt.appointment_date);
      const apptEnd = new Date(apptStart.getTime() + (appt.services?.duration_min || 30) * 60000);
      return slotStart < apptEnd && slotEnd > apptStart;
    });

    return { value: t, label: `${t}${occupied ? ' (occupato)' : ''}`, disabled: occupied };
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto transition-all duration-300 ${showNewContactForm ? 'w-[1000px]' : 'w-[500px]'}`}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-black">
            {showNewContactForm ? 'Nuovo Appuntamento + Contatto' : 'Nuovo Appuntamento'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
            <X size={20} className="text-black" />
          </button>
        </div>

        {/* Body */}
        <div className={`p-6 ${showNewContactForm ? 'flex gap-6' : 'space-y-6'}`}>
          {/* Left column (form) */}
          <div className={showNewContactForm ? 'flex-1 space-y-6' : 'space-y-6'}>
            {/* Nome cliente + picker */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">Nome Cliente</label>
              <div className="relative">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (selectedContactId) setSelectedContactId('');
                  }}
                  readOnly={!!selectedContactId}
                  className={`w-full border border-gray-200 rounded-xl px-4 py-3 pr-20 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black placeholder-gray-400 ${
                    selectedContactId ? 'bg-green-50 border-green-200' : ''
                  }`}
                  placeholder={selectedContactId ? 'Contatto selezionato' : 'Inserisci nome cliente o seleziona dalla rubrica'}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button
                    onClick={() => setShowContactPicker(true)}
                    className="text-gray-500 hover:text-black"
                    title="Seleziona dalla rubrica"
                  >
                    <UserRoundSearch size={18} />
                  </button>
                  <button
                    onClick={() => setShowNewContactForm((v) => !v)}
                    className="text-gray-500 hover:text-black"
                    title="Crea nuovo contatto"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
              {selectedContactId && (
                <p className="text-xs text-green-600 mt-1">✓ Contatto selezionato dalla rubrica</p>
              )}
            </div>

            {/* Servizio */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">Servizio</label>
              <select
                value={selectedService}
                onChange={handleServiceChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black bg-white"
              >
                <option value="" className="text-gray-400">Seleziona servizio</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id} className="text-black">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Barbiere */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">Barbiere</label>
              <select
                value={selectedBarber}
                onChange={(e) => setSelectedBarber(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black bg-white"
              >
                <option value="" className="text-gray-400">Seleziona barbiere</option>
                {barbers.map((b) => (
                  <option key={b.id} value={b.id} className="text-black">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Data & Durata */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-black mb-2">Data</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-2">Durata (minuti)</label>
                <input
                  type="number"
                  value={duration}
                  min={10}
                  step={5}
                  onChange={(e) => setDuration(parseInt(e.target.value || '0', 10))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black bg-white"
                />
              </div>
            </div>

            {/* Orario */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">Orario</label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black bg-white"
              >
                <option value="" className="text-gray-400">Seleziona orario</option>
                {timeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled} className={opt.disabled ? 'text-gray-400 line-through' : 'text-black'}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Error */}
            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-sm font-medium">{errorMsg}</p>
              </div>
            )}
          </div>

          {/* Right column (new contact) */}
          {showNewContactForm && (
            <div className="flex-1 border-l border-gray-200 pl-6">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-black mb-2">Nuovo Contatto</h3>
                <p className="text-sm text-gray-600">
                  Crea un nuovo contatto che verrà automaticamente selezionato per questo appuntamento.
                </p>
              </div>
              <NewContactForm onCreated={handleNewContactCreated} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleCreate}
            className="px-6 py-3 rounded-xl bg-black text-white hover:bg-gray-800 font-medium transition-colors"
          >
            Crea Appuntamento
          </button>
        </div>

        {/* Contact picker modal */}
        {showContactPicker && (
          <ContactPickerModal
            onSelect={handleSelectContact}
            onClose={() => setShowContactPicker(false)}
            businessId={businessId}
          />
        )}
      </div>
    </div>
  );
};

export default CreateAppointmentModal;