import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  bgColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  change, 
  changeType = 'neutral',
  bgColor = 'bg-white'
}) => {
  return (
    <div className={`${bgColor} rounded-lg shadow p-5 flex items-center`}>
      <div className="mr-4 p-3 rounded-full bg-opacity-10 bg-blue-500">
        {icon}
      </div>
      <div>
        <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-semibold">{value}</p>
        {change && (
          <p className={`text-xs mt-1 ${
            changeType === 'increase' ? 'text-green-600' : 
            changeType === 'decrease' ? 'text-red-600' : 
            'text-gray-500'
          }`}>
            {changeType === 'increase' ? '↑' : 
             changeType === 'decrease' ? '↓' : 
             '–'} {change}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;