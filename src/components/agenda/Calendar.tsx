import React from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { User } from 'lucide-react';

const slotHeight = 40;

export const Calendar = ({ timeSlots, appointments, onDrop }) => {
  return (
    <div className="grid grid-cols-[80px_1fr] max-h-[700px] overflow-y-auto relative">
      {/* Time Labels */}
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

      {/* Appointment Canvas */}
      <div className="relative bg-white border-l">
        {/* Drop zones */}
        {timeSlots.map((slot, i) => {
          const [, drop] = useDrop({
            accept: 'APPOINTMENT',
            drop: (draggedItem: any) => {
              if (draggedItem.appointment_time.slice(0, 5) !== slot.time) {
                onDrop(draggedItem.id, `${slot.time}:00`);
              }
            },
          });

          return (
            <div
              ref={drop}
              key={i}
              className="h-10 border-t border-gray-200"
            />
          );
        })}

        {/* Appointments */}
        {appointments.map((app) => (
          <DraggableAppointment key={app.id} app={app} />
        ))}
      </div>
    </div>
  );
};

const DraggableAppointment = ({ app }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'APPOINTMENT',
    item: { ...app },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Calculate vertical position
  const [hour, minute] = app.appointment_time?.split(':').map(Number);
  const topOffset = ((hour - 6) * 60 + minute) / 15 * slotHeight;

  return (
    <div
      ref={drag}
      className={`absolute left-1 right-1 bg-blue-100 border-l-4 border-blue-500 p-2 rounded-sm text-sm shadow-sm ${
        isDragging ? 'opacity-50' : ''
      }`}
      style={{
        top: `${topOffset}px`,
        height: `${(app.duration_min / 15) * slotHeight}px`,
        zIndex: 10,
      }}
    >
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
  );
};