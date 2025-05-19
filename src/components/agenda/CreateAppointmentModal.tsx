import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

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
  const [selectedTime, setSelectedTime] = useState('07:00');
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    const fetchData = async () => {
      const { data: servicesData } = await supabase.from('services').select('*');
      const { data: barbersData } = await supabase.from('barbers').select('*');
      setServices(servicesData || []);
      setBarbers(barbersData || []);
    };

    fetchData();
  }, []);

  const handleServiceChange = (e) => {
    const selectedId = e.target.value;
    setSelectedService(selectedId);
    const matchedService = services.find((s) => s.id === selectedId);
    if (matchedService) {
      setDuration(matchedService.duration_min);
    }
  };

  const handleCreate = async () => {
    if (!selectedDate || !selectedTime) return;

    const isoDate = new Date(selectedDate).toISOString().split('T')[0];

    const { error } = await supabase.from('appointments').insert([
      {
        customer_name: customerName,
        service_id: selectedService,
        barber_id: selectedBarber,
        appointment_date: isoDate,
        appointment_time: selectedTime,
        duration_min: duration,
      },
    ]);

    if (!error) {
      onCreated();
      onClose();
    } else {
      console.error('Error creating appointment:', error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
        <h2 className="text-lg font-semibold mb-4">Nuovo Appuntamento</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome Cliente</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded px-3 py-2"
            />
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
              {Array.from({ length: 61 }, (_, i) => {
                const hour = 6 + Math.floor(i / 4);
                const minute = (i % 4) * 15;
                const time = `${hour.toString().padStart(2, '0')}:${minute
                  .toString()
                  .padStart(2, '0')}`;
                return (
                  <option key={time} value={time}>
                    {time}
                  </option>
                );
              })}
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
      </div>
    </div>
  );
};

export default CreateAppointmentModal;