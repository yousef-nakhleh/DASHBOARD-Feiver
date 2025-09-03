// src/components/agenda/AppointmentCard.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { User, Phone, Clock } from 'lucide-react';

type ResizeDir = 'top' | 'bottom';

type AppointmentCardProps = {
  time: string;              // 'HH:mm'
  duration: number;          // minutes
  clientName: string;
  serviceName?: string;
  phoneE164?: string;
  paid?: boolean;
  onClick?: () => void;

  /** ⬇️ NEW — all optional, safe defaults so nothing else needs changing */
  enableResize?: boolean;                      // show resize handles
  rowHeightPx?: number;                        // height per grid row
  minutesPerRow?: number;                      // minutes per grid row
  onResizeStart?: (dir: ResizeDir) => void;    // notify start
  onResize?: (deltaMinutes: number, dir: ResizeDir) => void; // live preview
  onResizeEnd?: (deltaMinutes: number, dir: ResizeDir) => void; // commit
};

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  time,
  duration,
  clientName,
  serviceName,
  phoneE164,
  paid = false,
  onClick,

  // NEW (all optional)
  enableResize = true,
  rowHeightPx = 120,      // matches your Calendar slotHeight
  minutesPerRow = 10,     // matches your 10m grid
  onResizeStart,
  onResize,
  onResizeEnd,
}) => {
  // --- Resize state (local-only UI) ---
  const dragInfo = useRef<{
    startY: number;
    dir: ResizeDir;
  } | null>(null);

  const [previewDeltaMin, setPreviewDeltaMin] = useState<number>(0);

  const pixelsPerMinute = rowHeightPx / minutesPerRow;

  const endResize = useCallback(() => {
    if (!dragInfo.current) return;
    const { dir } = dragInfo.current;
    const delta = previewDeltaMin;
    dragInfo.current = null;
    setPreviewDeltaMin(0);
    onResizeEnd?.(delta, dir);
  }, [previewDeltaMin, onResizeEnd]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragInfo.current) return;
      const { startY, dir } = dragInfo.current;
      const dy = e.clientY - startY;
      // bottom grows with +dy; top grows with -dy
      const signedMinutes = Math.round(dy / pixelsPerMinute) * (dir === 'bottom' ? 1 : -1);
      setPreviewDeltaMin(signedMinutes);
      onResize?.(signedMinutes, dir);
    };

    const onUp = () => endResize();

    if (dragInfo.current) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      return () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
    }
  }, [endResize, onResize, pixelsPerMinute]);

  const beginResize = (e: React.MouseEvent, dir: ResizeDir) => {
    if (!enableResize) return;
    e.stopPropagation();          // prevent drag-to-move
    e.preventDefault();
    dragInfo.current = { startY: e.clientY, dir };
    setPreviewDeltaMin(0);
    onResizeStart?.(dir);
  };

  const isResizing = !!dragInfo.current;
  const effectiveDuration = Math.max(5, duration + previewDeltaMin); // clamp a bit for preview

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
      {/* Top resize handle */}
      {enableResize && (
        <div
          onMouseDown={(e) => beginResize(e, 'top')}
          className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize"
          style={{ transform: 'translateY(-1px)' }} // tiny bleed to make it easy to grab
        />
      )}

      {/* Time + duration (shows live preview) */}
      <div className="flex items-center justify-between text-[11px] font-medium text-gray-800 leading-none">
        <span className="inline-flex items-center gap-1">
          <Clock size={12} className="opacity-70" />
          {time}
        </span>
        <span>
          {isResizing ? `${effectiveDuration} min` : `${duration} min`}
        </span>
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

      {/* Bottom resize handle */}
      {enableResize && (
        <div
          onMouseDown={(e) => beginResize(e, 'bottom')}
          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize"
          style={{ transform: 'translateY(1px)' }}
        />
      )}

      {/* Optional subtle overlay while resizing */}
      {isResizing && (
        <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-gray-400/60 rounded-md" />
      )}
    </div>
  );
};

export default AppointmentCard;