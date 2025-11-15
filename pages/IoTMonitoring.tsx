import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { LineChart, Line, YAxis, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { IotIcon } from '../components/Icons';
import { IoTDevice, IoTReading } from '../types';
import { AnimatePresence, motion } from 'framer-motion';

const DeviceDetailModal: React.FC<{ device: IoTDevice, readings: IoTReading[], onClose: () => void }> = ({ device, readings, onClose }) => {
    return (
        <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="bg-gray-800 w-full max-w-3xl rounded-xl border border-gray-700 shadow-2xl"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
                <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-white">{device.type} History</h3>
                        <p className="text-sm text-gray-400">Patient #{device.patientId.slice(-4)}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </div>
                <div className="p-6 h-96">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={readings} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                             <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis 
                                dataKey="timestamp" 
                                stroke="#9ca3af" 
                                fontSize={12} 
                                tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                                minTickGap={30}
                            />
                            <YAxis 
                                stroke="#9ca3af" 
                                fontSize={12} 
                                domain={['dataMin - 2', 'dataMax + 2']}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #444' }} 
                                formatter={(value: number) => [value.toFixed(1), device.unit]}
                                labelFormatter={(label) => new Date(label).toLocaleString()}
                            />
                            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </motion.div>
    );
};


const DeviceCard: React.FC<{ device: IoTDevice; onClick: () => void }> = ({ device, onClick }) => {
    const { state } = useAppContext();
    const readings = state.iotReadings[device.id] || [];

    const isAbnormal = (device.type === 'HeartRate' && (device.lastReading > 120 || device.lastReading < 50))
                    || (device.type === 'Oxygen' && device.lastReading < 92)
                    || (device.type === 'Temperature' && (device.lastReading > 100.4 || device.lastReading < 97))
                    || (device.type === 'BPSystolic' && (device.lastReading > 140 || device.lastReading < 110));

    return (
        <div 
            className={`bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border transition-all duration-300 ${isAbnormal ? 'border-red-500 shadow-red-500/20' : 'border-gray-700/80 hover:border-blue-500'} shadow-lg cursor-pointer`}
            onClick={onClick}
        >
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                    <IotIcon className={`w-6 h-6 mr-2 ${isAbnormal ? 'text-red-500' : 'text-blue-500'}`} />
                    <div>
                        <h4 className="font-bold text-white">{device.type}</h4>
                        <p className="text-xs text-gray-400">Patient #{device.patientId.slice(-4)}</p>
                    </div>
                </div>
                <div className={`px-2 py-1 text-xs rounded-full ${device.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {device.status}
                </div>
            </div>
            <div className="text-center my-4">
                <span className={`text-4xl font-bold ${isAbnormal ? 'text-red-500' : 'text-white'}`}>{device.lastReading.toFixed(device.type === 'Temperature' ? 1 : 0)}</span>
                <span className="text-gray-400 ml-1">{device.unit}</span>
            </div>
            <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={readings}>
                        <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #444' }} formatter={(value: number) => value.toFixed(1)} />
                        <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
                        <Line type="monotone" dataKey="value" stroke={isAbnormal ? '#ef4444' : '#3b82f6'} strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const IoTMonitoring: React.FC = () => {
    const { state } = useAppContext();
    const { iotDevices, alerts, iotReadings } = state;
    const [selectedDevice, setSelectedDevice] = useState<IoTDevice | null>(null);
    
    const iotAlerts = alerts.filter(a => a.type === 'IoT');

    return (
        <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/80 shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-2">IoT Medical Device Monitoring</h2>
                <p className="text-gray-400">Real-time readings and alerts from connected medical devices. Click on a device for detailed history.</p>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {iotDevices.map(device => (
                        <DeviceCard key={device.id} device={device} onClick={() => setSelectedDevice(device)} />
                    ))}
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/80 h-full shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">IoT Alerts Panel</h3>
                    <ul className="space-y-3 h-[85%] overflow-y-auto pr-2">
                        {iotAlerts.length > 0 ? iotAlerts.map(alert => (
                            <li key={alert.id} className="p-3 bg-red-900/50 rounded-lg border border-red-700/50">
                                <p className="font-semibold text-sm text-red-300">{alert.message}</p>
                                <p className="text-xs text-red-400/80">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                            </li>
                        )) : <p className="text-gray-400 text-center mt-8">No active alerts.</p>}
                    </ul>
                </div>
            </div>

            <AnimatePresence>
                {selectedDevice && (
                    <DeviceDetailModal 
                        device={selectedDevice}
                        readings={iotReadings[selectedDevice.id] || []}
                        onClose={() => setSelectedDevice(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default IoTMonitoring;