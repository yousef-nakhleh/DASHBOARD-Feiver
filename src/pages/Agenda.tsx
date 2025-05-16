import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  User,
  Search
} from 'lucide-react';

const appointments = [
  { id: 1, time: '09:00', client: 'Riccardo Bianchi', service: 'Taglio capelli', duration: 30 },
  { id: 2, time: '09:30', client: 'Giovanni Rossi', service: 'Taglio e barba', duration: 45 },
  { id: 3, time: '10:30', client: 'Alberto Neri', service: 'Shampoo e taglio', duration: 40 },
  { id: 4, time: '11:00', client: 'Luca Bianchi', service: 'Taglio classico', duration: 30 },
  { id: 5, time: '12:00', client: 'Marco Verdi', service: 'Tinta capelli', duration: 60 },
  { id: 6, time: '14:00', client: 'Simone Gialli', service: 'Rasatura', duration: 20 },
  { id: 7, time: '14:30', client: 'Andrea Verdi', service: 'Rasatura completa', duration: 25 },
  { id: 8, time: '15:00', client: 'Fabio Rossi', service: 'Taglio e piega', duration: 45 },
];

// Generate 15-minute slots from 06:00 to 21:00
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

const timeSlots = generateTimeSlots();

const Agenda: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
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

  const filteredAppointments = appointments.filter(
    (app) =>
      app.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.service.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAppointmentsForTime = (time: string) => {
    return filteredAppointments.filter((app) => app.time === time);
  };

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Agenda</h1>
          <p className="text-gray-600">Gestisci gli appuntamenti del salone</p>

          {/* Staff Selector */}
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
          {/* Time Column */}
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

          {/* Appointments */}
          <div className="relative">
            {timeSlots.map((slot, i) => {
              const apps = getAppointmentsForTime(slot.time);
              return (
                <div key={i} className="h-10 border-t relative">
                  {apps.map((app) => (
                    <div
                      key={app.id}
                      className="absolute top-1 left-1 right-1 bg-blue-100 border-l-4 border-blue-500 p-2 rounded-sm text-sm shadow-sm"
                      style={{
                        height: `${(app.duration / 15) * 2.5}rem`,
                        zIndex: 10
                      }}
                    >
                      <div className="flex justify-between">
                        <span className="font-medium text-sm">{app.time}</span>
                        <span className="text-xs text-gray-600">
                          {app.duration} min
                        </span>
                      </div>
                      <div className="flex items-center mt-1">
                        <User size={14} className="text-gray-500 mr-1" />
                        <span>{app.client}</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-600 truncate">
                        {app.service}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Agenda;