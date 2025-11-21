import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { EmergencySeverity } from '../types';
import { supabase } from '../lib/supabase';

const Emergency: React.FC = () => {
    const { state } = useAppContext();
    const [isSimulating, setIsSimulating] = useState(false);

    const sortedEmergencies = [...state.emergencies].sort((a, b) => {
        const severityOrder = { [EmergencySeverity.Critical]: 4, [EmergencySeverity.High]: 3, [EmergencySeverity.Medium]: 2, [EmergencySeverity.Low]: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity] || b.timestamp.getTime() - a.timestamp.getTime();
    });

    const severityStyles = {
        [EmergencySeverity.Critical]: "bg-red-800/50 border-red-500",
        [EmergencySeverity.High]: "bg-orange-800/50 border-orange-500",
        [EmergencySeverity.Medium]: "bg-yellow-800/50 border-yellow-500",
        [EmergencySeverity.Low]: "bg-blue-800/50 border-blue-500",
    }
     const severityBadgeStyles = {
        [EmergencySeverity.Critical]: "bg-red-500",
        [EmergencySeverity.High]: "bg-orange-500",
        [EmergencySeverity.Medium]: "bg-yellow-500",
        [EmergencySeverity.Low]: "bg-blue-500",
    }

    const simulateStaffTrigger = async (type: string, room: string) => {
        setIsSimulating(true);
        try {
            await supabase.from('emergencies').insert({
                type: type,
                room: room,
                triggered_by: 'Nurse-APP-01',
                status: 'Active',
                created_at: new Date().toISOString()
            });
            // UI update is handled by realtime subscription in AppContext/Layout
        } catch (e) {
            console.error("Simulation failed", e);
        } finally {
            setIsSimulating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/80 shadow-lg">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Emergency Management</h2>
                    <p className="text-gray-400">Live feed of all active emergencies.</p>
                </div>
                
                {/* Simulation Controls - mimicking the Staff App */}
                <div className="flex flex-wrap gap-3 bg-gray-900 p-3 rounded-lg border border-gray-700">
                    <p className="w-full text-xs text-gray-500 uppercase font-bold mb-1">Simulate Staff App Trigger:</p>
                    <button 
                        onClick={() => simulateStaffTrigger('Code Blue', 'ICU-04')}
                        disabled={isSimulating}
                        className="bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-md text-sm font-bold transition-colors"
                    >
                        🚨 Code Blue (ICU)
                    </button>
                    <button 
                        onClick={() => simulateStaffTrigger('Fall Detected', 'Hallway B')}
                        disabled={isSimulating}
                        className="bg-orange-600 hover:bg-orange-500 text-white px-3 py-2 rounded-md text-sm font-bold transition-colors"
                    >
                        🤕 Fall (Hallway)
                    </button>
                    <button 
                        onClick={() => simulateStaffTrigger('Staff Assistance', 'Ward A')}
                        disabled={isSimulating}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-md text-sm font-bold transition-colors"
                    >
                        👋 Assistance (Ward)
                    </button>
                </div>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/80 shadow-lg">
                <ul className="space-y-4">
                    {sortedEmergencies.length > 0 ? sortedEmergencies.map(e => (
                        <li key={e.id} className={`p-4 rounded-lg border-l-4 ${severityStyles[e.severity]}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-lg font-bold">{e.type}</p>
                                    <p className="text-sm text-gray-400">{e.location}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full text-white ${severityBadgeStyles[e.severity]}`}>{e.severity}</span>
                                    <p className="text-xs text-gray-500 mt-1">{new Date(e.timestamp).toLocaleString()}</p>
                                </div>
                            </div>
                            <p className="mt-2 text-gray-300">{e.details}</p>
                            <div className="mt-3 pt-3 border-t border-gray-700/50 flex justify-between items-center">
                                <p className="text-xs text-gray-400">Assigned: {e.assignedStaff.length > 0 ? e.assignedStaff.join(', ') : 'Pending Assignment'}</p>
                                <button className="text-xs bg-sky-600 hover:bg-sky-500 text-white px-2 py-1 rounded">Link CCTV</button>
                            </div>
                        </li>
                    )) : (
                        <p className="text-center text-gray-500 py-8">No active emergencies.</p>
                    )}
                </ul>
            </div>
        </div>
    )
};

export default Emergency;