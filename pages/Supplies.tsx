
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Supply } from '../types';
import { motion } from 'framer-motion';

const SupplyGauge: React.FC<{ supply: Supply }> = ({ supply }) => {
    const percentage = supply.level;
    const isCritical = percentage < supply.criticalThreshold;
    const color = isCritical ? '#ef4444' : (percentage < 50 ? '#f97316' : '#22c55e');
    
    return (
        <div className="bg-gray-900/50 p-4 rounded-lg text-center border border-gray-700/80">
            <h4 className="font-semibold">{supply.name}</h4>
            <div className="relative w-32 h-32 mx-auto my-4">
                <svg className="w-full h-full" viewBox="0 0 36 36" transform="rotate(-90 18 18)">
                    <circle className="text-gray-700" strokeWidth="3" fill="none"
                        cx="18" cy="18" r="15.9155"
                    />
                    <motion.circle stroke={color} strokeWidth="3" fill="none"
                        strokeLinecap="round"
                        cx="18" cy="18" r="15.9155"
                        strokeDasharray="100 100"
                        initial={{ strokeDashoffset: 100 }}
                        animate={{ strokeDashoffset: 100 - percentage }}
                        transition={{ duration: 1, ease: "circOut" }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold" style={{color}}>{percentage.toFixed(0)}%</span>
                </div>
            </div>
            {isCritical && <p className="text-red-500 text-sm font-bold animate-pulse">LOW STOCK</p>}
        </div>
    )
}

const Supplies: React.FC = () => {
    const { state } = useAppContext();
    const { supplies } = state;

    return (
        <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/80 shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-2">Supply Management</h2>
                <p className="text-gray-400">Real-time levels of essential medical supplies, updated continuously.</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/80 shadow-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {supplies.map(supply => (
                        <SupplyGauge key={supply.id} supply={supply} />
                    ))}
                </div>
            </div>
        </div>
    )
};

export default Supplies;
