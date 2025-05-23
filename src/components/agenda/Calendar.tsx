import React, { useRef, useState } from 'react';
import { useDrag } from 'react-dnd';
import { User } from 'lucide-react';

const slotHeight = 40;

export const DraggableAppointment = ({ app, onClick, flexBasis, onResize }) => {
  const [{ isDragging }, drag, preview] = useDrag({
    type: 'APPOINTMENT',
    item: { ...app },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const ref = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const handleMouseDown = (e) => {
    e.stopPropagation();
    startY.current = e.clientY;
    startHeight.current = ref.current.getBoundingClientRect().height;
    setIsResizing(true);
    document.body.style.cursor = 'ns-resize';
  };

  const handleMouseMove = (e) => {
    if (!isResizing) return;
    const diffY = e.clientY - startY.current;
    const newHeight = startHeight.current + diffY;
    const newDuration = Math.max(15, Math.round(newHeight / slotHeight) * 15);
    onResize(app.id, newDuration);
  };

  const handleMouseUp = () => {
    if (isResizing) {
      setIsResizing(false);
      document.body.style.cursor = 'default';
    }
  };

  React.useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const isPaid = app.paid === true;

  return (
    <div
      ref={(node) => {
        drag(node);
        ref.current = node;
      }}
      onClick={onClick}
      className={`border-l-4 px-2 py-1 rounded-sm text-sm shadow-sm overflow-hidden cursor-pointer relative ${
        isDragging ? 'opacity-50' : ''
      } ${
        isPaid ? 'bg-green-100 border-green-500' : 'bg-blue-100 border-blue-500'
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
      <div
        onMouseDown={handleMouseDown}
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize z-10"
      />
    </div>
  );
};