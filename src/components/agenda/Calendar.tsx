import React from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const slotHeight = 40;

export const Calendar = ({
  timeSlots,
  appointments,
  onDrop,
  onClickAppointment,
  barbers,
  selectedBarber,
  datesInView = [],
}) => {
  const isSingleDay = datesInView.length === 1;

  const barbersToRender = selectedBarber === 'Tutti'
    ? barbers
    : barbers.filter(b => b.id === selectedBarber);

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

      {/* Appointments Canvas */}
      <div className="relative bg-white border-l w-full overflow-x-auto">
        <div
          className="flex w-full"
          style={{
            minWidth: '100%',
          }}
        >
          {datesInView.map((date) => {
            const dateStr = date.toISOString().split('T')[0];
            return barbersToRender.map((barber) => (
              <DayBarberColumn
                key={`${dateStr}-${barber.id}`}
                date={dateStr}
                barber={barber}
                timeSlots={timeSlots}
                appointments={appointments}
                onDrop={onDrop}
                onClickAppointment={onClickAppointment}
                totalBarbers={barbersToRender.length}
              />
            ));
          })}
        </div>
      </div>
    </div>
  );
};

const DayBarberColumn = ({
  date,
  barber,
  timeSlots,
  appointments,
  onDrop,
  onClickAppointment,
  totalBarbers,
}) => {
  return (
    <div
      className="flex flex-col border-r"
      style={{ width: `${100 / totalBarbers}%` }}
    >
      {timeSlots.map((slot) => {
        const [, drop] = useDrop({
          accept: 'APPOINTMENT',
          drop: (draggedItem) => {
            if (
              draggedItem.appointment_time.slice(0, 5) !== slot.time ||
              draggedItem.appointment_date !== date ||
              draggedItem.barber_id !== barber.id
            ) {
              onDrop(draggedItem.id, {
                newTime: `${slot.time}:00`,
                newDate: date,
                newBarberId: barber.id,
              });
            }
          },
        });

        const apps = appointments.filter(
          (a) =>
            a.appointment_date === date &&
            a.barber_id === barber.id &&
            a.appointment_time.slice(0, 5) === slot.time
        );

        return (
          <div
            key={slot.time}
            ref={drop}
            className="h-10 border-t border-gray-200 relative px-1"
          >
            {apps.map((app) => (
              <DraggableAppointment
                key={app.id}
                app={app}
                onClick={() => onClickAppointment?.(app)}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
};

const DraggableAppointment = ({ app, onClick }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'APPOINTMENT',
    item: { ...app },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const handleResize = async (e) => {
    e.stopPropagation();
    const startY = e.clientY;
    const originalHeight = (app.duration_min / 15) * slotHeight;
    const onMouseMove = (moveEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const steps = Math.round(deltaY / slotHeight);
      const newDuration = Math.max(15, app.duration_min + steps * 15);
      const newHeight = (newDuration / 15) * slotHeight;
      document.getElementById(`app-${app.id}`).style.height = `${newHeight}px`;
    };
    const onMouseUp = async (upEvent) => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      const deltaY = upEvent.clientY - startY;
      const steps = Math.round(deltaY / slotHeight);
      const newDuration = Math.max(15, app.duration_min + steps * 15);
      if (newDuration !== app.duration_min) {
        await supabase.from('appointments').update({ duration_min: newDuration }).eq('id', app.id);
      }
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const isPaid = app.paid === true;

  return (
    <div
      id={`app-${app.id}`}
      ref={drag}
      onClick={onClick}
      className={`border-l-4 px-2 py-1 rounded-sm text-sm shadow-sm overflow-hidden cursor-pointer relative ${
        isDragging ? 'opacity-50' : ''
      } ${
        isPaid ? 'bg-green-100 border-green-500' : 'bg-blue-100 border-blue-500'
      }`}
      style={{
        height: `${(app.duration_min / 15) * slotHeight}px`,
      }}
    >
      <div className="flex justify-between text-xs font-medium text-gray-800">
        <span>{app.appointment_time?.slice(0, 5)}</span>
        <span>{app.duration_min} min</span>
      </div>
      <div className="flex flex-col mt-1 text-sm font-medium text-gray-700 truncate">
        <div className="flex items-center">
          <User size={14} className="mr-1 text-gray-500" />
          <span className="truncate">{app.customer_name}</span>
        </div>
        {app.services?.name && (
          <span className="text-xs italic text-gray-500 mt-1 truncate">
            {app.services.name}
          </span>
        )}
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize z-10"
        onMouseDown={handleResize}
      />
    </div>
  );
};