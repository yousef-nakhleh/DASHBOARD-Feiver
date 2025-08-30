import React, { useEffect, useState } from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { User } from 'lucide-react';
import { toLocalFromUTC } from '../../lib/timeUtils';

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

  // 🔹 Optimistic move + drag state (UI-only)
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<{
    id: string;
    newDate: string;       // 'yyyy-MM-dd'
    newTime: string;       // 'HH:mm:00'
    newBarberId: string;
  } | null>(null);

  // When appointments refresh (Agenda refetches after onDrop), clear optimistic state
  useEffect(() => {
    if (pendingMove) setPendingMove(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments]);

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="flex min-h-[1100px]">
        {/* Time labels */}
        <div className="bg-white border-r shrink-0">
          {timeSlots.map((slot, i) => (
            <div
              key={i}
              style={{ height: slotHeight }}
              className={`px-2 flex items-start pt-1 justify-end text-xs ${
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
                  // 🔸 pass optimistic state + handlers
                  draggingId={draggingId}
                  pendingMove={pendingMove}
                  setPendingMove={setPendingMove}
                  setDraggingId={setDraggingId}
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
  // 🔸 optimistic props
  draggingId,
  pendingMove,
  setPendingMove,
  setDraggingId,
}) => {
  return (
    <div
      className="flex flex-col border-r"
      style={{ width: `${100 / totalBarbers}%` }}
    >
      {timeSlots.map((slot) => {
        const [{ isOver }, drop] = useDrop({
          accept: 'APPOINTMENT',
          drop: (draggedItem: any) => {
            // Convert current appointment to local time for comparison
            const currentLocal = toLocalFromUTC({
              utcString: draggedItem.appointment_date,
              timezone: businessTimezone,
            });

            const currentDate = currentLocal.toFormat('yyyy-MM-dd');
            const currentTime = currentLocal.toFormat('HH:mm');

            // Only update if something actually changed
            if (
              currentTime !== slot.time ||
              currentDate !== date ||
              draggedItem.barber_id !== barber.id
            ) {
              const newTime = `${slot.time}:00`;
              // 🔹 Optimistic: show immediately in the new slot/column
              setPendingMove({
                id: draggedItem.id,
                newDate: date,
                newTime,
                newBarberId: barber.id,
              });
              setDraggingId(null);
              // Persist using existing logic
              onDrop(draggedItem.id, {
                newTime,
                newDate: date,
                newBarberId: barber.id,
              });
            }
          },
          collect: (monitor) => ({
            isOver: monitor.isOver(),
          }),
        });

        // Filter appointments for this time slot
        const slotStart = new Date(`${date}T${slot.time}:00`);
        const slotEnd = new Date(slotStart.getTime() + 15 * 60_000); // +15 min

        const apps = appointments.filter((a) => {
          if (a.appointment_status === 'cancelled') return false;

          // 🔹 Determine "effective" placement (optimistic or actual)
          const isPending =
            pendingMove && pendingMove.id === a.id;

          const effectiveBarberId = isPending
            ? pendingMove!.newBarberId
            : a.barber_id;

          if (effectiveBarberId !== barber.id) return false;

          // Effective date/time in local tz
          if (isPending) {
            // pendingMove has local date/time already
            const pendingDate = pendingMove!.newDate; // 'yyyy-MM-dd'
            const pendingTime = pendingMove!.newTime; // 'HH:mm:00'
            if (pendingDate !== date) return false;
            const pendingStart = new Date(`${pendingDate}T${pendingTime}`);
            return pendingStart >= slotStart && pendingStart < slotEnd;
          } else {
            const localAppointment = toLocalFromUTC({
              utcString: a.appointment_date,
              timezone: businessTimezone,
            });
            const appointmentDate = localAppointment.toFormat('yyyy-MM-dd');
            if (appointmentDate !== date) return false;
            const appointmentStart = localAppointment.toJSDate();
            return appointmentStart >= slotStart && appointmentStart < slotEnd;
          }
        });

        const isEmpty = apps.length === 0;

        return (
          <div
            key={slot.time}
            ref={drop}
            style={{ height: slotHeight }}
            className={`border-t border-gray-200 relative px-1 ${
              isEmpty ? 'hover:bg-gray-100 cursor-pointer' : ''
            } ${draggingId ? '' : isOver ? 'bg-blue-50/30' : ''}`} // soften hover; suppress while dragging
            onClick={() => {
              if (isEmpty) {
                onEmptySlotClick?.(barber.id, date, slot.time);
              }
            }}
          >
            {apps.map((app) => (
              <DraggableAppointment
                key={app.id}
                app={app}
                businessTimezone={businessTimezone}
                onClick={() => onClickAppointment?.(app)}
                flexBasis={100}
                // 🔸 inform parent about drag start/end
                onDragStart={() => setDraggingId(app.id)}
                onDragEnd={() => setDraggingId(null)}
                // If this app is being optimistically moved, keep it visible
                isOptimisticallyMoving={
                  !!pendingMove && pendingMove.id === app.id
                }
              />
            ))}
          </div>
        );
      })}
    </div>
  );
};

const DraggableAppointment = ({
  app,
  businessTimezone,
  onClick,
  flexBasis,
  onDragStart,
  onDragEnd,
  isOptimisticallyMoving,
}: {
  app: any;
  businessTimezone: string;
  onClick: () => void;
  flexBasis: number;
  onDragStart: () => void;
  onDragEnd: () => void;
  isOptimisticallyMoving: boolean;
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'APPOINTMENT',
    item: { ...app },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: () => {
      onDragEnd();
    },
  });

  // Call onDragStart precisely when dragging toggles true
  useEffect(() => {
    if (isDragging) onDragStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return (
    <div
      ref={drag}
      onClick={onClick}
      className={`relative z-10 border-l-4 px-2 py-1 rounded-sm text-sm shadow-sm overflow-hidden transition-shadow ${
        isDragging ? 'opacity-50 cursor-grabbing' : 'cursor-grab hover:shadow-md'
      } ${
        isPaid ? 'bg-green-100 border-green-500' : 'bg-blue-100 border-blue-500'
      }`}
      style={{
        height: `${(appointmentDuration / 15) * slotHeight}px`,
        flexBasis: `${flexBasis}%`,
        flexGrow: 1,
        flexShrink: 0,
        // Keep visible even while being "virtually" reparented
        visibility: isOptimisticallyMoving ? 'visible' : undefined,
      }}
    >
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
    </div>
  );
};