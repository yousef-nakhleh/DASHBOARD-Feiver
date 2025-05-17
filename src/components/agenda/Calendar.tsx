import React from 'react';

const HOURS = Array.from({ length: 16 }, (_, i) => 6 + i); // 06:00 to 21:00
const BARBERS = ['Staff 1', 'Staff 2'];

const Calendar: React.FC = () => {
  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-[80px_repeat(2,minmax(0,1fr))] w-full border-t border-l border-gray-200">
        {/* Time Labels */}
        <div className="bg-white border-b border-gray-200" />
        {BARBERS.map((barber, index) => (
          <div
            key={index}
            className="bg-white border-b border-r border-gray-200 p-2 text-center font-semibold text-gray-700"
          >
            {barber}
          </div>
        ))}

        {/* Time Rows */}
        {HOURS.map((hour) => (
          <React.Fragment key={hour}>
            {/* Time label */}
            <div className="h-16 border-b border-r border-gray-200 text-xs text-right pr-2 pt-2 text-gray-500">
              {`${hour.toString().padStart(2, '0')}:00`}
            </div>

            {/* One column per barber */}
            {BARBERS.map((_, index) => (
              <div
                key={`${hour}-${index}`}
                className="h-16 border-b border-r border-gray-100 bg-white hover:bg-gray-50"
              ></div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Calendar;