// src/components/agenda/Calendar.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { toLocalFromUTC } from '../../lib/timeUtils';
import AppointmentCard from './AppointmentCard';

const slotHeight = 120; // 10m per row (visually stretched)

export const Calendar = ({
  timeSlots,
  appointments,
  businessTimezone,
  onDrop,
  onClickAppointment,
  onEmptySlotClick,
  barbers,
  selectedBarber,
  datesInView = [],
  onResizeDuration,
}) => {
  const barbersToRender =
    selectedBarber === 'Tutti'
      ? barbers
      : barbers.filter((b) => b.id === selectedBarber);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<{
    id: string;
    newDate: string;
    newTime: string;
    newBarberId: string;
  } | null>(null);

  useEffect(() => {
    if (pendingMove) setPendingMove(null);
  }, [appointments]);

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="flex min-h-[1100px]">
        {/* Time labels */}
        <div className="bg-white border-r shrink-0">
          <div style={{ height: slotHeight / 2 }} className="relative w-16 pr-2" />
          {timeSlots.map((slot, i) => (
            <div key={i} style={{ height: slotHeight }} className="relative w-16 pr-2">
              <span
                className={`absolute top-0 right-2 -translate-y-1/2 transform text-xs pointer-events-none ${
                  slot.type === 'hour'
                    ? 'font-bold text-gray-800'
                    : slot.type === 'half'
                    ? 'text-gray-500'
                    : 'text-gray-300'
                }`}
              >
                {slot.time}
              </span>
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
                  draggingId={draggingId}
                  pendingMove={pendingMove}
                  setPendingMove={setPendingMove}
                  setDraggingId={setDraggingId}
                  onResizeDuration={onResizeDuration}
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
  draggingId,
  pendingMove,
  setPendingMove,
  setDraggingId,
  onResizeDuration,
}) => {
  const columnRef = useRef<HTMLDivElement | null>(null);
  const [hoverRow, setHoverRow] = useState<number | null>(null);

  // local resize state
  const [resizing, setResizing] = useState<{
    id: string;
    startY: number;
    origDuration: number;
    newDuration: number;
  } | null>(null);

  const hasConflict = (excludeId: string, start: Date, durationMin: number) => {
    const end = new Date(start.getTime() + durationMin * 60_000);
    return appointments.some((a) => {
      if (a.appointment_status === 'cancelled') return false;
      if (a.id === excludeId) return false;
      if (a.barber_id !== barber.id) return false;

      const localStart = toLocalFromUTC({
        utcString: a.appointment_date,
        timezone: businessTimezone,
      });
      const aDate = localStart.toFormat('yyyy-MM-dd');
      if (aDate !== date) return false;

      const aStart = localStart.toJSDate();
      const aDuration = a.duration_min || a.services?.duration_min || 30;
      const aEnd = new Date(aStart.getTime() + aDuration * 60_000);

      return start < aEnd && end > aStart;
    });
  };

  // mouse listeners during resize
  useEffect(() => {
    if (!resizing) return;

    const onMove = (e: MouseEvent) => {
      const deltaY = e.clientY - resizing.startY;
      const steps = Math.round(deltaY / slotHeight); // 10-min steps
      const candidate = Math.max(10, resizing.origDuration + steps * 10);
      setResizing((prev) => (prev ? { ...prev, newDuration: candidate } : prev));
    };

    const onUp = () => {
      const currentApp = appointments.find((a) => a.id === resizing.id);
      if (currentApp) {
        const localStart = toLocalFromUTC({
          utcString: currentApp.appointment_date,
          timezone: businessTimezone,
        }).toJSDate();

        const ok = !hasConflict(resizing.id, localStart, resizing.newDuration);
        if (ok && resizing.newDuration !== resizing.origDuration && onResizeDuration) {
          onResizeDuration(resizing.id, resizing.newDuration);
        }
      }
      setResizing(null);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [resizing, appointments, businessTimezone, onResizeDuration]);

  const [{ isOver }, drop] = useDrop({
    accept: 'APPOINTMENT',
    drop: (draggedItem: any, monitor) => {
      const client = monitor.getClientOffset();
      const rect = columnRef.current?.getBoundingClientRect();
      if (!client || !rect) return;

      const offsetY = client.y - rect.top;
      let rowIndex = Math.floor(offsetY / slotHeight);
      if (rowIndex < 0) rowIndex = 0;
      if (rowIndex > timeSlots.length - 1) rowIndex = timeSlots.length - 1;

      const targetSlot = timeSlots[rowIndex];
      const newTime = `${targetSlot.time}:00`;

      const currentLocal = toLocalFromUTC({
        utcString: draggedItem.appointment_date,
        timezone: businessTimezone,
      });
      const currentDate = currentLocal.toFormat('yyyy-MM-dd');
      const currentTime = currentLocal.toFormat('HH:mm');

      const targetStart = new Date(`${date}T${targetSlot.time}:00`);
      const durationMin = draggedItem.duration_min || draggedItem.services?.duration_min || 30;

      if (hasConflict(draggedItem.id, targetStart, durationMin)) {
        setDraggingId(null);
        return;
      }

      if (
        currentTime !== targetSlot.time ||
        currentDate !== date ||
        draggedItem.barber_id !== barber.id
      ) {
        setPendingMove({
          id: draggedItem.id,
          newDate: date,
          newTime,
          newBarberId: barber.id,
        });
        setDraggingId(null);
        onDrop(draggedItem.id, { newTime, newDate: date, newBarberId: barber.id });
      }
    },
    hover: (_item, monitor) => {
      const client = monitor.getClientOffset();
      const rect = columnRef.current?.getBoundingClientRect();
      if (!client || !rect) return;
      const offsetY = client.y - rect.top;
      let rowIndex = Math.floor(offsetY / slotHeight);
      if (rowIndex < 0) rowIndex = 0;
      if (rowIndex > timeSlots.length - 1) rowIndex = timeSlots.length - 1;
      setHoverRow(rowIndex);
    },
    collect: (monitor) => ({ isOver: monitor.isOver({ shallow: true }) }),
  });

  useEffect(() => {
    if (!isOver) setHoverRow(null);
  }, [isOver]);

  return (
    <div
      className="flex flex-col border-r"
      style={{ width: `${100 / totalBarbers}%` }}
      ref={(el) => {
        columnRef.current = el;
        drop(el as any);
      }}
    >
      <div style={{ height: slotHeight / 2 }} className="border-t border-gray-200 relative px-1 pointer-events-none" />
      {timeSlots.map((slot, idx) => {
        const slotStart = new Date(`${date}T${slot.time}:00`);
        const slotEnd = new Date(slotStart.getTime() + 10 * 60_000);

        const apps = appointments.filter((a) => {
          if (a.appointment_status === 'cancelled') return false;

          const isPending = pendingMove && pendingMove.id === a.id;
          const effectiveBarberId = isPending ? pendingMove!.newBarberId : a.barber_id;
          if (effectiveBarberId !== barber.id) return false;

          if (isPending) {
            const pendingDate = pendingMove!.newDate;
            const pendingTime = pendingMove!.newTime;
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
        const highlight = isOver && hoverRow === idx;

        return (
          <div
            key={slot.time}
            style={{ height: slotHeight }}
            className={`border-t border-gray-200 relative px-1 ${
              isEmpty ? 'hover:bg-gray-100 cursor-pointer' : ''
            } ${highlight ? 'bg-blue-50/30' : ''}`}
            onClick={() => {
              if (isEmpty) onEmptySlotClick?.(barber.id, date, slot.time);
            }}
          >
            {apps.map((app) => (
              <DraggableAppointment
                key={app.id}
                app={app}
                businessTimezone={businessTimezone}
                onClick={() => onClickAppointment?.(app)}
                flexBasis={100}
                onDragStart={() => setDraggingId(app.id)}
                onDragEnd={() => setDraggingId(null)}
                isOptimisticallyMoving={!!pendingMove && pendingMove.id === app.id}
                isResizing={!!resizing && resizing.id === app.id}
                resizingDuration={!!resizing && resizing.id === app.id ? resizing.newDuration : null}
                onStartResize={(id, origDuration, startClientY) => {
                  setResizing({ id, origDuration, newDuration: origDuration, startY: startClientY });
                }}
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
  isResizing,
  resizingDuration,
  onStartResize,
}: {
  app: any;
  businessTimezone: string;
  onClick: () => void;
  flexBasis: number;
  onDragStart: () => void;
  onDragEnd: () => void;
  isOptimisticallyMoving: boolean;
  isResizing: boolean;
  resizingDuration: number | null;
  onStartResize: (id: string, origDuration: number, startClientY: number) => void;
}) => {
  const durationMin = app.duration_min || app.services?.duration_min || 30;

  const suppressClick = useRef(false);

  const [{ isDragging }, drag] = useDrag({
    type: 'APPOINTMENT',
    item: { ...app },
    canDrag: () => !isResizing, // disable move while resizing
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    end: () => onDragEnd(),
  });

  useEffect(() => {
    if (isDragging) onDragStart();
  }, [isDragging, onDragStart]);

  const localTime = toLocalFromUTC({ utcString: app.appointment_date, timezone: businessTimezone });
  const displayTime = localTime.toFormat('HH:mm');

  const clientName = `${app.contact?.first_name || ''} ${app.contact?.last_name || ''}`.trim() || 'Cliente';
  const serviceName = app.services?.name || '';
  const phoneE164 = app.contact?.phone_number_e164 || '';
  const paid = app.paid === true;

  const effectiveDuration = isResizing && resizingDuration ? resizingDuration : durationMin;
  const totalHeightPx = (effectiveDuration / 10) * slotHeight;
  const originalHeightPx = (durationMin / 10) * slotHeight;
  const extensionPx = totalHeightPx - originalHeightPx;

  return (
    <div
      ref={drag}
      onClick={(e) => {
        if (isResizing || suppressClick.current) {
          e.stopPropagation();
          suppressClick.current = false;
          return;
        }
        onClick();
      }}
      className={`relative z-10 overflow-hidden transition-shadow ${
        isDragging ? 'opacity-50 cursor-grabbing' : 'cursor-grab hover:shadow-md'
      } ${isResizing ? 'select-none' : ''}`} // smoother resize
      style={{
        height: `${totalHeightPx}px`,
        flexBasis: `${flexBasis}%`,
        flexGrow: 1,
        flexShrink: 0,
        visibility: isOptimisticallyMoving ? 'visible' : undefined,
      }}
    >
      {/* Original portion (same color) */}
      <div style={{ height: `${Math.min(originalHeightPx, totalHeightPx)}px` }}>
        <AppointmentCard
          time={displayTime}
          duration={durationMin}
          clientName={clientName}
          serviceName={serviceName}
          phoneE164={phoneE164}
          paid={paid}
          onClick={() => {}}
        />
      </div>

      {/* Ghost extension/reduction (lighter tint, NO lines) */}
      {extensionPx !== 0 && (
        <div
          className={`absolute left-0 right-0 ${extensionPx > 0 ? 'bottom-0' : 'top-0'}`}
          style={{
            height: `${Math.abs(extensionPx)}px`,
            pointerEvents: 'none',
            backgroundColor: paid
              ? 'rgba(187, 247, 208, 0.5)' // green-100 ~ 0.5
              : 'rgba(191, 219, 254, 0.5)', // blue-100 ~ 0.5
          }}
        />
      )}

      {/* Bottom resize handle */}
      <div
        className="absolute left-0 right-0 bottom-0 h-2 cursor-ns-resize"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          suppressClick.current = true; // suppress the next click after resize
          onStartResize(app.id, durationMin, e.clientY);
        }}
      />
    </div>
  );
};