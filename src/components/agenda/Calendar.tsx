import React from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { User } from 'lucide-react';

const slotHeight = 40;

export const Calendar = ({ timeSlots, appointments, onDrop, onClickAppointment, barbers, selectedBarber }) => {
  const groupedAppointments = groupAppointmentsByBarberAndTime(appointments, selectedBarber, barbers);

  // Determine how many columns we need (1 per barber in 'Tutti', or 1 total)
  const activeBarbers = selectedBarber === 'Tutti' ? (barbers ?? []) : barbers?.filter(b => b.id === selectedBarber) ?? [];
  const barberIds = activeBarbers.map(b => b.id);

  return (
    <div className={`grid grid-cols-[80px_repeat(${barberIds.length},1fr)] max-h-[700px] overflow-y-auto relative`}>
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

      {/* Appointment Columns per Barber */}
      {barberIds.map((barberId) => (
        <div key={barberId} className="relative bg-white border-l">
          {timeSlots.map((slot, i) => {
            const slotAppointments = groupedAppointments[barberId]?.[slot.time] ?? [];

            const [, drop] = useDrop({
              accept: 'APPOINTMENT',
              drop: (draggedItem) => {
                if (
                  draggedItem.barber_id === barberId &&
                  draggedItem.appointment_time.slice(0, 5) !== slot.time
                ) {
                  onDrop(draggedItem.id, `${slot.time}:00`);
                }
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

const groupAppointmentsByBarberAndTime = (appointments, selectedBarber, barbers) => {
  const grouped = {};
  const relevantBarbers = selectedBarber === 'Tutti' ? barbers ?? [] : barbers?.filter(b => b.id === selectedBarber) ?? [];

  for (const barber of relevantBarbers) {
    grouped[barber.id] = {};
  }

  for (const app of appointments ?? []) {
    if (grouped[app.barber_id]) {
      const time = app.appointment_time?.slice(0, 5);
      if (!grouped[app.barber_id][time]) grouped[app.barber_id][time] = [];
      grouped[app.barber_id][time].push(app);
    }
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
