import React from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { User } from 'lucide-react';

const slotHeight = 40;

export const Calendar = ({ timeSlots, appointments, onDrop, onClickAppointment, barbers }) => {
  const isTutti = barbers.length > 1;

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

      {/* Appointment Grid */}
      <div className="relative bg-white border-l">
        {timeSlots.map((slot) => {
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
              key={slot.time}
              ref={drop}
              className="h-10 border-t border-gray-200 relative flex px-1"
            >
              {isTutti ? (
                barbers.map((barber) => {
                  const apps = appointments.filter(
                    (a) =>
                      a.barber_id === barber.id &&
                      a.appointment_time.slice(0, 5) === slot.time
                  );
                  return (
                    <div key={barber.id} className="flex-1 h-full flex space-x-1">
                      {apps.map((app) => (
                        <DraggableAppointment
                          key={app.id}
                          app={app}
                          onClick={() => onClickAppointment?.(app)}
                          flexBasis={100 / apps.length}
                        />
                      ))}
                    </div>
                  );
                })
              ) : (
                <div className="flex-1 h-full flex space-x-1">
                  {appointments
                    .filter((a) => a.appointment_time.slice(0, 5) === slot.time)
                    .map((app) => (
                      <DraggableAppointment
                        key={app.id}
                        app={app}
                        onClick={() => onClickAppointment?.(app)}
                        flexBasis={100}
                      />
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DraggableAppointment = ({ app, onClick, flexBasis }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'APPOINTMENT',
    item: { ...app },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      onClick={onClick}
      className={`bg-blue-100 border-l-4 border-blue-500 px-2 py-1 rounded-sm text-sm shadow-sm overflow-hidden cursor-pointer ${
        isDragging ? 'opacity-50' : ''
      }`}
      style={{
        height: `${(app.duration_min / 15) * slotHeight}px`,
        flexBasis: `${flexBasis}%`,
        flexGrow: 1,
        flexShrink: 0,
      }}
    >
      <div className="flex justify-between text-xs font-medium text-gray-800">
        <span>{app.appointment_time?.slice(0, 5)}</span>
        <span>{app.duration_min} min</span>
      </div>
      <div className="flex items-center mt-1 text-sm font-medium text-gray-700 truncate">
        <User size={14} className="mr-1 text-gray-500" />
        <span className="truncate">{app.customer_name}</span>
      </div>
    </div>
  );
};