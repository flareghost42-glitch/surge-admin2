
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { StaffStatus } from '../types';

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

  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/80 shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-2">Staff Management</h2>
        <p className="text-gray-400">Real-time overview of all staff members, their status, and workload.</p>
      </div>
      <div className="bg-gray-800/50 backdrop-blur-sm p-2 rounded-xl border border-gray-700/80 shadow-lg">
          <table className="w-full text-left">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Workload</th>
                <th className="p-4">Tasks Completed</th>
                <th className="p-4">Shift End</th>
              </tr>
            </thead>
            <tbody>
              {state.staff.map(member => (
                <tr key={member.id} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50">
                  <td className="p-4 font-medium">{member.name}</td>
                  <td className="p-4 text-gray-400">{member.role}</td>
                  <td className="p-4">
                    <span className={`flex items-center gap-2 text-sm`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${statusColors[member.status]}`}></span>
                      {member.status}
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
