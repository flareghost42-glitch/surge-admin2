import React from 'react';
import { AreaChart, Area, CartesianGrid, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { useAppContext } from '../context/AppContext';
import StatCard from '../components/StatCard';
import { PatientIcon, BedIcon, TaskIcon, EmergencyIcon, IotIcon, StaffIcon, SupplyIcon, SettingsIcon } from '../components/Icons';
import { AlertType, Alert, SurgeLevel, BedStatus } from '../types';
import { motion } from 'framer-motion';

const CCTVMiniFeed: React.FC<{ event?: any }> = ({ event }) => {
    const isPersonDetection = event?.type === 'Person Detected';
    const riskColor = event ? 
        (isPersonDetection ? 'border-sky-500' : 
            (event.riskScore > 0.7 ? 'border-red-500' : 'border-yellow-500')) 
        : 'border-green-500/50';
    return (
        <div className={`relative bg-black aspect-video rounded-md p-1.5 text-center overflow-hidden border-2 ${riskColor}`}>
            <video
                src={'https://www.shutterstock.com/shutterstock/videos/3654955493/preview/stock-footage-high-angle-cctv-footage-with-a-busy-hallway-with-reception-desk-of-a-hospital-building-diverse.mp4'}
                autoPlay
                loop
                muted
                className="absolute top-0 left-0 w-full h-full object-cover opacity-50"
            />
            <div className="relative z-10 flex flex-col justify-between h-full text-xs">
                <div>
                    <p className="font-bold text-left">{event ? event.cameraId : 'CAM-04'}</p>
                    <p className="text-gray-400 text-left text-[10px]">{event ? event.location : 'ICU Entrance'}</p>
                </div>
                <p className={`font-semibold ${event ? (isPersonDetection ? 'text-sky-400' : 'text-red-400') : 'text-green-400'}`}>
                    {event ? event.type : 'Normal'}
                </p>
            </div>
            {event && !isPersonDetection && (
                 <motion.div
                    className="absolute z-20 border-2 border-red-500"
                    style={{ top: '30%', left: '40%', width: '30%', height: '50%' }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                 />
            )}
             {isPersonDetection && event.detectionData?.map((detection: any, index: number) => (
                 <motion.div
                    key={index}
                    className="absolute z-20 border border-sky-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    style={{
                        top: `${detection.box[1]}%`,
                        left: `${detection.box[0]}%`,
                        width: `${detection.box[2]}%`,
                        height: `${detection.box[3]}%`,
                    }}
                 />
            ))}
        </div>
    );
};

const MainCCTVFeed: React.FC<{ location: string; videoSrc: string, event?: any }> = ({ location, videoSrc, event }) => {
    const isPersonDetection = event?.type === 'Person Detected';
    const riskColor = event && event.type !== 'Person Detected' ? 'border-red-500 shadow-red-500/20' : 'border-gray-700/80';
    
    return (
        <div className={`relative bg-black aspect-video rounded-lg p-3 text-left overflow-hidden border-2 ${riskColor} shadow-lg`}>
            <video
                src={videoSrc}
                autoPlay
                loop
                muted
                className="absolute top-0 left-0 w-full h-full object-cover opacity-50"
            />
            <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                    <h4 className="font-bold text-lg text-white">{location}</h4>
                </div>
                {event && (
                    <div className={`${isPersonDetection ? 'bg-blue-900/50' : 'bg-red-900/50'} p-2 rounded-md`}>
                        <p className={`font-semibold ${isPersonDetection ? 'text-blue-300' : 'text-red-300'}`}>{event.type}</p>
                        <p className={`text-xs ${isPersonDetection ? 'text-blue-400' : 'text-red-400'}`}>{new Date(event.timestamp).toLocaleTimeString()}</p>
                    </div>
                )}
            </div>
             {event && !isPersonDetection && (
                 <motion.div
                    className="absolute z-20 border-2 border-red-500/50 bg-red-500/10"
                    style={{ top: '30%', left: '40%', width: '30%', height: '50%' }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                 />
            )}
            {isPersonDetection && event.detectionData?.map((detection: any, index: number) => (
                <motion.div
                    key={index}
                    className="absolute z-20 border-2 border-sky-400 bg-sky-500/20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    style={{
                        top: `${detection.box[1]}%`,
                        left: `${detection.box[0]}%`,
                        width: `${detection.box[2]}%`,
                        height: `${detection.box[3]}%`,
                    }}
                />
            ))}
        </div>
    );
};


const AlertsFeed: React.FC<{ alerts: Alert[] }> = ({ alerts }) => {
    const alertConfig = {
        info: { icon: 'ℹ️', color: 'text-sky-400' },
        warning: { icon: '⚠️', color: 'text-yellow-400' },
        critical: { icon: '🔥', color: 'text-red-400' },
    };

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700/80 shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Live Alerts</h3>
            <ul className="space-y-3 h-48 overflow-y-auto">
                {alerts.length > 0 ? alerts.map(alert => (
                    <li key={alert.id} className="flex items-start p-2 bg-gray-700/50 rounded-md">
                        <span className={`mr-2 ${alertConfig[alert.severity]?.color}`}>{alertConfig[alert.severity]?.icon}</span>
                        <p className="text-sm text-gray-300">{alert.message}</p>
                    </li>
                )) : <p className="text-sm text-gray-500 text-center pt-8">No active alerts.</p>}
            </ul>
        </div>
    );
};


const Dashboard: React.FC = () => {
    const { state } = useAppContext();
    const { 
        patients, tasks, emergencies, beds, patientInflow, 
        surgeLevel, aiRecommendations, cctvEvents, iotDevices, alerts
    } = state;

    const occupiedBeds = beds.filter(b => b.status === BedStatus.Occupied).length;
    const bedAvailability = beds.length > 0 ? ((beds.length - occupiedBeds) / beds.length * 100).toFixed(1) : '0.0';
    
    const surgeIndicatorStyle = {
        [SurgeLevel.Normal]: { color: 'bg-green-500', shadow: 'shadow-green-500/40' },
        [SurgeLevel.Moderate]: { color: 'bg-yellow-500', shadow: 'shadow-yellow-500/40' },
        [SurgeLevel.High]: { color: 'bg-orange-500', shadow: 'shadow-orange-500/40' },
        [SurgeLevel.Critical]: { color: 'bg-red-500', shadow: 'shadow-red-500/40' },
    };

    const recommendationConfig = {
        STAFF: { icon: StaffIcon, color: 'text-sky-400' },
        PATIENT_FLOW: { icon: PatientIcon, color: 'text-blue-400' },
        SUPPLY: { icon: SupplyIcon, color: 'text-green-400' },
        OPERATIONS: { icon: SettingsIcon, color: 'text-purple-400' },
        GENERAL: { icon: IotIcon, color: 'text-gray-400' }
    };
    
    const priorityConfig: { [key: string]: string } = {
        high: 'border-red-500',
        medium: 'border-orange-500',
        low: 'border-blue-500',
    };
    
    const latestWaitingRoomEvent = cctvEvents
        .filter(e => e.location === 'Waiting Room')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    const latestEntryEvent = cctvEvents
        .filter(e => e.location === 'Hospital Entry')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={PatientIcon} title="Total Patients" value={String(patients.length)} color="#3b82f6" />
                <StatCard icon={BedIcon} title="Bed Availability" value={`${bedAvailability}%`} color="#22c55e" />
                <StatCard icon={TaskIcon} title="Pending Tasks" value={String(tasks.length)} color="#f97316" />
                <StatCard icon={EmergencyIcon} title="Active Emergencies" value={String(emergencies.length)} color="#ef4444" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/80 shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">Patient Inflow (Last 24h)</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={patientInflow} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
                                <YAxis stroke="#9ca3af" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #444' }} />
                                <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorInflow)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/80 text-center shadow-lg">
                        <h3 className="text-lg font-semibold text-white mb-2">Surge Indicator</h3>
                        <motion.div 
                          className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center ${surgeIndicatorStyle[surgeLevel].color} ${surgeIndicatorStyle[surgeLevel].shadow}`}
                          animate={{ scale: [1, 1.05, 1], boxShadow: `0 0 15px ${surgeIndicatorStyle[surgeLevel].color.replace('bg-', '')}`}}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <span className="text-white font-bold text-xl drop-shadow-md">{surgeLevel}</span>
                        </motion.div>
                    </div>
                </div>
            </div>

            {aiRecommendations.length > 0 && (
                <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/80 shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">Operational Recommendations</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {aiRecommendations.slice(0, 3).map(rec => {
                            const Icon = recommendationConfig[rec.category]?.icon || recommendationConfig.GENERAL.icon;
                            const iconColor = recommendationConfig[rec.category]?.color || recommendationConfig.GENERAL.color;
                            const priorityBorder = priorityConfig[rec.priority] || 'border-gray-600';

                            return (
                                <div key={rec.id} className={`bg-gray-900/50 p-4 rounded-lg border-l-4 ${priorityBorder}`}>
                                    <div className="flex items-start gap-4">
                                        <Icon className={`w-8 h-8 flex-shrink-0 mt-1 ${iconColor}`} />
                                        <div>
                                            <p className="text-sm text-gray-200 leading-relaxed">{rec.text}</p>
                                            <div className="mt-2 flex items-center justify-between">
                                               <span className="text-xs font-semibold uppercase text-gray-400">{rec.category}</span>
                                               <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-gray-700 ${priorityConfig[rec.priority]?.replace('border-', 'text-')}`}>{rec.priority}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/80 shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Main CCTV Feeds</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <MainCCTVFeed location="Waiting Room" videoSrc="https://www.shutterstock.com/shutterstock/videos/3654955493/preview/stock-footage-high-angle-cctv-footage-with-a-busy-hallway-with-reception-desk-of-a-hospital-building-diverse.mp4" event={latestWaitingRoomEvent} />
                    <MainCCTVFeed location="Hospital Entry" videoSrc="https://www.shutterstock.com/shutterstock/videos/3654955493/preview/stock-footage-high-angle-cctv-footage-with-a-busy-hallway-with-reception-desk-of-a-hospital-building-diverse.mp4" event={latestEntryEvent} />
                </div>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <AlertsFeed alerts={alerts} />
                <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700/80 shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">Mini CCTV Live Previews</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <CCTVMiniFeed event={cctvEvents.find(e => e.cameraId === 'CAM-1')} />
                        <CCTVMiniFeed event={cctvEvents.find(e => e.cameraId === 'CAM-3')} />
                    </div>
                </div>
                 <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700/80 shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">IoT Device Quick Status</h3>
                     <ul className="space-y-2">
                        {iotDevices.slice(0, 3).map(device => {
                            const isAbnormal = (device.type === 'HeartRate' && (device.lastReading > 120 || device.lastReading < 50)) || (device.type === 'Oxygen' && device.lastReading < 92);
                            return (
                                <li key={device.id} className={`flex justify-between items-center p-2 rounded-md ${isAbnormal ? 'bg-red-900/50' : 'bg-gray-700/50'}`}>
                                    <div className="flex items-center">
                                        <IotIcon className={`w-5 h-5 mr-2 ${isAbnormal ? 'text-red-400' : 'text-blue-400'}`} />
                                        <p className="text-sm">P#${device.patientId.slice(-4)} ${device.type === 'HeartRate' ? 'HR' : 'O2'}</p>
                                    </div>
                                    <p className={`text-sm font-mono ${isAbnormal ? 'text-red-400' : 'text-white'}`}>{device.lastReading} {device.unit}</p>
                                    <div className={`w-3 h-3 rounded-full ${device.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                </li>
                            );
                        })}
                     </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;