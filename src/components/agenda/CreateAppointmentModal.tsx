// src/components/agenda/CreateAppointmentModal.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import ContactPickerModal from './ContactPickerModal';
import NewContactForm from '../rubrica/NewContactForm';
import { UserRoundSearch, X, Plus } from 'lucide-react';
import { toUTCFromLocal } from '../../lib/timeUtils';
import { useAuth } from '../auth/AuthContext';

const CreateAppointmentModal = ({ 
  businessTimezone, 
  onClose,
  onCreated,
  initialBarberId = '',   // ✅ safe default
  initialDate = '',        // ✅ safe default
  initialTime = '',        // ✅ safe default
}) => {
  const { profile } = useAuth();
  const businessId = profile?.business_id;

  const [customerName, setCustomerName] = useState('');
  const [selectedContactId, setSelectedContactId] = useState('');
  const [services, setServices] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [selectedBarber, setSelectedBarber] = useState(initialBarberId);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedTime, setSelectedTime] = useState(initialTime);
  const [duration, setDuration] = useState(30);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showNewContactForm, setShowNewContactForm] = useState(false);

  // fetch services + barbers
  useEffect(() => {
    if (!businessId) return;
    const fetchData = async () => {
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
    };
    fetchData();
  }, [businessId]);

  // fetch appointments for availability
  useEffect(() => {
    if (!businessId || !selectedDate || !selectedBarber) return;
    const fetchAppointments = async () => {
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
      const { data } = await supabase
        .from('appointments')
        .select('appointment_date, services(duration_min)')
        .eq('barber_id', selectedBarber)
        .eq('business_id', businessId)
        .gte('appointment_date', startOfDay)
        .lte('appointment_date', endOfDay)
        .or('appointment_status.is.null,appointment_status.neq.cancelled');
      setAppointments(data || []);
    };
    fetchAppointments();
  }, [selectedDate, selectedBarber, businessTimezone, businessId]);

  const handleServiceChange = (e) => {
    const selectedId = e.target.value;
    setSelectedService(selectedId);
    const matchedService = services.find((s) => s.id === selectedId);
    if (matchedService) setDuration(matchedService.duration_min);
  };

  const handleCreate = async () => {
    if (!businessId) {
      setErrorMsg('Profilo non configurato.');
      return;
    }
    if (!selectedDate || !selectedTime || !selectedService || !selectedBarber || !selectedContactId) {
      setErrorMsg('Tutti i campi sono obbligatori.');
      return;
    }

    const appointmentStartUTC = toUTCFromLocal({
      date: selectedDate,
      time: selectedTime,
      timezone: businessTimezone,
    });

    const start = new Date(appointmentStartUTC);
    const end   = new Date(start.getTime() + duration * 60000);

    const overlap = appointments.some((appt) => {
      const apptStart = new Date(appt.appointment_date);
      const apptEnd   = new Date(apptStart.getTime() + (appt.services?.duration_min || 30) * 60000);
      return start < apptEnd && end > apptStart;
    });

    if (overlap) {
      setErrorMsg('Questo orario è già occupato.');
      return;
    }

    const { error } = await supabase.from('appointments').insert([{
      contact_id:   selectedContactId,
      service_id:   selectedService,
      barber_id:    selectedBarber,
      appointment_date: appointmentStartUTC,
      duration_min: duration,
      business_id:  businessId,
    }]);

    if (!error) {
      onCreated();
      onClose();
    } else {
      setErrorMsg('Errore durante la creazione.');
    }
  };

  const handleSelectContact = (contact) => {
    setCustomerName(contact.customer_name);
    setSelectedContactId(contact.id);
    setShowContactPicker(false);
  };
  const handleNewContactCreated = (newContact: any) => {
    setCustomerName(newContact.full_name);
    setSelectedContactId(newContact.id);
    setShowNewContactForm(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto ${showNewContactForm ? 'w-[1000px]' : 'w-[500px]'}`}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">
            {showNewContactForm ? 'Nuovo Appuntamento + Contatto' : 'Nuovo Appuntamento'}
          </h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        {/* Body */}
        <div className={`p-6 ${showNewContactForm ? 'flex gap-6' : 'space-y-6'}`}>
          {/* Left column: form */}
          <div className={showNewContactForm ? 'flex-1 space-y-6' : 'space-y-6'}>
            {/* Cliente + contact picker */}
            <div>
              <label className="block text-sm font-semibold mb-2">Nome Cliente</label>
              <div className="relative">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 pr-20"
                  placeholder="Inserisci nome cliente o seleziona dalla rubrica"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                  <button onClick={() => setShowContactPicker(true)}><UserRoundSearch size={18} /></button>
                  <button onClick={() => setShowNewContactForm(!showNewContactForm)}><Plus size={18} /></button>
                </div>
              </div>
            </div>
            {/* Servizio, Barbiere, Data, Durata, Orario (same as before) */}
            {/* ... keep your existing select/inputs here ... */}
          </div>

          {/* Right column: New Contact */}
          {showNewContactForm && (
            <div className="flex-1 border-l pl-6">
              <NewContactForm onCreated={handleNewContactCreated} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t">
          <button onClick={onClose} className="px-6 py-3 rounded-xl bg-gray-100">Annulla</button>
          <button onClick={handleCreate} className="px-6 py-3 rounded-xl bg-black text-white">Crea Appuntamento</button>
        </div>

        {showContactPicker && (
          <ContactPickerModal onSelect={handleSelectContact} onClose={() => setShowContactPicker(false)} businessId={businessId} />
        )}
      </div>
    </div>
  );
};

export default CreateAppointmentModal;