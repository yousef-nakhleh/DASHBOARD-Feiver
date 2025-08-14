// src/components/agenda/CreateAppointmentModal.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import ContactPickerModal from './ContactPickerModal';
import NewContactForm from '../rubrica/NewContactForm';
import { UserRoundSearch, X, Plus } from 'lucide-react';
import { formatDateToYYYYMMDDLocal } from '../../lib/utils';
import { toUTCFromLocal, toLocalFromUTC } from '../../lib/timeUtils';
import { useAuth } from '../auth/AuthContext'; // ✅ get business_id from profile
 
const CreateAppointmentModal = ({ 
  businessTimezone, 
  onClose,
  onCreated,
  initialBarberId = '',
  initialDate = '',
  initialTime = '',
}) => {
  const { profile } = useAuth();                 // ✅ pull profile from context
  const businessId = profile?.business_id; // ✅ dynamic business id

  const [customerName, setCustomerName] = useState('');
  const [selectedContactId, setSelectedContactId] = useState('');
  const [services, setServices] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [selectedBarber, setSelectedBarber] = useState(initialBarberId);
  const [selectedDate, setSelectedDate] = useState(
    initialDate || formatDateToYYYYMMDDLocal(new Date())
  );
  const [selectedTime, setSelectedTime] = useState(initialTime || '07:00');
  const [duration, setDuration] = useState(30);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showNewContactForm, setShowNewContactForm] = useState(false);

  /* -------------------------------------------------- */
  useEffect(() => {
    if (!businessId) {
      console.log("CreateAppointmentModal: No business_id available, skipping data fetch");
      return; // wait until profile loads
    }

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

  /* ---------- ONLY CHANGE: exclude cancelled -------- */
  useEffect(() => {
    if (!businessId) {
      console.log("CreateAppointmentModal: No business_id for appointments fetch");
      return;
    }

    const fetchAppointments = async () => {
      if (!selectedDate || !selectedBarber) return;
      
      // Get UTC range for the selected date
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
        .eq('business_id', businessId)             // ✅ dynamic filter
        .gte('appointment_date', startOfDay)
        .lte('appointment_date', endOfDay)
        .or('appointment_status.is.null,appointment_status.neq.cancelled');   // ✅ include NULL + exclude cancelled

      setAppointments(data || []);
    };
    fetchAppointments();
  }, [selectedDate, selectedBarber, businessTimezone, businessId]);
  /* ----------------------------------------------- */

  const handleServiceChange = (e) => {
    const selectedId = e.target.value;
    setSelectedService(selectedId);
    const matchedService = services.find((s) => s.id === selectedId);
    if (matchedService) setDuration(matchedService.duration_min);
  };

  const handleCreate = async () => {
    if (!businessId) {
      setErrorMsg('Profilo non configurato: nessun business associato. Contatta l\'amministratore.');
      return;
    }
    if (!selectedDate || !selectedTime || !selectedService || !selectedBarber || !selectedContactId) {
      setErrorMsg('Tutti i campi sono obbligatori, inclusa la selezione di un contatto.');
      return;
    }

    // Convert local business time to UTC for storage
    const appointmentStartUTC = toUTCFromLocal({
      date: selectedDate,
      time: selectedTime,
      timezone: businessTimezone,
    });

    // For overlap checking, compare entirely in UTC
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

    const { error } = await supabase.from('appointments').insert([
      {
        contact_id:        selectedContactId,
        service_id:        selectedService,
        barber_id:         selectedBarber,
        appointment_date: appointmentStartUTC,
        business_id:       businessId, // ✅ dynamic business id on insert
      },
    ]);

    if (!error) {
      onCreated();
      onClose();
    } else {
      console.error('Errore creazione:', error.message);
      setErrorMsg('Errore durante la creazione dell\'appuntamento.');
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

  const clearSelectedContact = () => {
    setCustomerName('');
    setSelectedContactId('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto transition-all duration-300 ${
        showNewContactForm ? 'w-[1000px]' : 'w-[500px]'
      }`}>
        {/* Header ------------------------------------------------------- */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-black">
            {showNewContactForm ? 'Nuovo Appuntamento + Contatto' : 'Nuovo Appuntamento'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} className="text-black" />
          </button>
        </div>

        {/* Body --------------------------------------------------------- */}
        <div className={`p-6 ${showNewContactForm ? 'flex gap-6' : 'space-y-6'}`}>
          {/* Left Column - Appointment Form */}
          <div className={`${showNewContactForm ? 'flex-1 space-y-6' : 'space-y-6'}`}>
          {/* Nome cliente + picker */}
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Nome Cliente</label>
            <div className="relative">
              <input
                type="text"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (selectedContactId) {
                    setSelectedContactId(''); // Clear selected contact if user types manually
                  }
                }}
                readOnly={!!selectedContactId}
                className={`w-full border border-gray-200 rounded-xl px-4 py-3 pr-20 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black placeholder-gray-400 ${
                  selectedContactId ? 'bg-green-50 border-green-200' : ''
                }`}
                placeholder={selectedContactId ? "Contatto selezionato" : "Inserisci nome cliente o seleziona dalla rubrica"}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                {selectedContactId && (
                  <button
                    onClick={clearSelectedContact}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Rimuovi contatto selezionato"
                  >
                    <X size={16} />
                  </button>
                )}
                <button
                  onClick={() => setShowContactPicker(true)}
                  className="text-gray-500 hover:text-black transition-colors"
                  title="Seleziona dalla rubrica"
                >
                  <UserRoundSearch size={18} />
                </button>
                <button
                  onClick={() => setShowNewContactForm(!showNewContactForm)}
                  className={`transition-colors ${
                    showNewContactForm 
                      ? 'text-black bg-gray-100 rounded-full p-1' 
                      : 'text-gray-500 hover:text-black'
                  }`}
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
              {services.map((service) => (
                <option key={service.id} value={service.id} className="text-black">
                  {service.name}
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
              {barbers.map((barber) => (
                <option key={barber.id} value={barber.id} className="text-black">
                  {barber.name}
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
                onChange={(e) => setDuration(parseInt(e.target.value))}
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
              {Array.from({ length: 90 }, (_, i) => {
                const hour   = 6 + Math.floor(i / 6);
                const minute = (i % 6) * 10;
                const time   = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

                // Build candidate slot in UTC using business timezone
                const candidateStartUTC = toUTCFromLocal({
                  date: selectedDate,
                  time,
                  timezone: businessTimezone,
                });
                const slotStart = new Date(candidateStartUTC);
                const slotEnd   = new Date(slotStart.getTime() + duration * 60000);

                const isOccupied = appointments.some((appt) => {
                  // Compare entirely in UTC
                  const apptStart = new Date(appt.appointment_date);
                  const apptEnd   = new Date(apptStart.getTime() + (appt.services?.duration_min || 30) * 60000);
                  return slotStart < apptEnd && slotEnd > apptStart;
                });

                return (
                  <option
                    key={time}
                    value={time}
                    disabled={isOccupied}
                    className={isOccupied ? 'text-gray-400 line-through' : 'text-black'}
                  >
                    {time} {isOccupied ? '(occupato)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm font-medium">{errorMsg}</p>
            </div>
          )}
          </div>

          {/* Right Column - New Contact Form */}
          {showNewContactForm && (
            <div className="flex-1 border-l border-gray-200 pl-6">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-black mb-2">Nuovo Contatto</h3>
                <p className="text-sm text-gray-600">Crea un nuovo contatto che verrà automaticamente selezionato per questo appuntamento.</p>
              </div>
              <NewContactForm onCreated={handleNewContactCreated} />
            </div>
          )}
        </div>

        {/* Footer -------------------------------------------------------- */}
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

        {/* Picker Modal */}
        {showContactPicker && (
          <ContactPickerModal
            onSelect={handleSelectContact}
            onClose={() => setShowContactPicker(false)}
          />
        )}
      </div>
    </div>
  );
};

export default CreateAppointmentModal;