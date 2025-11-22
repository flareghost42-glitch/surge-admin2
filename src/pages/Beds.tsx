
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { BedStatus } from '../types';
import { WARDS } from '../constants';
import { UserIcon } from '../components/Icons';

const Beds: React.FC = () => {
  const { state } = useAppContext();
  
  const statusStyles = {
    [BedStatus.Occupied]: "bg-red-900/40 border-red-500 text-red-100 hover:bg-red-900/60",
    [BedStatus.Free]: "bg-green-900/40 border-green-500 text-green-100 hover:bg-green-900/60",
    [BedStatus.Cleaning]: "bg-blue-900/40 border-blue-500 text-blue-100 hover:bg-blue-900/60",
    [BedStatus.Reserved]: "bg-yellow-900/40 border-yellow-500 text-yellow-100 hover:bg-yellow-900/60",
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/80 shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-2">Bed Management</h2>
        <p className="text-gray-400">Visual grid of all hospital beds and their real-time status.</p>
      </div>
      <div className="space-y-8">
        {WARDS.map(ward => (
          <div key={ward} className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/80 shadow-lg">
            <h3 className="text-xl font-semibold mb-4">{ward} Ward</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
              {state.beds.filter(b => b.ward === ward).map(bed => {
                const patient = state.patients.find(p => p.id === bed.patientId);
                return (
                  <div key={bed.id} className="relative group">
                    <div className={`w-full aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-2 transition-all duration-200 shadow-lg ${statusStyles[bed.status]}`}>
                       {bed.status === BedStatus.Occupied && patient ? (
                         <div className="flex flex-col items-center w-full h-full justify-center overflow-hidden">
                           <UserIcon className="w-5 h-5 mb-1 opacity-70 flex-shrink-0" />
                           <span className="text-[10px] font-bold text-center leading-tight line-clamp-2 w-full break-words">
                             {patient.name}
                           </span>
                         </div>
                       ) : (
                         <span className="text-xs font-medium opacity-70">{bed.status}</span>
                       )}
                    </div>
                    <div className="mt-2 text-center">
                        <span className="text-xs text-gray-400 font-mono bg-gray-800 px-2 py-0.5 rounded border border-gray-700 shadow-sm">{bed.id}</span>
                    </div>
                  </div>
                );
              })}
              {state.beds.filter(b => b.ward === ward).length === 0 && (
                  <div className="col-span-full text-gray-500 text-sm italic text-center py-4">
                      No beds configured for this ward.
                  </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
};
export default Beds;
