import React from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { User } from 'lucide-react';

const slotHeight = 40;

export const Calendar = ({
  timeSlots,
  appointments,
  onDrop,
  onClickAppointment,
  selectedBarber,
  barbers = [],
}) => {
  const visibleBarbers = selectedBarber === 'Tutti'
    ? barbers
    : barbers.filter(b => b.id === selectedBarber);

  return (
    <div className={`grid grid-cols-[80px_repeat(${visibleBarbers.length},1fr)] max-h-[700px] overflow-y-auto relative`}>
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

      {/* Appointment Canvases per Barber */}
      {visibleBarbers.map((barber) => {
        const apps = appointments.filter((a) => a.barber_id === barber.id);
        const grouped = groupAppointmentsByStartTime(apps);

        return (
          <div key={barber.id} className="relative bg-white border-l">
            {timeSlots.map((slot, i) => {
              const [, drop] = useDrop({
                accept: 'APPOINTMENT',
                drop: (draggedItem: any) => {
                  if (draggedItem.barber_id !== barber.id) return; // Prevent drop in wrong column
                  if (draggedItem.appointment_time.slice(0, 5) !== slot.time) {
                    onDrop(draggedItem.id, `${slot.time}:00`);
                  }
                },
              });

              return <div ref={drop} key={i} className="h-10 border-t border-gray-200" />;
            })}

            {/* Appointments in Column */}
            {grouped.map((group) =>
              group.map((app, index) => (
                <DraggableAppointment
                  key={app.id}
                  app={app}
                  index={index}
                  total={group.length}
                  onClick={() => onClickAppointment?.(app)}
                />
              ))
            )}
          </div>
        );
      })}
    </div>
  );
};

const groupAppointmentsByStartTime = (appointments) => {
  const grouped = {};
  for (const app of appointments) {
    const time = app.appointment_time;
    if (!grouped[time]) grouped[time] = [];
    grouped[time].push(app);
  }
  return Object.values(grouped);
};

const DraggableAppointment = ({ app, index, total, onClick }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'APPOINTMENT',
    item: { ...app },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [hour, minute] = app.appointment_time?.split(':').map(Number);
  const topOffset = ((hour - 6) * 60 + minute) / 15 * slotHeight;
  const widthPercent = 100 / total;
  const leftPercent = widthPercent * index;

  return (
    <div
      ref={drag}
      onClick={onClick}
      className={`absolute bg-blue-100 border-l-4 border-blue-500 px-2 py-1 rounded-sm text-sm shadow-sm overflow-hidden cursor-pointer ${
        isDragging ? 'opacity-50' : ''
      }`}
      style={{
        top: `${topOffset}px`,
        height: `${(app.duration_min / 15) * slotHeight}px`,
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        zIndex: 10,
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