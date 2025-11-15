
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { BedStatus } from '../types';
import { WARDS } from '../constants';

const Beds: React.FC = () => {
  const { state } = useAppContext();
  
  const statusStyles = {
    [BedStatus.Occupied]: "bg-red-600/80 border-red-500",
    [BedStatus.Free]: "bg-green-600/80 border-green-500",
    [BedStatus.Cleaning]: "bg-blue-600/80 border-blue-500",
    [BedStatus.Reserved]: "bg-yellow-600/80 border-yellow-500",
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
            <div className="grid grid-cols-5 md:grid-cols-10 gap-4">
              {state.beds.filter(b => b.ward === ward).map(bed => (
                <div key={bed.id} className="text-center group">
                  <div className={`w-full aspect-square rounded-md flex items-center justify-center border-2 ${statusStyles[bed.status]} transition-transform duration-200 group-hover:scale-110`}>
                  </div>
                  <p className="text-xs mt-1.5 text-gray-400">{bed.id}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
};
export default Beds;
