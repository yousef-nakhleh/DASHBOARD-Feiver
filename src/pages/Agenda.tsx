import { CalendarIcon, Plus, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar } from '@/components/agenda/Calendar';
import EditAppointmentModal from '@/components/agenda/EditAppointmentModal';
import CreateAppointmentModal from '@/components/agenda/CreateAppointmentModal';

const generateTimeSlots = () => {
  const slots = [];
  for (let h = 6; h <= 21; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 21 && m > 0) break;
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      const type = m === 0 ? 'hour' : m === 30 ? 'half' : 'quarter';
      slots.push({ time, type });
    }
  }
  return slots;
};

const Agenda = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<string>('Tutti');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [calendarView, setCalendarView] = useState<'day' | '3day' | 'week' | 'month'>('day');
  const timeSlots = generateTimeSlots();

  const formatDate = (date: Date) =>
    date.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const navigateDay = (dir: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    dir === 'prev'
      ? newDate.setDate(newDate.getDate() - 1)
      : newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const getRangeDates = () => {
    let days = 1;
    if (calendarView === '3day') days = 3;
    else if (calendarView === 'week') days = 7;
    else if (calendarView === 'month') days = 30;

    return Array.from({ length: days }, (_, i) => {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  };

  const fetchAppointments = async () => {
    const dates = getRangeDates();
    const { data } = await supabase
      .from('appointments')
      .select(`*, services ( name )`)
      .in('appointment_date', dates);
    setAppointments(data || []);
  };

  const fetchBarbers = async () => {
    const { data } = await supabase.from('barbers').select('*');
    setBarbers(data || []);
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate, calendarView]);

  useEffect(() => {
    fetchBarbers();
  }, []);

  const updateAppointmentTime = async (id: string, newTime: string) => {
    await supabase.from('appointments').update({ appointment_time: newTime }).eq('id', id);
    fetchAppointments();
  };

  const filtered = selectedBarber === 'Tutti'
    ? appointments.filter((app) =>
        app.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.services?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : appointments.filter(
        (app) =>
          (app.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.services?.name?.toLowerCase().includes(searchQuery.toLowerCase())) &&
          app.barber_id === selectedBarber
      );

  return (
    <div className="h-full relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Agenda</h1>
          <p className="text-gray-600">Gestisci gli appuntamenti del salone</p>

          {/* Calendar View Switcher */}
          <div className="flex space-x-2 mt-2">
            {['day', '3day', 'week', 'month'].map((view) => (
              <button
                key={view}
                onClick={() => setCalendarView(view as any)}
                className={`px-3 py-1 text-sm rounded-full ${
                  calendarView === view
                    ? 'bg-[#5D4037] text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {view === 'day'
                  ? 'Giorno'
                  : view === '3day'
                  ? '3 Giorni'
                  : view === 'week'
                  ? 'Settimana'
                  : 'Mese'}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#5D4037] text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Plus size={18} className="mr-1" /> Nuovo Appuntamento
        </button>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
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
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca cliente o servizio"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Barber Filter */}
        <div className="flex space-x-2 overflow-x-auto p-4 border-b border-gray-200">
          <button
            onClick={() => setSelectedBarber('Tutti')}
            className={`px-4 py-2 rounded-full text-sm border ${
              selectedBarber === 'Tutti'
                ? 'bg-[#5D4037] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Tutti
          </button>
          {barbers.map((barber) => (
            <button
              key={barber.id}
              onClick={() => setSelectedBarber(barber.id)}
              className={`px-4 py-2 rounded-full text-sm border ${
                selectedBarber === barber.id
                  ? 'bg-[#5D4037] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {barber.name}
            </button>
          ))}
        </div>

        <Calendar
          timeSlots={timeSlots}
          appointments={filtered}
          barbers={barbers || []}
          selectedBarber={selectedBarber}
          selectedDate={selectedDate}
          view={calendarView}
          onDrop={updateAppointmentTime}
          onClickAppointment={(app) => setSelectedAppointment(app)}
        />
      </div>

      {selectedAppointment && (
        <EditAppointmentModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onUpdated={fetchAppointments}
        />
      )}

      {showCreateModal && (
        <CreateAppointmentModal
          selectedDate={selectedDate}
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchAppointments}
        />
      )}
    </div>
  );
};

export default Agenda;