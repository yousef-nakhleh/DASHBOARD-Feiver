// src/components/staff/EditStaffAvailabilityModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useDrop } from 'react-dnd';
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
  // ref to the entire column so we can translate pointer Y -> slot index
  const columnRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      ref={columnRef}
      className="flex flex-col border-r relative"
      style={{ width: `${100 / totalBarbers}%` }}
    >
      {timeSlots.map((slot) => {
        // keep useDrop for now (no visual change required)
        const [{ isOver }, drop] = useDrop({
          accept: 'APPOINTMENT',
          drop: () => {},
          collect: (monitor) => ({
            isOver: monitor.isOver(),
          }),
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
            } ${isOver ? '' : ''}`}
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
              <PointerDraggableAppointment
                key={app.id}
                app={app}
                businessTimezone={businessTimezone}
                onClick={() => onClickAppointment?.(app)}
                flexBasis={100}
                columnRef={columnRef}
                date={date}
                barberId={barber.id}
                timeSlots={timeSlots}
                onDrop={onDrop}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
};

// -------------------- POINTER-BASED CARD (no react-dnd on the card) --------------------

type PointerDraggableProps = {
  app: any;
  businessTimezone: string;
  onClick?: () => void;
  flexBasis: number;
  columnRef: React.RefObject<HTMLDivElement>;
  date: string;
  barberId: string | number;
  timeSlots: Array<{ time: string }>;
  onDrop: (id: any, payload: { newTime: string; newDate: string; newBarberId: any }) => void;
};

const PointerDraggableAppointment: React.FC<PointerDraggableProps> = ({
  app,
  businessTimezone,
  onClick,
  flexBasis,
  columnRef,
  date,
  barberId,
  timeSlots,
  onDrop,
}) => {
  const isPaid = app.paid === true;

  // Convert UTC appointment_start to local time for display
  const localTime = toLocalFromUTC({
    utcString: app.appointment_date,
    timezone: businessTimezone,
  });
  const displayTime = localTime.toFormat('HH:mm');

  const appointmentDuration = app.duration_min || app.services?.duration_min || 30;

  // drag state
  const [dragging, setDragging] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const grabOffset = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // left button / primary pointer only
    if (e.button !== 0) return;
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);

    const rect = columnRef.current?.getBoundingClientRect();
    if (!rect) return;

    // compute offset so the card doesn't jump when starting drag
    grabOffset.current = {
      dx: e.clientX - (rect.left + 8), // keep card aligned to column padding (~px-2)
      dy: e.clientY - (rect.top + 0),
    };

    setCursor({ x: e.clientX, y: e.clientY });
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setCursor({ x: e.clientX, y: e.clientY });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragging(false);

    const rect = columnRef.current?.getBoundingClientRect();
    if (!rect) return;

    // y within column
    const yWithin = e.clientY - rect.top;
    // snap to slot index (15m, 40px)
    let idx = Math.floor(yWithin / slotHeight);
    idx = Math.max(0, Math.min(timeSlots.length - 1, idx));

    const targetTime = timeSlots[idx].time;

    // call your existing onDrop with new time in this same column/date
    onDrop(app.id, {
      newTime: `${targetTime}:00`,
      newDate: date,
      newBarberId: barberId,
    });
  };

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

  // card height based on duration (still 15m grid for now)
  const cardHeight = (appointmentDuration / 15) * slotHeight;

  if (dragging) {
    // render the same element following the cursor; no ghost left behind
    const colRect = columnRef.current?.getBoundingClientRect();
    const fixedLeft = (colRect?.left ?? 0) + 8; // respect px-2 padding in the slot
    const translateY = cursor.y - grabOffset.current.dy;

    return (
      <div
        role="button"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          position: 'fixed',
          left: fixedLeft,
          top: 0,
          transform: `translate3d(0, ${translateY}px, 0)`,
          width: `calc(${flexBasis}% - 16px)`, // approximate column width minus padding
          zIndex: 9999,
          pointerEvents: 'none', // so slots below can still detect pointer for hover visuals if needed
        }}
        className={`relative border-l-4 px-2 py-1 rounded-sm text-sm shadow-sm overflow-hidden ${
          isPaid ? 'bg-green-100 border-green-500' : 'bg-blue-100 border-blue-500'
        }`}
      >
        <div style={{ height: `${cardHeight}px` }}>{Inner}</div>
      </div>
    );
  }

  // normal (not dragging) render inside the slot
  return (
    <div
      role="button"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={onClick}
      className={`relative z-10 border-l-4 px-2 py-1 rounded-sm text-sm shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-grab ${
        isPaid ? 'bg-green-100 border-green-500' : 'bg-blue-100 border-blue-500'
      }`}
      style={{
        height: `${cardHeight}px`,
        flexBasis: `${flexBasis}%`,
        flexGrow: 1,
        flexShrink: 0,
        willChange: 'transform',
        transform: 'translateZ(0)',
      }}
    >
      {Inner}
    </div>
  );
};