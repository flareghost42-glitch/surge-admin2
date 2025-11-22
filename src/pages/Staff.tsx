
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { StaffStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Staff: React.FC = () => {
  const { state } = useAppContext();
  
  const statusColors = {
    [StaffStatus.Active]: "bg-green-500",
    [StaffStatus.Busy]: "bg-orange-500",
    [StaffStatus.Offline]: "bg-gray-500",
  }

  const getWorkloadColor = (workload: number) => {
    if (workload > 80) return 'text-red-400';
    if (workload > 60) return 'text-orange-400';
    return 'text-green-400';
  }

  const getBarColor = (workload: number) => {
    if (workload > 80) return '#ef4444'; // red-500
    if (workload > 60) return '#f97316'; // orange-500
    return '#22c55e'; // green-500
  }

  const chartData = [...state.staff]
    .sort((a, b) => b.workload - a.workload)
    .map(s => ({
      name: s.name,
      workload: s.workload,
      role: s.role
    }));

  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/80 shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-2">Staff Management</h2>
        <p className="text-gray-400">Real-time overview of all staff members, their status, and workload.</p>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/80 shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Workload Distribution</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#9ca3af" 
                tick={{ fill: '#9ca3af', fontSize: 12 }} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#9ca3af" 
                tick={{ fill: '#9ca3af', fontSize: 12 }} 
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }}
                itemStyle={{ color: '#e5e7eb' }}
                cursor={{ fill: '#374151', opacity: 0.4 }}
              />
              <Bar dataKey="workload" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.workload)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm p-2 rounded-xl border border-gray-700/80 shadow-lg overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="p-4 text-gray-300 font-medium">Name</th>
                <th className="p-4 text-gray-300 font-medium">Role</th>
                <th className="p-4 text-gray-300 font-medium">Status</th>
                <th className="p-4 text-gray-300 font-medium">Workload</th>
                <th className="p-4 text-gray-300 font-medium">Tasks Completed</th>
                <th className="p-4 text-gray-300 font-medium">Shift End</th>
              </tr>
            </thead>
            <tbody>
              {state.staff.map(member => (
                <tr key={member.id} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50">
                  <td className="p-4 font-medium text-white">{member.name}</td>
                  <td className="p-4 text-gray-400">{member.role}</td>
                  <td className="p-4">
                    <span className={`flex items-center gap-2 text-sm`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${statusColors[member.status]}`}></span>
                      <span className="text-gray-300">{member.status}</span>
                    </span>
                  </td>
                  <td className={`p-4 font-mono font-semibold ${getWorkloadColor(member.workload)}`}>
                      {member.workload.toFixed(0)}%
                  </td>
                  <td className="p-4 text-gray-300">{member.tasksCompleted}</td>
                  <td className="p-4 text-gray-400">{new Date(member.shiftEnd).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </div>
  )
};
export default Staff;
