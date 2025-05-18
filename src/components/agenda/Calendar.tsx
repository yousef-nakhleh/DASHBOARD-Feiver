import React from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { User } from 'lucide-react';

const slotHeight = 40;

export const Calendar = ({ timeSlots, appointments, onDrop, onClickAppointment, barbers, selectedBarber }) => {
  const displayedBarbers = selectedBarber === 'Tutti' ? barbers : barbers.filter(b => b.id === selectedBarber);
  const groupedAppointments = groupAppointmentsByTimeAndBarber(appointments);

  return (
    <div className={`grid`} style={{ gridTemplateColumns: `80px repeat(${displayedBarbers.length}, 1fr)` }}>
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

      {/* One column per barber */}
      {displayedBarbers.map((barber) => (
        <div key={barber.id} className="relative bg-white border-l">
          {timeSlots.map((slot, i) => {
            const slotAppointments = groupedAppointments[`${slot.time}_${barber.id}`] || [];

            const [, drop] = useDrop({
              accept: 'APPOINTMENT',
              drop: (draggedItem: any) => {
                if (
                  draggedItem.appointment_time.slice(0, 5) !== slot.time ||
                  draggedItem.barber_id !== barber.id
                ) {
                  // Disallow cross-barber drag
                  return;
                }
                onDrop(draggedItem.id, `${slot.time}:00`);
              },
            });

            return (
              <div
                key={slot.time}
                ref={drop}
                className="h-10 border-t border-gray-200 relative flex space-x-1 px-1"
              >
                {slotAppointments.map((app, index) => (
                  <DraggableAppointment
                    key={app.id}
                    app={app}
                    onClick={() => onClickAppointment?.(app)}
                    flexBasis={100 / slotAppointments.length}
                  />
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const groupAppointmentsByTimeAndBarber = (appointments) => {
  const grouped = {};
  for (const app of appointments) {
    const time = app.appointment_time?.slice(0, 5);
    const key = `${time}_${app.barber_id}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(app);
  }
  return grouped;
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