// src/components/staff/EditStaffAvailabilityModal.tsx
import React, { useEffect, useState } from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { User } from 'lucide-react';
import { toLocalFromUTC } from '../../lib/timeUtils';
import { getEmptyImage } from 'react-dnd-html5-backend';

const slotHeight = 40;

export const Calendar = ({
  timeSlots,
  appointments,
  businessTimezone,
  onDrop,
  onClickAppointment,
  onEmptySlotClick,      // ✅ nuova prop
  barbers,
  selectedBarber,
  datesInView = [], 
}) => {
  const barbersToRender =
    selectedBarber === 'Tutti'
      ? barbers
      : barbers.filter((b) => b.id === selectedBarber);

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="flex min-h-[1100px]">
        {/* Time labels */}
        <div className="bg-white border-r shrink-0">
          {timeSlots.map((slot, i) => (
            <div
              key={i}
              className={`h-[${slotHeight}px] px-2 flex items-start pt-1 justify-end text-xs ${
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

        {/* Appointment Grid */}
        <div className="flex-1 overflow-x-auto bg-white">
          <div className="flex min-w-full">
            {datesInView.map((date) => {
              const dateStr = date.toISOString().split('T')[0]; 
              return barbersToRender.map((barber) => (
                <DayBarberColumn
                  key={`${dateStr}-${barber.id}`}
                  date={dateStr}
                  businessTimezone={businessTimezone}
                  barber={barber}
                  timeSlots={timeSlots}
                  appointments={appointments}
                  onDrop={onDrop}
                  onClickAppointment={onClickAppointment}
                  onEmptySlotClick={onEmptySlotClick}
                  totalBarbers={barbersToRender.length}
                />
              ));
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const DayBarberColumn = ({
  date,
  businessTimezone,
  barber,
  timeSlots,
  appointments,
  onDrop,
  onClickAppointment,
  onEmptySlotClick,
  totalBarbers,
}) => {
  return (
    <div
      className="flex flex-col border-r"
      style={{ width: `${100 / totalBarbers}%` }}
    >
      {timeSlots.map((slot) => {
        const [, drop] = useDrop({
          accept: 'APPOINTMENT',
          drop: (draggedItem) => {
            // Convert current appointment to local time for comparison
            const currentLocal = toLocalFromUTC({
              utcString: draggedItem.appointment_date,
              timezone: businessTimezone,
            });
            
            const currentDate = currentLocal.toFormat('yyyy-MM-dd');
            const currentTime = currentLocal.toFormat('HH:mm');
            
            // Only update if something actually changed
            if (currentTime !== slot.time || currentDate !== date || draggedItem.barber_id !== barber.id) {
              onDrop(draggedItem.id, {
                newTime: `${slot.time}:00`,
                newDate: date,
                newBarberId: barber.id,
              });
            }
          },
        });

        // Filter appointments for this time slot
        const slotStart = new Date(`${date}T${slot.time}:00`);
        const slotEnd = new Date(slotStart.getTime() + 15 * 60_000); // +15 min

        const apps = appointments.filter((a) => {
          if (
            a.appointment_status === 'cancelled' ||
            a.barber_id !== barber.id
          ) {
            return false;
          }

          // Convert UTC appointment_start to local time for comparison
          const localAppointment = toLocalFromUTC({
            utcString: a.appointment_date,
            timezone: businessTimezone,
          });
          
          const appointmentDate = localAppointment.toFormat('yyyy-MM-dd');
          const appointmentStart = localAppointment.toJSDate();
          
          return appointmentDate === date && appointmentStart >= slotStart && appointmentStart < slotEnd;
        });

        const isEmpty = apps.length === 0;

        return (
          <div
            key={slot.time}
            ref={drop}
            className={`h-[40px] border-t border-gray-200 relative px-1 ${
              isEmpty ? 'hover:bg-gray-100 cursor-pointer' : ''
            }`}
            onClick={() => {
              if (isEmpty) {
                onEmptySlotClick?.(barber.id, date, slot.time);
              }
            }}
          >
            <span className="absolute top-0 right-2 transform -translate-y-1/2">
              {slot.time}
            </span>
            {apps.map((app) => (
              <DraggableAppointment
                key={app.id}
                app={app}
                businessTimezone={businessTimezone}
                onClick={() => onClickAppointment?.(app)}
                flexBasis={100}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
};

const DraggableAppointment = ({ app, businessTimezone, onClick, flexBasis }) => {
  // ***** CHANGED: enhance drag behavior while keeping existing drop logic *****
  const [{ isDragging }, drag, preview] = useDrag({
    type: 'APPOINTMENT',
    item: { ...app },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Disable the native browser drag image so we control the preview
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  // Track the cursor to position our floating preview
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isDragging) {
      setDragPos(null);
      return;
    }
    const onDragOver = (e: DragEvent) => {
      e.preventDefault?.();
      setDragPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('dragover', onDragOver, { passive: false });
    return () => window.removeEventListener('dragover', onDragOver as any);
  }, [isDragging]);

  const isPaid = app.paid === true;
  
  // Convert UTC appointment_start to local time for display
  const localTime = toLocalFromUTC({
    utcString: app.appointment_date,
    timezone: businessTimezone,
  });
  
  const displayTime = localTime.toFormat('HH:mm');

  // Use appointment-specific duration if available, otherwise fall back to service duration
  const appointmentDuration = app.duration_min || app.services?.duration_min || 30;

  // Shared inner content so source and floating preview look identical
  const Inner = (
    <>
      <div className="flex justify-between text-xs font-medium text-gray-800">
        <span>{displayTime}</span>
        <span>{appointmentDuration} min</span>
      </div>
      <div className="flex flex-col mt-1 text-sm font-medium text-gray-700 truncate">
        <div className="flex items-center">
          <User size={14} className="mr-1 text-gray-500" />
          <span className="truncate">
            {`${app.contact?.first_name || ''} ${app.contact?.last_name || ''}`.trim() || 'Cliente'}
          </span>
        </div>
        {app.services?.name && (
          <span className="text-xs italic text-gray-500 mt-1 truncate">
            {app.services.name}
          </span>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Source element: hidden while dragging so no ghost stays at origin */}
      <div
        ref={drag}
        onClick={onClick}
        className={`relative z-10 border-l-4 px-2 py-1 rounded-sm text-sm shadow-sm overflow-hidden hover:shadow-md transition-shadow ${
          isDragging ? 'invisible' : 'cursor-grab'
        } ${isPaid ? 'bg-green-100 border-green-500' : 'bg-blue-100 border-blue-500'}`}
        style={{
          height: `${(appointmentDuration / 15) * slotHeight}px`,
          flexBasis: `${flexBasis}%`,
          flexGrow: 1,
          flexShrink: 0,
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      >
        {Inner}
      </div>

      {/* Floating preview that follows the cursor with zero lag */}
      {isDragging && dragPos && (
        <div
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
            className={`relative border-l-4 px-2 py-1 rounded-sm text-sm shadow-sm overflow-hidden ${
              isPaid ? 'bg-green-100 border-green-500' : 'bg-blue-100 border-blue-500'
            }`}
            style={{
              height: `${(appointmentDuration / 15) * slotHeight}px`,
              boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
            }}
          >
            {Inner}
          </div>
        </div>
      )}
    </>
  );
};