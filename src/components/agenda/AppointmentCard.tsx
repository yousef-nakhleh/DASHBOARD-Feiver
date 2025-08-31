// src/components/agenda/AppointmentCard.tsx
import React from 'react';
import { User, Phone, Clock } from 'lucide-react';

type AppointmentCardProps = {
  time: string;              // 'HH:mm' (already localized)
  duration: number;          // minutes
  clientName: string;        // from contact first_name + last_name
  serviceName?: string;      // from services.name
  phoneE164?: string;        // from contact.phone_number_e164
  paid?: boolean;            // appointment.paid
  onClick?: () => void;      // optional click handler (open summary, etc.)
};

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  time,
  duration,
  clientName,
  serviceName,
  phoneE164, 
  paid = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative w-full h-full rounded-md shadow-sm overflow-hidden transition-shadow
        ${paid ? 'bg-green-100' : 'bg-blue-100'}
        hover:shadow-md cursor-pointer`}
      style={{
        // Parent controls height; card fills it.
        // Keep inner layout compact so a 20m appointment fits all info in ~half the card visually.
        padding: '8px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      {/* Top row: time + duration */}
      <div className="flex items-center justify-between text-[11px] font-medium text-gray-800 leading-none">
        <span className="inline-flex items-center gap-1">
          <Clock size={12} className="opacity-70" />
          {time}
        </span>
        <span>{duration} min</span>
      </div>

      {/* Name (larger) */}
      <div className="flex items-center gap-2">
        <User size={14} className="text-gray-600 shrink-0" />
        <span className="text-sm font-semibold text-gray-900 truncate">{clientName || 'Cliente'}</span>
      </div>

      {/* Service (regular, black) */}
      {serviceName ? (
        <div className="text-[12px] font-medium text-gray-900 truncate">
          {serviceName}
        </div>
      ) : null}

      {/* Phone (E.164) */}
      {phoneE164 ? (
        <div className="text-[11px] text-gray-700 inline-flex items-center gap-1 truncate">
          <Phone size={12} className="opacity-70" />
          <span className="truncate">{phoneE164}</span>
        </div>
      ) : null}
    </div>
  );
};

export default AppointmentCard;