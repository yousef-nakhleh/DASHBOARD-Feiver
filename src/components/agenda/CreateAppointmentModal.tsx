import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import ContactPickerModal from './ContactPickerModal';
import { UserRoundSearch } from 'lucide-react';

const CreateAppointmentModal = ({ onClose, onCreated }) => {
  const [customerName, setCustomerName] = useState('');
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [selectedBarber, setSelectedBarber] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [appointments, setAppointments] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: servicesData } = await supabase.from('services').select('*');
      const { data: barbersData } = await supabase.from('barbers').select('*');
      setServices(servicesData || []);
      setBarbers(barbersData || []);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchAppointmentsAndSlots = async () => {
      if (!selectedDate || !selectedBarber) return;

      const { data: appts } = await supabase
        .from('appointments')
        .select('appointment_time, duration_min')
        .eq('barber_id', selectedBarber)
        .eq('appointment_date', selectedDate);

      setAppointments(appts || []);

      // Generate 10-minute slots
      const slots = [];
      for (let h = 6; h <= 21; h++) {
        for (let m = 0; m < 60; m += 10) {
          if (h === 21 && m > 0) break;
          slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        }
      }

      const now = new Date();
      const isToday = selectedDate === now.toISOString().split('T')[0];
      const isoDate = new Date(selectedDate).toISOString().split('T')[0];

      const available = [];

      for (const time of slots) {
        const [h, m] = time.split(':').map(Number);
        const slotStart = new Date(`${isoDate}T${time}:00`);
        slotStart.setHours(slotStart.getHours() + 2); // ✅ Adjust to Italy time

        if (isToday && slotStart <= now) continue;

        const slotEnd = new Date(slotStart.getTime() + duration * 60000);

        const isOccupied = appts.some((appt) => {
          const apptStart = new Date(`${isoDate}T${appt.appointment_time}`);
          const apptEnd = new Date(apptStart.getTime() + appt.duration_min * 60000);
          return slotStart < apptEnd && slotEnd > apptStart;
        });

        if (!isOccupied) {
          available.push(time);
        }
      }

      setAvailableSlots(available);
      if (available.length > 0) {
        setSelectedTime(available[0]); // ✅ default to first free
      } else {
        setSelectedTime('');
      }
    };

    fetchAppointmentsAndSlots();
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
        business_id: '268e0ae9-c539-471c-b4c2-1663cf598436', // ✅ your business_id
      },
    ]);

    if (!error) {
      onCreated();
      onClose();
    } else {
      console.error('Error creating appointment:', error.message);
    }
  };

  const handleSelectContact = (contact) => {
    setCustomerName(contact.customer_name);
    setShowContactPicker(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
        <h2 className="text-lg font-semibold mb-4">Nuovo Appuntamento</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome Cliente</label>
            <div className="relative">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full mt-1 border border-gray-300 rounded px-3 py-2 pr-10"
              />
              <button
                onClick={() => setShowContactPicker(true)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <UserRoundSearch size={18} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Servizio</label>
            <select
              value={selectedService}
              onChange={handleServiceChange}
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
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
            <label className="block text-sm font-medium text-gray-700">Barbiere</label>
            <select
              value={selectedBarber}
              onChange={(e) => setSelectedBarber(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Seleziona barbiere</option>
              {barbers.map((barber) => (
                <option key={barber.id} value={barber.id}>
                  {barber.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Data</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Orario</label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
            >
              {availableSlots.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Durata (minuti)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
            />
          </div>

          {errorMsg && <div className="text-red-600 text-sm font-medium">{errorMsg}</div>}
        </div>

        <div className="flex justify-end mt-6 space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
          >
            Annulla
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Crea
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