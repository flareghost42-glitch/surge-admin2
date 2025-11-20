import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { LineChart, Line, YAxis, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { IotIcon } from '../components/Icons';
import { IoTDevice, Patient } from '../types';
import { AnimatePresence, motion } from 'framer-motion';

const getVitalStatus = (device: IoTDevice) => {
    const { type, lastReading } = device;
    if (type === 'HeartRate' && (lastReading > 120 || lastReading < 50)) return 'abnormal';
    if (type === 'Oxygen' && lastReading < 92) return 'abnormal';
    if (type === 'Temperature' && (lastReading > 100.4 || lastReading < 97)) return 'abnormal';
    if (type === 'BPSystolic' && (lastReading > 140 || lastReading < 110)) return 'abnormal';
    return 'normal';
};

const MiniVitalCard: React.FC<{device: IoTDevice}> = ({ device }) => {
    const { state } = useAppContext();
    const readings = state.iotReadings[device.id] || [];
    const status = getVitalStatus(device);
    const isAbnormal = status === 'abnormal';

    return (
        <div className={`p-3 rounded-lg ${isAbnormal ? 'bg-red-900/30' : 'bg-gray-700/50'}`}>
            <div className="flex justify-between items-center">
                <p className="text-xs text-gray-400">{device.type}</p>
                 <div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
            <div className="my-1">
                <span className={`text-2xl font-bold ${isAbnormal ? 'text-red-400' : 'text-white'}`}>{device.lastReading.toFixed(device.type === 'Temperature' ? 1 : 0)}</span>
                <span className="text-sm text-gray-400 ml-1">{device.unit}</span>
            </div>
             <div className="h-12">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={readings}>
                         <defs>
                            <linearGradient id={`color-${status}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={isAbnormal ? "#ef4444" : "#3b82f6"} stopOpacity={0.4}/>
                                <stop offset="95%" stopColor={isAbnormal ? "#ef4444" : "#3b82f6"} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
                        <Area type="monotone" dataKey="value" stroke={isAbnormal ? '#ef4444' : '#3b82f6'} strokeWidth={2} fill={`url(#color-${status})`} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

const DetailedVitalChart: React.FC<{device: IoTDevice}> = ({ device }) => {
    const { state } = useAppContext();
    const readings = state.iotReadings[device.id] || [];
    const status = getVitalStatus(device);
    const isAbnormal = status === 'abnormal';

    return (
        <div className="bg-gray-900/70 p-4 rounded-lg h-64 flex flex-col">
            <h4 className="font-semibold mb-2">{device.type}</h4>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={readings} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis 
                        dataKey="timestamp" 
                        stroke="#9ca3af" 
                        fontSize={10} 
                        tickFormatter={(ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        minTickGap={40}
                    />
                    <YAxis 
                        stroke="#9ca3af" 
                        fontSize={10} 
                        domain={['dataMin - 2', 'dataMax + 2']}
                        width={40}
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #444' }} 
                        formatter={(value: number) => [value.toFixed(1), device.unit]}
                        labelFormatter={(label) => new Date(label).toLocaleString()}
                    />
                    <Line type="monotone" dataKey="value" stroke={isAbnormal ? '#ef4444' : '#3b82f6'} strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

const PatientVitalsCard: React.FC<{
    patient: Patient;
    devices: IoTDevice[];
    isExpanded: boolean;
    onExpand: (patientId: string) => void;
}> = ({ patient, devices, isExpanded, onExpand }) => {
    
    const overallStatus = useMemo(() => {
        return devices.some(d => getVitalStatus(d) === 'abnormal') ? 'abnormal' : 'normal';
    }, [devices]);

    const isOverallAbnormal = overallStatus === 'abnormal';

    const cardVariants = {
        collapsed: { height: 'auto' },
        expanded: { height: 'auto' }
    };
    
    return (
        <motion.div
            layout
            variants={cardVariants}
            initial="collapsed"
            animate={isExpanded ? "expanded" : "collapsed"}
            transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
            className={`bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border-2 transition-all duration-300 ${isOverallAbnormal ? 'border-red-500/80 shadow-red-500/10' : 'border-gray-700/80'} shadow-lg cursor-pointer overflow-hidden`}
            onClick={() => onExpand(patient.id)}
        >
             {isOverallAbnormal && (
                <div className="absolute top-0 right-0 bottom-0 left-0 border-2 border-red-500 rounded-xl pointer-events-none animate-pulse"></div>
            )}
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-lg font-bold text-white">{patient.name}</h3>
                    <p className="text-sm text-gray-400">Bed: {patient.bedId || 'N/A'} &bull; Condition: {patient.condition}</p>
                </div>
                <IotIcon className={`w-6 h-6 ${isOverallAbnormal ? 'text-red-400' : 'text-sky-400'}`} />
            </div>

            <AnimatePresence initial={false}>
                {!isExpanded ? (
                    <motion.div
                        key="collapsed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-3"
                    >
                        {devices.map(device => <MiniVitalCard key={device.id} device={device} />)}
                    </motion.div>
                ) : (
                    <motion.div
                        key="expanded"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, transition: { delay: 0.2 } }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        {devices.map(device => <DetailedVitalChart key={device.id} device={device} />)}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const IoTMonitoring: React.FC = () => {
    const { state } = useAppContext();
    const { iotDevices, patients } = state;
    const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);

    const devicesByPatient = useMemo(() => {
        return iotDevices.reduce((acc, device) => {
            if (!acc[device.patientId]) {
                acc[device.patientId] = [];
            }
            acc[device.patientId].push(device);
            return acc;
        }, {} as Record<string, IoTDevice[]>);
    }, [iotDevices]);

    const monitoredPatients = useMemo(() => {
        return patients.filter(p => devicesByPatient[p.id]);
    }, [patients, devicesByPatient]);

    const handleExpand = (patientId: string) => {
        setExpandedPatientId(prevId => (prevId === patientId ? null : patientId));
    };

    return (
        <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/80 shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-2">Patient Vitals Monitoring</h2>
                <p className="text-gray-400">Patient-centric view of real-time data from connected medical devices. Click a card to expand.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {monitoredPatients.map(patient => (
                    <PatientVitalsCard 
                        key={patient.id}
                        patient={patient}
                        devices={devicesByPatient[patient.id]}
                        isExpanded={expandedPatientId === patient.id}
                        onExpand={handleExpand}
                    />
                ))}
            </div>
        </div>
    );
};

export default IoTMonitoring;