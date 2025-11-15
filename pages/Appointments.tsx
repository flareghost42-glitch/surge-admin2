
import React from 'react';
import { useAppContext } from '../context/AppContext';

const Appointments: React.FC = () => {
    const { state } = useAppContext();

    return (
        <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h2 className="text-2xl font-bold text-white mb-2">Appointments</h2>
                <p className="text-gray-400">Calendar view of scheduled appointments.</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center">
                 <h3 className="text-lg font-semibold text-white">Calendar View</h3>
                 <div className="mt-4 h-96 flex items-center justify-center bg-gray-900 rounded-lg">
                     <p className="text-gray-500">Appointments Calendar coming soon.</p>
                 </div>
            </div>
        </div>
    )
};

export default Appointments;
