import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import ContactPickerModal from './ContactPickerModal';
import { UserRoundSearch, X } from 'lucide-react';

const BUSINESS_ID = '268e0ae9-c539-471c-b4c2-1663cf598436';

const CreateAppointmentModal = ({
  onClose,
  onCreated,
  initialBarberId = '',
  initialDate = '',
  initialTime = '',
}) => {
  const [customerName, setCustomerName] = useState('');
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [selectedBarber, setSelectedBarber] = useState(initialBarberId);
  const [selectedDate, setSelectedDate] = useState(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [selectedTime, setSelectedTime] = useState(initialTime || '07:00');
  const [duration, setDuration] = useState(30);
  const [appointments, setAppointments] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [showContactPicker, setShowContactPicker] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', BUSINESS_ID);
      const { data: barbersData } = await supabase
        .from('barbers')
        .select('*')
        .eq('business_id', BUSINESS_ID);

      setServices(servicesData || []);
      setBarbers(barbersData || []);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!selectedDate || !selectedBarber) return;
      const { data } = await supabase
        .from('appointments')
        .select('appointment_time, duration_min')
        .eq('barber_id', selectedBarber)
        .eq('appointment_date', selectedDate)
        .eq('business_id', BUSINESS_ID);
      setAppointments(data || []);
    };
    fetchAppointments();
  }, [selectedDate, selectedBarber, duration]);

  const handleServiceChange = (e) => {
    const selectedId = e.target.value;
    setSelectedService(selectedId);
    const matchedService = services.find((s) => s.id === selectedId);
    if (matchedService) {
      setDuration(matchedService.duration_min);
    }
  };

  const handleCreate = async () => {
    if (!selectedDate || !selectedTime || !selectedService || !selectedBarber) return;

    const isoDate = new Date(selectedDate).toISOString().split('T')[0];
    const start = new Date(`${isoDate}T${selectedTime}:00`);
    const end = new Date(start.getTime() + duration * 60000);

    const overlap = appointments.some((appt) => {
      const apptStart = new Date(`${isoDate}T${appt.appointment_time}`);
      const apptEnd = new Date(apptStart.getTime() + appt.duration_min * 60000);
      return start < apptEnd && end > apptStart;
    });

    if (overlap) {
      setErrorMsg('Questo orario è già occupato.');
      return;
    }

    const { error } = await supabase.from('appointments').insert([
      {
        customer_name: customerName,
        service_id: selectedService,
        barber_id: selectedBarber,
        appointment_date: isoDate,
        appointment_time: selectedTime,
        duration_min: duration,
        business_id: BUSINESS_ID,
      },
    ]);

    if (!error) {
      onCreated();
      onClose();
    } else {
      console.error('Errore creazione:', error.message);
    }
  };

  const handleSelectContact = (contact) => {
    setCustomerName(contact.customer_name);
    setShowContactPicker(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[500px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-black">Nuovo Appuntamento</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Nome Cliente</label>
            <div className="relative">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Inserisci nome cliente"
              />
              <button
                onClick={() => setShowContactPicker(true)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black transition-colors"
              >
                <UserRoundSearch size={20} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">Servizio</label>
            <select
              value={selectedService}
              onChange={handleServiceChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="">Seleziona servizio</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">Barbiere</label>
            <select
              value={selectedBarber}
              onChange={(e) => setSelectedBarber(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="">Seleziona barbiere</option>
              {barbers.map((barber) => (
                <option key={barber.id} value={barber.id}>
                  {barber.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-black mb-2">Data</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-2">Durata (minuti)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">Orario</label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              {Array.from({ length: 90 }, (_, i) => {
                const hour = 6 + Math.floor(i / 6);
                const minute = (i % 6) * 10;
                const time = `${hour.toString().padStart(2, '0')}:${minute
                  .toString()
                  .padStart(2, '0')}`;
                const slotStart = new Date(`${selectedDate}T${time}:00`);
                const slotEnd = new Date(slotStart.getTime() + duration * 60000);

                const isOccupied = appointments.some((appt) => {
                  const apptStart = new Date(`${selectedDate}T${appt.appointment_time}`);
                  const apptEnd = new Date(apptStart.getTime() + appt.duration_min * 60000);
                  return slotStart < apptEnd && slotEnd > apptStart;
                });

                return (
                  <option
                    key={time}
                    value={time}
                    disabled={isOccupied}
                    className={isOccupied ? 'line-through text-gray-400' : ''}
                  >
                    {time} {isOccupied ? '(occupato)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm font-medium">{errorMsg}</p>
            </div>
          )}
        </div>

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