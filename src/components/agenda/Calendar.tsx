import React from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { User } from 'lucide-react';

const slotHeight = 40;

export const Calendar = ({
  timeSlots,
  appointments,
  onDrop,
  onClickAppointment,
  barbers,
  selectedBarber,
  view,
  selectedDate,
}) => {
  const isTutti = selectedBarber === 'Tutti';

  const getDatesInRange = () => {
    const days = view === '3day' ? 3 : view === 'week' ? 7 : 1;
    const result = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + i);
      result.push(d.toISOString().split('T')[0]);
    }
    return result;
  };

  const datesInRange = getDatesInRange();

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
              {isTutti
                ? barbers.map((barber) => (
                    <div
                      key={barber.id}
                      className="flex flex-grow"
                      style={{ width: `${100 / (barbers.length * datesInRange.length)}%` }}
                    >
                      {datesInRange.map((date) => {
                        const apps = appointments.filter(
                          (a) =>
                            a.barber_id === barber.id &&
                            a.appointment_time.slice(0, 5) === slot.time &&
                            a.appointment_date === date
                        );
                        return (
                          <div key={date} className="h-full w-full flex flex-col space-y-1">
                            {apps.map((app) => (
                              <DraggableAppointment
                                key={app.id}
                                app={app}
                                onClick={() => onClickAppointment?.(app)}
                                flexBasis={100}
                              />
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))
                : datesInRange.map((date) => {
                    const apps = appointments.filter(
                      (a) =>
                        a.appointment_time.slice(0, 5) === slot.time &&
                        a.appointment_date === date &&
                        a.barber_id === selectedBarber
                    );
                    return (
                      <div key={date} className="h-full w-full flex flex-col space-y-1" style={{ width: `${100 / datesInRange.length}%` }}>
                        {apps.map((app) => (
                          <DraggableAppointment
                            key={app.id}
                            app={app}
                            onClick={() => onClickAppointment?.(app)}
                            flexBasis={100}
                          />
                        ))}
                      </div>
                    );
                  })}
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

  const isPaid = app.paid === true;

  return (
    <div
      ref={drag}
      onClick={onClick}
      className={`$ {
        isPaid ? 'bg-green-100 border-green-500' : 'bg-blue-100 border-blue-500'
      } border-l-4 px-2 py-1 rounded-sm text-sm shadow-sm overflow-hidden cursor-pointer ${
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
    </div>
  );
};