
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Patient } from '../types';

const Patients: React.FC = () => {
  const { state } = useAppContext();
  
  const getConditionColor = (condition: Patient['condition']) => {
    switch (condition) {
        case 'Critical': return 'text-red-500';
        case 'Guarded': return 'text-yellow-500';
        case 'Stable': return 'text-green-500';
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/80 shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-2">Patient Directory</h2>
        <p className="text-gray-400">Search and view details for all admitted patients.</p>
      </div>
      <div className="bg-gray-800/50 backdrop-blur-sm p-2 rounded-xl border border-gray-700/80 shadow-lg">
        <table className="w-full text-left">
          <thead className="border-b border-gray-700">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Age</th>
              <th className="p-4">Bed</th>
              <th className="p-4">Condition</th>
              <th className="p-4">Vitals (HR/O2)</th>
              <th className="p-4">Admission Date</th>
            </tr>
          </thead>
          <tbody>
            {state.patients.map(p => (
              <tr key={p.id} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50">
                <td className="p-4 font-medium">{p.name}</td>
                <td className="p-4 text-gray-400">{p.age}</td>
                <td className="p-4 text-gray-400">{p.bedId || 'N/A'}</td>
                <td className={`p-4 font-semibold ${getConditionColor(p.condition)}`}>{p.condition}</td>
                <td className="p-4 text-gray-300 font-mono">{p.vitals.heartRate.toFixed(0)} bpm / {p.vitals.oxygenLevel.toFixed(0)}%</td>
                <td className="p-4 text-gray-400">{new Date(p.admissionDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
};
export default Patients;
