
import React from 'react';

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  change?: string;
  changeType?: 'increase' | 'decrease';
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, change, changeType, color }) => {
  const changeColor = changeType === 'increase' ? 'text-red-500' : 'text-green-500';

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-5 rounded-xl border border-gray-700/80 flex items-center shadow-lg hover:shadow-blue-500/10 transition-shadow duration-300">
      <div className={`p-3 rounded-lg bg-gray-700`} style={{color}}>
        <Icon className="w-7 h-7" />
      </div>
      <div className="ml-4">
        <p className="text-sm text-gray-400 font-medium">{title}</p>
        <div className="flex items-baseline">
          <p className="text-2xl font-bold text-white">{value}</p>
          {change && (
            <span className={`ml-2 text-sm font-semibold ${changeColor}`}>
              {change}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
