// src/pages/Agenda.tsx
import React, { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  User,
  Search
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';

const generateTimeSlots = () => {
  const slots = [];
  for (let h = 6; h <= 21; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 21 && m > 0) break;
      const time = `${h.toString().padStart(2, '0')}:${m
        .toString()
        .padStart(2, '0')}`;
      const type = m === 0 ? 'hour' : m === 30 ? 'half' : 'quarter';
      slots.push({ time, type });
    }
  }
  return slots;
};

const timeSlots = generateTimeSlots();

const DraggableAppointment = ({ app, onDrop, onResize }) => {
  const [, drag] = useDrag({
    type: 'APPOINTMENT',
    item: { ...app },
  });

  const handleResizeStop = (e, { size }) => {
    const newDuration = Math.round(size.height / 2.5) * 15; // Convert height back to minutes
    if (newDuration !== app.duration_min) {
      onResize(app.id, newDuration);
    }
  };

  return (
    <Resizable
      height={(app.duration_min / 15) * 2.5 * 1}
      width={0}
      axis="y"
      minConstraints={[0, 2.5]}
      onResizeStop={handleResizeStop}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <div
        ref={drag}
        className="absolute top-1 left-1 right-1 bg-blue-100 border-l-4 border-blue-500 p-2 rounded-sm text-sm shadow-sm"
        style={{ height: `${(app.duration_min / 15) * 2.5}rem`, zIndex: 10 }}
      >
        <div className="flex justify-between">
          <span className="font-medium text-sm">
            {app.appointment_time?.slice(0, 5)}
          </span>
          <span className="text-xs text-gray-600">{app.duration_min} min</span>
        </div>
        <div className="flex items-center mt-1">
          <User size={14} className="text-gray-500 mr-1" />
          <span>{app.customer_name}</span>
        </div>
        <div className="mt-1 text-xs text-gray-600 truncate">{app.service_id}</div>
      </div>
    </Resizable>
  );
};

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
      year: 'numeric'
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

    if (!error && data) {
      setAppointments(data);
    } else {
      console.error('Errore nel fetch:', error);
    }
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
    <DndProvider backend={HTML5Backend}>
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
                <button
                  onClick={() => navigateDay('prev')}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="mx-4 flex items-center">
                  <CalendarIcon size={20} className="text-gray-500 mr-2" />
                  <span className="font-medium capitalize">
                    {formatDate(selectedDate)}
                  </span>
                </div>
                <button
                  onClick={() => navigateDay('next')}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
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

          <div className="grid grid-cols-[80px_1fr] max-h-[700px] overflow-y-auto">
            <div className="bg-white border-r">
              {timeSlots.map((slot, i) => (
                <div
                  key={i}
                  className={`h-10 px-2 flex items-center justify-end text-xs ${
                    slot.type === 'hour'
                      ? 'font-bold text-gray-800'
                      : slot.type === 'half'
                      ? 'text-gray-500'
                      : 'text-gray-300'
                  }`}
                >
                  {slot.time}
                </div>
              ))}
            </div>

            <div className="relative">
              {timeSlots.map((slot, i) => {
                const apps = filteredAppointments.filter(
                  (app) => app.appointment_time?.slice(0, 5) === slot.time
                );

                const [, drop] = useDrop({
                  accept: 'APPOINTMENT',
                  drop: (draggedItem: any) => {
                    if (draggedItem.appointment_time.slice(0, 5) !== slot.time) {
                      updateAppointmentTime(draggedItem.id, `${slot.time}:00`);
                    }
                  }
                });

                return (
                  <div ref={drop} key={i} className="h-10 border-t relative">
                    {apps.map((app) => (
                      <DraggableAppointment
                        key={app.id}
                        app={app}
                        onDrop={updateAppointmentTime}
                        onResize={updateAppointmentDuration}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default Agenda;
