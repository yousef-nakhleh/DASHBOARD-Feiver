// src/components/Calendar.tsx
import React from 'react';
import { useDrop } from 'react-dnd';
import { User } from 'lucide-react';
import { Resizable } from 'react-resizable';

const timeSlots = Array.from({ length: 64 }, (_, i) => {
  const hour = 6 + Math.floor(i / 4);
  const minutes = (i % 4) * 15;
  const time = `${hour.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`;
  const type = minutes === 0 ? 'hour' : minutes === 30 ? 'half' : 'quarter';
  return { time, type };
});

const DraggableAppointment = ({ app, onDrop, onResize, useDrag }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'APPOINTMENT',
    item: { ...app },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const handleResizeStop = (e, { size }) => {
    const newDuration = Math.round(size.height / 40) * 15;
    if (newDuration !== app.duration_min) {
      onResize(app.id, newDuration);
    }
  };

  return (
    <Resizable
      height={(app.duration_min / 15) * 40}
      width={0}
      axis="y"
      minConstraints={[0, 40]}
      onResizeStop={handleResizeStop}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <div
        ref={drag}
        className="absolute top-1 left-1 right-1 bg-blue-100 border-l-4 border-blue-500 p-2 rounded-sm text-sm shadow-sm flex flex-col justify-between"
        style={{ height: `${(app.duration_min / 15) * 40}px`, zIndex: 10, opacity: isDragging ? 0.5 : 1 }}
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
        <div className="h-2 bg-blue-400 rounded-b cursor-s-resize" />
      </div>
    </Resizable>
  );
};

const Calendar = ({ appointments, onDropTime, onResizeDuration, useDrag }) => {
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
            drop: (draggedItem) => {
              if (draggedItem.appointment_time.slice(0, 5) !== slot.time) {
                onDropTime(draggedItem.id, `${slot.time}:00`);
              }
            },
          });

          return (
            <div ref={drop} key={i} className="h-10 border-t relative">
              {apps.map((app) => (
                <DraggableAppointment
                  key={app.id}
                  app={app}
                  onDrop={onDropTime}
                  onResize={onResizeDuration}
                  useDrag={useDrag}
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
