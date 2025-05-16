import React from 'react';
import { Clock, User } from 'lucide-react';

interface AppointmentCardProps {
  time: string;
  clientName: string;
  service: string;
  duration: number; // duration in minutes
  stylist: string;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  time,
  clientName,
  service,
  duration,
  stylist,
}) => {
  // Each 15m block is 2.5rem (40px) — consistent with Agenda.tsx
  const slotHeight = 40; // px per 15m
  const height = (duration / 15) * slotHeight;

  return (
    <div
      className="absolute bg-blue-100 border-l-4 border-blue-500 p-2 rounded-r-sm text-sm shadow-sm hover:shadow transition-shadow cursor-pointer"
      style={{
        top: '0',
        left: '4px',
        right: '4px',
        height: `${height}px`
      }}
    >
      <div className="flex justify-between">
        <span className="font-medium">{time}</span>
        <span className="text-gray-600 text-xs">{duration} min</span>
      </div>
      <div className="flex items-center mt-1">
        <User size={14} className="text-gray-500 mr-1" />
        <span>{clientName}</span>
      </div>
      <div className="mt-1 text-gray-600 text-xs truncate">{service}</div>
    </div>
  );
};

export default AppointmentCard;