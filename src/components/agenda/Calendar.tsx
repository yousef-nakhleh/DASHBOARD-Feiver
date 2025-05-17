// src/components/agenda/Calendar.tsx
import React from 'react';
import { useDrop } from 'react-dnd';
import { User } from 'lucide-react';
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

const DraggableAppointment = ({ app, onDrop }) => {
  return (
    <div
      className="absolute top-1 left-1 right-1 bg-blue-100 border-l-4 border-blue-500 p-2 rounded-sm text-sm shadow-sm flex flex-col justify-between cursor-move"
      style={{
        height: `${(app.duration_min / 15) * 40}px`,
        zIndex: 10,
      }}
    >
      <div>
        <div className="flex justify-between">
          <span className="font-medium text-sm">{app.appointment_time?.slice(0, 5)}</span>
          <span className="text-xs text-gray-600">{app.duration_min} min</span>
        </div>
        <div className="flex items-center mt-1">
          <User size={14} className="text-gray-500 mr-1" />
          <span>{app.customer_name}</span>
        </div>
        <div className="mt-1 text-xs text-gray-600 truncate">{app.service_id}</div>
      </div>
    </div>
  );
};

interface CalendarProps {
  appointments: any[];
  updateAppointmentTime: (id: string, newTime: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({ appointments, updateAppointmentTime }) => {
  return (
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
          const apps = appointments.filter(
            (app) => app.appointment_time?.slice(0, 5) === slot.time
          );

          const [, drop] = useDrop({
            accept: 'APPOINTMENT',
            drop: (draggedItem: any) => {
              if (draggedItem.appointment_time.slice(0, 5) !== slot.time) {
                updateAppointmentTime(draggedItem.id, `${slot.time}:00`);
              }
            },
          });

          return (
            <div ref={drop} key={i} className="h-10 border-t relative">
              {apps.map((app) => (
                <DraggableAppointment
                  key={app.id}
                  app={app}
                  onDrop={updateAppointmentTime}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
