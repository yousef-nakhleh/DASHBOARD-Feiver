// src/components/agenda/AppointmentCard.tsx
import React from 'react';
import { User, Phone, Clock } from 'lucide-react';

type AppointmentCardProps = {
  time: string;              // 'HH:mm'
  duration: number;          // minutes
  clientName: string;
  serviceName?: string;
  phoneE164?: string;
  paid?: boolean;
  onClick?: () => void;
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
        padding: '8px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      {/* Time + duration */}
      <div className="flex items-center justify-between text-[11px] font-medium text-gray-800 leading-none">
        <span className="inline-flex items-center gap-1">
          <Clock size={12} className="opacity-70" />
          {time}
        </span>
        <span>{duration} min</span>
      </div>

      {/* Client */}
      <div className="flex items-center gap-2">
        <User size={14} className="text-gray-600 shrink-0" />
        <span className="text-sm font-semibold text-gray-900 truncate">{clientName || 'Cliente'}</span>
      </div>

      {/* Service */}
      {serviceName ? (
        <div className="text-[12px] font-medium text-gray-900 truncate">
          {serviceName}
        </div>
      ) : null}

      {/* Phone */}
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