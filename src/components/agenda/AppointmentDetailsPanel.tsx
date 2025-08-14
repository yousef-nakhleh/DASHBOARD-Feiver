import React, { useEffect, useState, useMemo } from 'react';
import { X, Info, User, Clock, DollarSign, Calendar, Scissors, Phone, Mail, Edit, Trash2, Check, CreditCard } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toUTCFromLocal, toLocalFromUTC } from '../../lib/timeUtils';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AppointmentDetailsPanelProps {
  appointment?: any;
  initialBarberId?: string;
  initialDate?: string;
  initialTime?: string;
  businessTimezone: string;
  onClose: () => void;
  onUpdated: () => void;
}

const TIMES: string[] = (() => {
  const t: string[] = [];
  for (let h = 6; h <= 21; h++) {
    for (let m = 0; m < 60; m += 5) {
      if (h === 21 && m > 0) break;
      t.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
  }
  return t;
})();

const DURATION_OPTIONS = [15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 75, 90, 105, 120];

const AppointmentDetailsPanel: React.FC<AppointmentDetailsPanelProps> = ({
  appointment,
  initialBarberId = '',
  initialDate = '',
  initialTime = '',
  businessTimezone,
  onClose,
  onUpdated,
}) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const businessId = profile?.business_id;
  const isEditing = !!appointment;

  // Main view state
  const [currentView, setCurrentView] = useState<'appointment' | 'contact'>('appointment');
  
  // Form state
  const [selectedContactId, setSelectedContactId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [services, setServices] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [selectedBarber, setSelectedBarber] = useState(initialBarberId);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedTime, setSelectedTime] = useState(initialTime);
  const [duration, setDuration] = useState(30);
  const [busyTimes, setBusyTimes] = useState<Set<string>>(new Set());
  const [availableDurations, setAvailableDurations] = useState<number[]>([]);
  
  // Contact management state
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [showNewContactForm, setShowNewContactForm] = useState(false);
  const [selectedContactDetails, setSelectedContactDetails] = useState<any>(null);
  
  // New contact form state
  const [newContactFirstName, setNewContactFirstName] = useState('');
  const [newContactLastName, setNewContactLastName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactBirthdate, setNewContactBirthdate] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form with appointment data
  useEffect(() => {
    if (appointment) {
      const localTime = toLocalFromUTC({
        utcString: appointment.appointment_date,
        timezone: businessTimezone,
      });
      
      setSelectedContactId(appointment.contact?.id || '');
      setCustomerName(appointment.contact ? 
        `${appointment.contact.first_name || ''} ${appointment.contact.last_name || ''}`.trim() : '');
      setSelectedService(appointment.service_id || '');
      setSelectedBarber(appointment.barber_id || '');
      setSelectedDate(localTime.toFormat('yyyy-MM-dd'));
      setSelectedTime(localTime.toFormat('HH:mm'));
      setDuration(appointment.services?.duration_min || 30);
    }
  }, [appointment, businessTimezone]);

  // Fetch initial data
  useEffect(() => {
    if (!businessId) return;
    
    const fetchData = async () => {
      // Fetch services
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', businessId);
      setServices(servicesData || []);

      // Fetch barbers
      const { data: barbersData } = await supabase
        .from('barbers')
        .select('*')
        .eq('business_id', businessId);
      setBarbers(barbersData || []);

      // Fetch contacts
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('*')
        .eq('business_id', businessId)
        .order('first_name', { ascending: true });
      setContacts(contactsData || []);
    };

    fetchData();
  }, [businessId]);

  // Calculate busy times and available durations
  useEffect(() => {
    if (!businessId || !selectedDate || !selectedBarber) return;

    const fetchBusyTimes = async () => {
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
        .select('appointment_date, services(duration_min), id')
        .eq('barber_id', selectedBarber)
        .eq('business_id', businessId)
        .gte('appointment_date', startOfDay)
        .lte('appointment_date', endOfDay)
        .in('appointment_status', ['pending', 'confirmed']);

      const blocked = new Set<string>();
      const appointments = (data || []).filter(a => a.id !== appointment?.id);

      // Calculate available durations for current time slot
      const availableDurs: number[] = [];
      
      for (const dur of DURATION_OPTIONS) {
        if (!selectedTime) continue;
        
        const candidateStart = new Date(`2000-01-01T${selectedTime}:00`);
        const candidateEnd = new Date(candidateStart.getTime() + dur * 60000);
        
        let hasOverlap = false;
        for (const appt of appointments) {
          const localAppt = toLocalFromUTC({
            utcString: appt.appointment_date,
            timezone: businessTimezone,
          });
          const apptStart = new Date(`2000-01-01T${localAppt.toFormat('HH:mm')}:00`);
          const apptEnd = new Date(apptStart.getTime() + (appt.services?.duration_min || 30) * 60000);
          
          if (candidateStart < apptEnd && candidateEnd > apptStart) {
            hasOverlap = true;
            break;
          }
        }
        
        if (!hasOverlap) {
          availableDurs.push(dur);
        }
      }
      
      setAvailableDurations(availableDurs);

      // Calculate blocked time slots
      appointments.forEach((a) => {
        const localAppt = toLocalFromUTC({
          utcString: a.appointment_date,
          timezone: businessTimezone,
        });
        const start = new Date(`2000-01-01T${localAppt.toFormat('HH:mm')}:00`);
        const end = new Date(start.getTime() + (a.services?.duration_min || 30) * 60000);

        for (let t of TIMES) {
          const ts = new Date(`2000-01-01T${t}:00`);
          const te = new Date(ts.getTime() + duration * 60000);
          if (ts < end && te > start) blocked.add(t);
        }
      });
      
      setBusyTimes(blocked);
    };

    fetchBusyTimes();
  }, [businessId, selectedDate, selectedBarber, duration, selectedTime, appointment?.id, businessTimezone]);

  const handleServiceChange = (serviceId: string) => {
    setSelectedService(serviceId);
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setDuration(service.duration_min);
    }
  };

  const handleContactSelect = (contact: any) => {
    setSelectedContactId(contact.id);
    setCustomerName(`${contact.first_name || ''} ${contact.last_name || ''}`.trim());
    setSelectedContactDetails(contact);
  };

  const handleNewContactSave = async () => {
    if (!businessId || !newContactFirstName.trim()) {
      setError('Nome è obbligatorio');
      return;
    }

    const { data, error: contactError } = await supabase
      .from('contacts')
      .insert({
        business_id: businessId,
        first_name: newContactFirstName.trim(),
        last_name: newContactLastName.trim() || null,
        phone_number_raw: newContactPhone.trim() || null,
        phone_prefix: '+39',
        email: newContactEmail.trim() || null,
        birthdate: newContactBirthdate || null,
      })
      .select()
      .single();

    if (contactError) {
      setError('Errore durante la creazione del contatto');
      return;
    }

    // Add to contacts list and select
    const newContact = {
      ...data,
      full_name: `${data.first_name} ${data.last_name || ''}`.trim()
    };
    setContacts(prev => [newContact, ...prev]);
    handleContactSelect(newContact);
    setShowNewContactForm(false);
    
    // Reset form
    setNewContactFirstName('');
    setNewContactLastName('');
    setNewContactPhone('');
    setNewContactEmail('');
    setNewContactBirthdate('');
  };

  const handleSave = async () => {
    if (!businessId || !selectedDate || !selectedTime || !selectedService || !selectedBarber || !selectedContactId) {
      setError('Tutti i campi sono obbligatori');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const appointmentStartUTC = toUTCFromLocal({
        date: selectedDate,
        time: selectedTime,
        timezone: businessTimezone,
      });

      if (isEditing) {
        // Update existing appointment
        const { error } = await supabase
          .from('appointments')
          .update({
            contact_id: selectedContactId,
            service_id: selectedService,
            barber_id: selectedBarber,
            appointment_date: appointmentStartUTC,
          })
          .eq('id', appointment.id);

        if (error) throw error;
      } else {
        // Create new appointment
        const { error } = await supabase
          .from('appointments')
          .insert([{
            contact_id: selectedContactId,
            service_id: selectedService,
            barber_id: selectedBarber,
            appointment_date: appointmentStartUTC,
            business_id: businessId,
          }]);

        if (error) throw error;
      }

      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!appointment || !window.confirm('Sei sicuro di voler eliminare questo appuntamento?')) return;

    const { error } = await supabase
      .from('appointments')
      .update({ appointment_status: 'cancelled' })
      .eq('id', appointment.id);

    if (!error) {
      onUpdated();
      onClose();
    }
  };

  const handleGoToCash = () => {
    if (!appointment) return;
    
    navigate('/cassa', {
      state: {
        selectedAppointmentId: appointment.id,
        prefillPayment: {
          appointment_id: appointment.id,
          barber_id: appointment.barber_id,
          service_id: appointment.service_id,
          price: appointment.services?.price || 0,
          customer_name: customerName,
        }
      }
    });
  };

  const filteredContacts = contacts.filter(contact =>
    contactSearch.trim() === '' ||
    `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase().includes(contactSearch.toLowerCase()) ||
    contact.email?.toLowerCase().includes(contactSearch.toLowerCase()) ||
    contact.phone_number_e164?.includes(contactSearch)
  );

  const selectedServiceData = services.find(s => s.id === selectedService);
  const selectedBarberData = barbers.find(b => b.id === selectedBarber);

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-black">
          {isEditing ? 'Modifica Appuntamento' : 'Nuovo Appuntamento'}
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {currentView === 'appointment' ? (
          <div className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Customer Name with Info Button */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black">Cliente</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 p-3 border border-gray-200 rounded-xl bg-gray-50">
                  <User size={16} className="text-gray-400" />
                  <span className="text-black font-medium">
                    {customerName || 'Seleziona cliente'}
                  </span>
                </div>
                {selectedContactId && (
                  <button
                    onClick={() => setCurrentView('contact')}
                    className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <Info size={16} className="text-gray-600" />
                  </button>
                )}
              </div>
              
              {!selectedContactId && (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Cerca contatto..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  
                  {contactSearch && (
                    <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-xl">
                      {filteredContacts.map(contact => (
                        <button
                          key={contact.id}
                          onClick={() => handleContactSelect(contact)}
                          className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <p className="font-medium text-black">
                            {`${contact.first_name || ''} ${contact.last_name || ''}`.trim()}
                          </p>
                          <p className="text-sm text-gray-500">{contact.email || contact.phone_number_e164}</p>
                        </button>
                      ))}
                      <button
                        onClick={() => setShowNewContactForm(true)}
                        className="w-full text-left p-3 hover:bg-gray-50 text-blue-600 font-medium"
                      >
                        + Crea nuovo contatto
                      </button>
                    </div>
                  )}
                  
                  {showNewContactForm && (
                    <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                      <h4 className="font-semibold text-black">Nuovo Contatto</h4>
                      <input
                        type="text"
                        placeholder="Nome"
                        value={newContactFirstName}
                        onChange={(e) => setNewContactFirstName(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                      />
                      <input
                        type="text"
                        placeholder="Cognome"
                        value={newContactLastName}
                        onChange={(e) => setNewContactLastName(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                      />
                      <input
                        type="tel"
                        placeholder="Telefono"
                        value={newContactPhone}
                        onChange={(e) => setNewContactPhone(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={newContactEmail}
                        onChange={(e) => setNewContactEmail(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                      />
                      <input
                        type="date"
                        placeholder="Data di nascita"
                        value={newContactBirthdate}
                        onChange={(e) => setNewContactBirthdate(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleNewContactSave}
                          className="flex-1 bg-black text-white py-2 rounded-lg hover:bg-gray-800"
                        >
                          Salva
                        </button>
                        <button
                          onClick={() => setShowNewContactForm(false)}
                          className="flex-1 border border-gray-200 py-2 rounded-lg hover:bg-gray-50"
                        >
                          Annulla
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Service and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-black mb-2">Servizio</label>
                <select
                  value={selectedService}
                  onChange={(e) => handleServiceChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black bg-white"
                >
                  <option value="">Seleziona servizio</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">Durata</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black bg-white"
                >
                  {DURATION_OPTIONS.map(dur => (
                    <option 
                      key={dur} 
                      value={dur}
                      disabled={!availableDurations.includes(dur)}
                      className={!availableDurations.includes(dur) ? 'text-gray-400' : ''}
                    >
                      {dur} min {!availableDurations.includes(dur) ? '(non disponibile)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Barber */}
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Con {selectedBarberData?.name || 'Barbiere'}
              </label>
              <select
                value={selectedBarber}
                onChange={(e) => setSelectedBarber(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black bg-white"
              >
                <option value="">Seleziona barbiere</option>
                {barbers.map(barber => (
                  <option key={barber.id} value={barber.id}>
                    {barber.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-black mb-2">Data</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">Orario</label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black bg-white"
                >
                  <option value="">Seleziona orario</option>
                  {TIMES.map(time => (
                    <option 
                      key={time} 
                      value={time}
                      disabled={busyTimes.has(time)}
                      className={busyTimes.has(time) ? 'text-gray-400' : ''}
                    >
                      {time} {busyTimes.has(time) ? '(occupato)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price */}
            {selectedServiceData && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                <DollarSign size={16} className="text-gray-400" />
                <span className="text-black font-semibold">
                  Prezzo: €{selectedServiceData.price}
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Contact Details View */
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-black">Dettagli Contatto</h3>
              <button
                onClick={() => setCurrentView('appointment')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                ← Torna all'appuntamento
              </button>
            </div>

            {selectedContactDetails && (
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="h-16 w-16 rounded-full bg-black text-white flex items-center justify-center text-xl font-bold">
                    {selectedContactDetails.first_name?.[0]}{selectedContactDetails.last_name?.[0]}
                  </div>
                  <div className="ml-4">
                    <h4 className="text-xl font-bold text-black">
                      {`${selectedContactDetails.first_name || ''} ${selectedContactDetails.last_name || ''}`.trim()}
                    </h4>
                    <p className="text-gray-600">Cliente</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedContactDetails.phone_number_e164 && (
                    <div className="flex items-center">
                      <Phone size={16} className="text-gray-400 mr-3" />
                      <span className="text-black">{selectedContactDetails.phone_number_e164}</span>
                    </div>
                  )}
                  {selectedContactDetails.email && (
                    <div className="flex items-center">
                      <Mail size={16} className="text-gray-400 mr-3" />
                      <span className="text-black">{selectedContactDetails.email}</span>
                    </div>
                  )}
                  {selectedContactDetails.birthdate && (
                    <div className="flex items-center">
                      <Calendar size={16} className="text-gray-400 mr-3" />
                      <span className="text-black">
                        {new Date(selectedContactDetails.birthdate).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <button className="flex-1 flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-xl hover:bg-gray-50">
                    <Edit size={16} />
                    Modifica
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 p-3 border border-red-200 text-red-600 rounded-xl hover:bg-red-50">
                    <Trash2 size={16} />
                    Elimina
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {currentView === 'appointment' && (
        <div className="p-6 border-t border-gray-200 space-y-3">
          <button
            onClick={handleSave}
            disabled={loading || !selectedContactId || !selectedService || !selectedBarber}
            className="w-full bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Check size={16} />
            {loading ? 'Salvataggio...' : (isEditing ? 'Aggiorna Appuntamento' : 'Crea Appuntamento')}
          </button>

          {isEditing && (
            <>
              <button
                onClick={handleGoToCash}
                className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <CreditCard size={16} />
                Vai alla Cassa
              </button>

              <button
                onClick={handleDelete}
                className="w-full bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Elimina Appuntamento
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AppointmentDetailsPanel;