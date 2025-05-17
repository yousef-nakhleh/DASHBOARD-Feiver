// src/pages/Agenda.tsx
import React, { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Calendar from '../components/Calendar';

const Agenda: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('Tutti');

  const staffOptions = ['Tutti', 'Staff 1', 'Staff 2'];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    direction === 'prev'
      ? newDate.setDate(newDate.getDate() - 1)
      : newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const fetchAppointments = async () => {
    const formattedDate = selectedDate.toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('appointment_date', formattedDate);

    if (!error && data) setAppointments(data);
    else console.error('Errore nel fetch:', error);
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  const updateAppointmentTime = async (id: string, newTime: string) => {
    await supabase.from('appointments').update({ appointment_time: newTime }).eq('id', id);
    fetchAppointments();
  };

  const updateAppointmentDuration = async (id: string, newDuration: number) => {
    await supabase.from('appointments').update({ duration_min: newDuration }).eq('id', id);
    fetchAppointments();
  };

  const filteredAppointments = appointments.filter(
    (app) =>
      app.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.service_id?.toLowerCase?.()?.includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Agenda</h1>
          <p className="text-gray-600">Gestisci gli appuntamenti del salone</p>
          <div className="flex mt-3 gap-2">
            {staffOptions.map((staff) => (
              <button
                key={staff}
                onClick={() => setSelectedStaff(staff)}
                className={`px-4 py-1 rounded-lg text-sm border ${
                  selectedStaff === staff
                    ? 'bg-[#5D4037] text-white border-[#5D4037]'
                    : 'bg-white text-gray-600 border-gray-300'
                } hover:shadow transition`}
              >
                {staff}
              </button>
            ))}
          </div>
        </div>

        <button className="bg-[#5D4037] text-white px-4 py-2 rounded-lg flex items-center hover:bg-[#4E342E] transition-colors">
          <Plus size={18} className="mr-1" />
          Nuovo Appuntamento
        </button>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <button onClick={() => navigateDay('prev')} className="p-2 rounded-full hover:bg-gray-100">
                <ChevronLeft size={20} />
              </button>
              <div className="mx-4 flex items-center">
                <CalendarIcon size={20} className="text-gray-500 mr-2" />
                <span className="font-medium capitalize">{formatDate(selectedDate)}</span>
              </div>
              <button onClick={() => navigateDay('next')} className="p-2 rounded-full hover:bg-gray-100">
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca cliente o servizio"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D4037]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Calendar
          appointments={filteredAppointments}
          onDrop={updateAppointmentTime}
          onResize={updateAppointmentDuration}
        />
      </div>
    </div>
  );
};

export default Agenda;