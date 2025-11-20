import React, { useState, useMemo } from 'react';
import { Bed, Patient } from '../types';
import { WARDS } from '../constants';
import { motion } from 'framer-motion';
import { BedIcon } from './Icons';

interface BedAssignmentModalProps {
    patient: Patient;
    availableBeds: Bed[];
    isOpen: boolean;
    onClose: () => void;
    onAssign: (bedId: string) => Promise<void>;
}

const BedAssignmentModal: React.FC<BedAssignmentModalProps> = ({ patient, availableBeds, isOpen, onClose, onAssign }) => {
    const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const bedsByWard = useMemo(() => {
        return WARDS.reduce((acc, ward) => {
            acc[ward] = availableBeds.filter(b => b.ward === ward);
            return acc;
        }, {} as Record<string, Bed[]>);
    }, [availableBeds]);

    const handleAssign = async () => {
        if (!selectedBedId) return;
        setIsSubmitting(true);
        try {
            await onAssign(selectedBedId);
            onClose();
        } catch (error) {
            console.error("Failed to assign bed:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
            >
                <div className="p-6 border-b border-gray-700">
                    <h3 className="text-xl font-bold text-white">Assign Bed to {patient.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">Condition: <span className={`font-semibold ${patient.condition === 'Critical' ? 'text-red-400' : 'text-blue-400'}`}>{patient.condition}</span></p>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {WARDS.map(ward => {
                        const beds = bedsByWard[ward] || [];
                        if (beds.length === 0) return null;
                        
                        return (
                            <div key={ward} className="mb-6 last:mb-0">
                                <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">{ward}</h4>
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                    {beds.map(bed => (
                                        <button
                                            key={bed.id}
                                            onClick={() => setSelectedBedId(bed.id)}
                                            className={`p-3 rounded-lg border text-center transition-all ${
                                                selectedBedId === bed.id 
                                                ? 'bg-blue-600 border-blue-400 text-white ring-2 ring-blue-400/30' 
                                                : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
                                            }`}
                                        >
                                            <BedIcon className="w-6 h-6 mx-auto mb-1" />
                                            <span className="text-xs font-medium block">{bed.id}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                    {availableBeds.length === 0 && (
                         <div className="text-center py-8 text-gray-400">
                             <p>No available beds found.</p>
                         </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-700 bg-gray-800 rounded-b-xl flex justify-end gap-3">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleAssign}
                        disabled={!selectedBedId || isSubmitting}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {isSubmitting ? 'Assigning...' : 'Confirm Assignment'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default BedAssignmentModal;
