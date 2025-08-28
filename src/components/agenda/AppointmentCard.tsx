import React, { useEffect, useState } from 'react';
import { Clock, User, Pencil } from 'lucide-react';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';

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
  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: 'APPOINTMENT',
      item: {
        appointment_time: time,
        customer_name: clientName,
        service_id: service,
        duration_min: duration,
        stylist,
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [time, clientName, service, duration, stylist]
  );

  // Disable default browser drag image so we can render our own smooth preview
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  // Track pointer position during HTML5 drag to position our smooth preview
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isDragging) {
      setDragPos(null);
      return;
    }

    const onDragOver = (e: DragEvent) => {
      // Prevent default so some browsers keep firing dragover consistently
      e.preventDefault?.();
      setDragPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('dragover', onDragOver, { passive: false });
    return () => {
      window.removeEventListener('dragover', onDragOver as any);
    };
  }, [isDragging]);

  const slotHeight = 40; // px per 15m (we’ll adapt when switching to 10m slots later)
  const height = (duration / 15) * slotHeight;

  // Shared styles for card content so source & preview are visually identical
  const CardInner = (
    <>
      <div className="text-xs font-medium text-gray-800 flex justify-between">
        <span>{time}</span>
        <span>{duration} min</span>
      </div>

      <div className="flex items-center text-sm font-medium text-gray-700 truncate mt-1">
        <User size={14} className="mr-1 text-gray-500" />
        <span className="truncate">{clientName}</span>
      </div>

      <div className="mt-1 text-gray-600 text-xs truncate">{service}</div>

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
    </>
  );

  return (
    <>
      {/* Source element (hidden while dragging so no ghost remains at origin) */}
      <div
        ref={drag}
        className={`relative bg-blue-100 border-l-4 border-blue-500 rounded-sm shadow-sm ${
          isDragging ? 'invisible' : ''
        }`}
        style={{
          height: `${height}px`,
          padding: '4px 8px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      >
        {CardInner}
      </div>

      {/* Floating preview that follows the cursor with zero lag */}
      {isDragging && dragPos && (
        <div
          // Use fixed so it tracks the viewport; pointerEvents none so it doesn't intercept drops
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            transform: `translate3d(${dragPos.x + 8}px, ${dragPos.y + 8}px, 0)`,
            zIndex: 9999,
            pointerEvents: 'none',
            willChange: 'transform',
          }}
        >
          <div
            className="relative bg-blue-100 border-l-4 border-blue-500 rounded-sm shadow-sm"
            style={{
              height: `${height}px`,
              padding: '4px 8px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
            }}
          >
            {CardInner}
          </div>
        </div>
      )}
    </>
  );
};

export default AppointmentCard;