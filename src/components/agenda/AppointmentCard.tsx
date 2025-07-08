import React from 'react';
import { Clock, User, Pencil } from 'lucide-react';
import { useDrag } from 'react-dnd';

interface AppointmentCardProps {
  time: string;
  clientName: string;
  service: string;
  duration: number; // duration in minutes
  stylist: string;
  onEdit?: () => void; // <- nuova prop opzionale per aprire il modal
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  time,
  clientName,
  service,
  duration,
  stylist,
  onEdit,
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'APPOINTMENT',
    item: {
      appointment_time: time,
      customer_name: clientName,
      service_id: service,
      duration_min: duration,
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const slotHeight = 40; // px per 15m
  const height = (duration / 15) * slotHeight;

  return (
    <div
      ref={drag}
      className={`relative bg-blue-100 border-l-4 border-blue-500 rounded-sm shadow-sm transition-opacity ${
        isDragging ? 'opacity-40' : ''
      }`}
      style={{
        height: `${height}px`,
        padding: '4px 8px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div className="text-xs font-medium text-gray-800 flex justify-between">
        <span>{time}</span>
        <span>{duration} min</span>
      </div>

      <div className="flex items-center text-sm font-medium text-gray-700 truncate mt-1">
        <User size={14} className="mr-1 text-gray-500" />
        <span className="truncate">{clientName}</span>
      </div>

      <div className="mt-1 text-gray-600 text-xs truncate">{service}</div>

      {/* ✏️ Pulsante modifica */}
      {onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // previene il drag
            onEdit();
          }}
          className="absolute bottom-1 right-1 text-gray-500 hover:text-blue-600"
        >
          <Pencil size={14} />
        </button>
      )}
    </div>
  );
};

export default AppointmentCard;