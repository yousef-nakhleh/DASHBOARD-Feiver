 import React from 'react';
import { useDrag } from 'react-dnd';
import { User } from 'lucide-react';

const slotHeight = 40;

const DraggableAppointment = ({ app, onClick }) => {
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
      onClick={() => onClick?.(app)}
      className={`absolute left-1 right-1 bg-blue-100 border-l-4 border-blue-500 px-2 py-1 rounded-sm text-sm shadow-sm overflow-hidden cursor-pointer ${
        isDragging ? 'opacity-50' : ''
      }`}
      style={{
        top: `${topOffset}px`,
        height: `${(app.duration_min / 15) * slotHeight}px`,
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

      {/* Example placeholder for future label */}
      {/* <div className="text-xs text-gray-500 truncate mt-1">{getServiceName(app.service_id)}</div> */}
    </div>
  );
};

export default DraggableAppointment;