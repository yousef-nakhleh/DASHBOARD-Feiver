// src/components/agenda/AppointmentCard.tsx
import React, { useRef } from 'react';
import { User, Phone, Clock } from 'lucide-react';

type AppointmentCardProps = {
  time: string;              // 'HH:mm'
  duration: number;          // minutes
  clientName: string;
  serviceName?: string;
  phoneE164?: string;
  paid?: boolean;
  onClick?: () => void;

  // ⬇️ NEW (minimal, to wire with the grid)
  onResize?: (nextDurationMin: number) => void;     // live while dragging (optional)
  onResizeEnd?: (finalDurationMin: number) => void; // when mouseup (optional)
  pxPerMinute: number;                               // e.g. slotHeight / 10
  stepMinutes?: number;                              // default 10
  minMinutes?: number;                               // default 10
  maxMinutes?: number;                               // optional clamp
};

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  time,
  duration,
  clientName,
  serviceName,
  phoneE164,
  paid = false,
  onClick,

  // resize wiring
  onResize,
  onResizeEnd,
  pxPerMinute,
  stepMinutes = 10,
  minMinutes = 10,
  maxMinutes,
}) => {
  const dragState = useRef<{
    startY: number;
    startDuration: number;
    active: boolean;
  }>({ startY: 0, startDuration: duration, active: false });

  const clampToStep = (mins: number) => {
    const stepped = Math.round(mins / stepMinutes) * stepMinutes;
    const minC = Math.max(stepped, minMinutes);
    return typeof maxMinutes === 'number' ? Math.min(minC, maxMinutes) : minC;
  };

  const handleMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
    e.preventDefault();
    dragState.current = {
      startY: e.clientY,
      startDuration: duration,
      active: true,
    };

    const onMove = (ev: MouseEvent) => {
      if (!dragState.current.active) return;
      const deltaY = ev.clientY - dragState.current.startY;
      const deltaMin = deltaY / pxPerMinute;
      const next = clampToStep(dragState.current.startDuration + deltaMin);
      if (onResize) onResize(next);
    };

    const onUp = (ev: MouseEvent) => {
      if (!dragState.current.active) return;
      const deltaY = ev.clientY - dragState.current.startY;
      const deltaMin = deltaY / pxPerMinute;
      const next = clampToStep(dragState.current.startDuration + deltaMin);
      dragState.current.active = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      if (onResizeEnd) onResizeEnd(next);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

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

      {/* ⬇️ Bottom-only resize handle (tiny, invisible) */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute left-0 right-0 bottom-0"
        style={{
          height: 6,              // tiny grab zone
          cursor: 'ns-resize',
          // no visual change; keep it transparent
        }}
      />
    </div>
  );
};

export default AppointmentCard;