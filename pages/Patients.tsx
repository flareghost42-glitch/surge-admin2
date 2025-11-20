import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Patient, BedStatus } from '../types';
import { assignPatientToBed } from '../services/adminService';
import BedAssignmentModal from '../components/BedAssignmentModal';

const Patients: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  const getConditionColor = (condition: Patient['condition']) => {
    switch (condition) {
        case 'Critical': return 'text-red-500';
        case 'Guarded': return 'text-yellow-500';
        case 'Stable': return 'text-green-500';
        default: return 'text-gray-400';
    }
  }

  const handleAssignBed = async (bedId: string) => {
      if (!selectedPatient) return;
      try {
          await assignPatientToBed(selectedPatient.id, bedId);
          
          // Update local state optimistically
          const updatedPatient = { ...selectedPatient, bedId };
          const updatedBed = state.beds.find(b => b.id === bedId);
          
          dispatch({ type: 'UPDATE_PATIENT', payload: updatedPatient });
          
          if (updatedBed) {
              dispatch({ 
                  type: 'UPDATE_BED', 
                  payload: { ...updatedBed, status: BedStatus.Occupied, patientId: selectedPatient.id } 
              });
          }
          
      } catch (error) {
          console.error("Error assigning bed", error);
          alert("Failed to assign bed. Please try again.");
      }
  };

  const availableBeds = state.beds.filter(b => b.status === BedStatus.Free);

  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/80 shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-2">Patient Directory</h2>
        <p className="text-gray-400">Search and view details for all admitted patients. Assign beds to new admissions.</p>
      </div>
      <div className="bg-gray-800/50 backdrop-blur-sm p-2 rounded-xl border border-gray-700/80 shadow-lg">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead className="border-b border-gray-700">
                <tr>
                <th className="p-4 whitespace-nowrap">Name</th>
                <th className="p-4 whitespace-nowrap">Age</th>
                <th className="p-4 whitespace-nowrap">Bed</th>
                <th className="p-4 whitespace-nowrap">Condition</th>
                <th className="p-4 whitespace-nowrap">Vitals (HR/O2)</th>
                <th className="p-4 whitespace-nowrap">Admission Date</th>
                <th className="p-4 whitespace-nowrap">Actions</th>
                </tr>
            </thead>
            <tbody>
                {state.patients.map(p => (
                <tr key={p.id} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50 transition-colors">
                    <td className="p-4 font-medium">{p.name}</td>
                    <td className="p-4 text-gray-400">{p.age}</td>
                    <td className="p-4">
                        {p.bedId ? (
                            <span className="px-2 py-1 bg-gray-700 rounded text-sm">{p.bedId}</span>
                        ) : (
                            <span className="text-orange-400 text-sm italic">Unassigned</span>
                        )}
                    </td>
                    <td className={`p-4 font-semibold ${getConditionColor(p.condition)}`}>{p.condition}</td>
                    <td className="p-4 text-gray-300 font-mono">
                        {p.vitals ? `${p.vitals.heartRate.toFixed(0)} bpm / ${p.vitals.oxygenLevel.toFixed(0)}%` : 'N/A'}
                    </td>
                    <td className="p-4 text-gray-400">{new Date(p.admissionDate).toLocaleDateString()}</td>
                    <td className="p-4">
                        {!p.bedId && (
                            <button 
                                onClick={() => setSelectedPatient(p)}
                                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md transition-colors"
                            >
                                Assign Bed
                            </button>
                        )}
                         {p.bedId && (
                             <button className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-md transition-colors">
                                 Details
                             </button>
                         )}
                    </td>
                </tr>
                ))}
                {state.patients.length === 0 && (
                    <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-500">
                            No patients found in database.
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>
      
      {selectedPatient && (
          <BedAssignmentModal 
            isOpen={!!selectedPatient}
            patient={selectedPatient}
            availableBeds={availableBeds}
            onClose={() => setSelectedPatient(null)}
            onAssign={handleAssignBed}
          />
      )}
    </div>
  )
};
export default Patients;