import React, { useState } from 'react';
import { ForecastData } from '../types';
import { AnimatePresence, motion } from 'framer-motion';

// Minimized path data for Indian states and UTs.
const STATE_PATHS = [
  { id: "AP", name: "Andhra Pradesh", d: "M278 85l-8-3-12 5-9 14 2 10 13 4 10-2 1-13-3-15z" },
  { id: "AR", name: "Arunachal Pradesh", d: "M419 13l-10 18-13 4-15-4-8-10 1-11 15-8 17 4z" },
  { id: "AS", name: "Assam", d: "M404 43l-11 12-21 2-13-4-4-8 10-8 15-1 12 2z" },
  { id: "BR", name: "Bihar", d: "M328 47l-13 13-20-2-12-10 4-13 18-3 15 5z" },
  { id: "CT", name: "Chhattisgarh", d: "M268 76l-11 19-14 3-10-12 2-14 16-6 12 3z" },
  { id: "GA", name: "Goa", d: "M163 128l-3 4-4-2-1-4 3-2 5 0z" },
  { id: "GJ", name: "Gujarat", d: "M92 68l-16 25-13-3-8-15 4-18 17-4 15 8z" },
  { id: "HR", name: "Haryana", d: "M178 30l-7 11-12 2-8-6 1-10 13-3 11 4z" },
  { id: "HP", name: "Himachal Pradesh", d: "M193 16l-8 13-14 2-10-8 3-12 15-3 12 5z" },
  { id: "JH", name: "Jharkhand", d: "M308 61l-10 14-16 2-11-10 2-12 15-4 14 3z" },
  { id: "KA", name: "Karnataka", d: "M183 110l-14 20-15-2-9-16 3-15 17-3 15 5z" },
  { id: "KL", name: "Kerala", d: "M180 162l-6 13-10-1-6-15 2-11 9-3 8 5z" },
  { id: "MP", name: "Madhya Pradesh", d: "M200 70l-10 22-20 3-15-15 4-20 22-5 16 8z" },
  { id: "MH", name: "Maharashtra", d: "M168 88l-12 24-22 2-15-18 4-20 24-5 18 7z" },
  { id: "MN", name: "Manipur", d: "M414 68l-4 11-10 2-7-8 1-9 9-2 8 3z" },
  { id: "ML", name: "Meghalaya", d: "M380 55l-9 10-14 2-9-7 2-10 13-2 12 2z" },
  { id: "MZ", name: "Mizoram", d: "M402 78l-5 12-10 3-7-9 1-10 10-3 8 4z" },
  { id: "NL", name: "Nagaland", d: "M412 55l-7 10-12 2-8-7 2-10 14-2 10 3z" },
  { id: "OR", name: "Odisha", d: "M295 86l-10 17-16 3-11-13 2-15 17-5 15 4z" },
  { id: "PB", name: "Punjab", d: "M163 20l-7 12-12 2-9-7 2-11 14-3 11 5z" },
  { id: "RJ", name: "Rajasthan", d: "M138 52l-15 24-20-2-12-18 5-20 22-4 18 7z" },
  { id: "SK", name: "Sikkim", d: "M350 32l-4 8-10 1-6-6 1-8 8-2 7 3z" },
  { id: "TN", name: "Tamil Nadu", d: "M207 150l-10 18-15-1-9-15 3-14 16-3 13 5z" },
  { id: "TG", name: "Telangana", d: "M220 100l-8 15-14 2-10-12 2-13 15-4 12 3z" },
  { id: "TR", name: "Tripura", d: "M388 74l-4 9-9 2-6-7 1-8 8-2 7 3z" },
  { id: "UP", name: "Uttar Pradesh", d: "M240 45l-12 18-18 2-12-14 4-16 20-4 15 6z" },
  { id: "UT", name: "Uttarakhand", d: "M218 25l-9 14-14 2-9-9 3-13 15-4 12 5z" },
  { id: "WB", name: "West Bengal", d: "M335 65l-8 15-16 2-10-11 3-14 16-4 13 3z" },
  { id: "AN", name: "Andaman and Nicobar Islands", d: "M400 150l-2 5-4-1-1-5 3-1 4 2z" },
  { id: "CH", name: "Chandigarh", d: "M175 25l-2 3-3-1-1-3 2-1 4 2z" },
  { id: "DN", name: "Dadra and Nagar Haveli and Daman and Diu", d: "M130 98 l-2 4-4-1-1-4 3-1 4 2z" },
  { id: "DL", name: "Delhi", d: "M188 40l-3 4-4-1-1-4 3-1 5 2z" },
  { id: "JK", name: "Jammu and Kashmir", d: "M160 2l-10 12-15 2-10-9 4-12 16-3 13 5z" },
  { id: "LA", name: "Ladakh", d: "M190 -10l10 15-5 10-15 5-10-10 5-15 15-5z" },
  { id: "LD", name: "Lakshadweep", d: "M130 150l-3 5-4-2-1-5 3-2 5 2z" },
  { id: "PY", name: "Puducherry", d: "M230 155 l-2 4-4-1-1-4 3-1 4 2z" },
];

const getColorFromRisk = (riskLevel: number) => {
    if (riskLevel > 0.7) return '#e74c3c'; // critical
    if (riskLevel > 0.5) return '#e67e22'; // high
    if (riskLevel > 0.3) return '#f1c40f'; // moderate
    return '#2ecc71'; // low
};

const Legend: React.FC = () => {
    const legendItems = [
        { color: '#2ecc71', label: 'Low (<30%)' },
        { color: '#f1c40f', label: 'Moderate (30-50%)' },
        { color: '#e67e22', label: 'High (50-70%)' },
        { color: '#e74c3c', label: 'Critical (>70%)' },
    ];
    return (
        <div className="absolute bottom-4 right-4 bg-gray-900/70 backdrop-blur-sm p-3 rounded-lg border border-gray-700 text-xs">
            <p className="font-bold mb-2 text-white">Risk Level</p>
            <ul className="space-y-1">
                {legendItems.map(item => (
                    <li key={item.label} className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                        <span className="text-gray-300">{item.label}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};


const IndiaMap: React.FC<{ data: ForecastData[] }> = ({ data }) => {
    const [hoveredState, setHoveredState] = useState<{ name: string; risk: number; x: number; y: number } | null>(null);

    const dataMap = React.useMemo(() => data.reduce((acc, item) => {
        acc[item.region] = item.riskLevel;
        return acc;
    }, {} as Record<string, number>), [data]);

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if(hoveredState){
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            setHoveredState(s => s ? { ...s, x: x + 10, y: y + 10 } : null);
        }
    };
    
    return (
        <div className="relative w-full h-full flex items-center justify-center">
             <svg 
                viewBox="-10 -15 450 200" 
                className="w-full h-full"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredState(null)}
            >
                <g>
                    {STATE_PATHS.map(state => {
                        const riskLevel = dataMap[state.name] || 0;
                        const color = getColorFromRisk(riskLevel);
                        return (
                            <path
                                key={state.id}
                                d={state.d}
                                fill={color}
                                stroke="#121212"
                                strokeWidth="0.5"
                                className="transition-opacity duration-200"
                                onMouseEnter={(e) => {
                                     const rect = (e.target as SVGPathElement).closest('svg')?.getBoundingClientRect();
                                     if (rect) {
                                         const x = e.clientX - rect.left;
                                         const y = e.clientY - rect.top;
                                         setHoveredState({ name: state.name, risk: riskLevel * 100, x: x + 10, y: y + 10 });
                                     }
                                }}
                                style={{ opacity: hoveredState && hoveredState.name !== state.name ? 0.5 : 1}}
                            />
                        );
                    })}
                </g>
            </svg>
            <AnimatePresence>
            {hoveredState && (
                <motion.div
                    className="absolute bg-gray-900/80 text-white text-sm px-3 py-1.5 rounded-md pointer-events-none border border-gray-600 shadow-lg"
                    style={{ left: hoveredState.x, top: hoveredState.y, transform: 'translateY(-100%)' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                >
                    <p className="font-bold">{hoveredState.name}</p>
                    <p>Risk: <span className="font-semibold">{hoveredState.risk.toFixed(1)}%</span></p>
                </motion.div>
            )}
            </AnimatePresence>
            <Legend />
        </div>
    );
};

export default IndiaMap;
