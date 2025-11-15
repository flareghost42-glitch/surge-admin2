import React from 'react';
import { useAppContext } from '../context/AppContext';
import IndiaMap from '../components/IndiaMap';

const Forecast: React.FC = () => {
    const { state } = useAppContext();
    const { forecast, forecastCommentary } = state;
    
    const highRiskRegions = forecast.filter(f => f.riskLevel > 0.5).sort((a, b) => b.riskLevel - a.riskLevel);

    return (
        <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/80 shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-2">Surge Forecast & Analysis</h2>
                <p className="text-gray-400">National forecast updated based on simulation data to predict potential patient surges.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/80 shadow-lg">
                    <IndiaMap data={forecast} />
                </div>
                
                <div className="space-y-6">
                    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/80 shadow-lg">
                        <h3 className="text-lg font-semibold text-white mb-4">Forecast Analysis</h3>
                        <div className="bg-gray-900/50 p-4 rounded-lg min-h-[100px]">
                           <p className="text-sky-300">
                               {forecastCommentary}
                           </p>
                        </div>
                    </div>
                    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/80 shadow-lg">
                        <h3 className="text-lg font-semibold text-white mb-4">High-Risk Regions</h3>
                        <ul className="space-y-2 h-72 overflow-y-auto">
                            {highRiskRegions.length > 0 ? highRiskRegions.map(region => (
                                <li key={region.region} className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                                    <span className="font-medium">{region.region}</span>
                                    <span className="font-semibold text-red-400">
                                        {(region.riskLevel * 100).toFixed(1)}% Risk
                                    </span>
                                </li>
                            )) : (
                                <p className="text-gray-400 text-center mt-8">No high-risk regions detected.</p>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Forecast;