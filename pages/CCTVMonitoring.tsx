
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { CCTVEvent } from '../types';
import { motion } from 'framer-motion';

const CameraFeed: React.FC<{ cameraId: string; location: string; event: CCTVEvent | undefined; videoSrc: string }> = ({ cameraId, location, event, videoSrc }) => {
    const isPersonDetection = event?.type === 'Person Detected';
    const riskColor = event ? 
        (isPersonDetection ? 'border-sky-500' : 'border-red-500 shadow-red-500/30') 
        : 'border-gray-700';
    
    return (
        <div className={`relative bg-black aspect-video rounded-lg border-2 ${riskColor} flex flex-col justify-between p-2 overflow-hidden shadow-lg`}>
             <video
                src={videoSrc}
                autoPlay
                loop
                muted
                className="absolute top-0 left-0 w-full h-full object-cover opacity-60"
            />
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-sm text-shadow">{cameraId}</h4>
                    <p className="text-xs text-gray-300 text-shadow">{location}</p>
                </div>
                <div className="flex items-center gap-2">
                   <div className={`w-3 h-3 rounded-full ${event ? (isPersonDetection ? 'bg-sky-500' : 'bg-red-500 animate-pulse') : 'bg-green-400'}`}></div>
                </div>
            </div>

            {event && !isPersonDetection && (
                <>
                <motion.div 
                  className="absolute z-20 border-2 border-red-500 bg-red-500/20"
                  style={{ top: `${20 + Math.random() * 40}%`, left: `${20 + Math.random() * 40}%`, width: '35%', height: '45%'}}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                    <span className="absolute -top-5 left-0 text-xs bg-red-500 text-white px-1">{event.type}</span>
                </motion.div>
                </>
            )}
            {isPersonDetection && event.detectionData?.map((detection: any, index: number) => (
                <motion.div
                    key={index}
                    className="absolute z-20 border-2 border-sky-400 bg-sky-500/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    style={{
                        top: `${detection.box[1]}%`,
                        left: `${detection.box[0]}%`,
                        width: `${detection.box[2]}%`,
                        height: `${detection.box[3]}%`,
                    }}
                >
                     {index === 0 && <span className="absolute -top-5 left-0 text-xs bg-sky-500 text-white px-1">{event.type}</span>}
                </motion.div>
            ))}
        </div>
    );
};

const CCTVMonitoring: React.FC = () => {
    const { state } = useAppContext();
    const { cctvEvents } = state;

    const cameraFeeds = [
        { id: 'CAM-1', location: 'ICU Ward A', video: '/videos/icu1.mp4' },
        { id: 'CAM-2', location: 'Hallway Section 3', video: 'https://www.shutterstock.com/shutterstock/videos/3654955493/preview/stock-footage-high-angle-cctv-footage-with-a-busy-hallway-with-reception-desk-of-a-hospital-building-diverse.mp4' },
        { id: 'CAM-3', location: 'General Ward B', video: '/videos/ward1.mp4' },
        { id: 'CAM-4', location: 'Emergency Entrance', video: 'https://www.shutterstock.com/shutterstock/videos/3654955493/preview/stock-footage-high-angle-cctv-footage-with-a-busy-hallway-with-reception-desk-of-a-hospital-building-diverse.mp4' },
        { id: 'CAM-5', location: 'ICU Ward C', video: '/videos/icu1.mp4' },
        { id: 'CAM-6', location: 'Pediatrics Hallway', video: '/videos/ward1.mp4' },
    ];

    const recentEventsByCamera = cctvEvents.reduce((acc, event) => {
        if (!acc[event.cameraId] || new Date(event.timestamp) > new Date(acc[event.cameraId].timestamp)) {
            acc[event.cameraId] = event;
        }
        return acc;
    }, {} as Record<string, CCTVEvent>);
    
    return (
        <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/80 shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-2">CCTV AI Monitoring</h2>
                <p className="text-gray-400">Live camera feeds with AI vision analytics for fall detection, crowd monitoring, and anomaly alerts.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {cameraFeeds.map(cam => (
                        <CameraFeed key={cam.id} cameraId={cam.id} location={cam.location} event={recentEventsByCamera[cam.id]} videoSrc={cam.video} />
                    ))}
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/80 h-full shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">CCTV Event Feed</h3>
                    <ul className="space-y-3 h-[85%] overflow-y-auto pr-2">
                        {cctvEvents.length > 0 ? cctvEvents.map(event => (
                            <li key={event.id} className="p-3 bg-gray-700/50 rounded-lg border-l-2 border-yellow-500">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold text-sm text-yellow-400">{event.type}</p>
                                    <p className="text-xs text-gray-400">{new Date(event.timestamp).toLocaleTimeString()}</p>
                                </div>
                                <p className="text-xs text-gray-300">{event.cameraId} - {event.location}</p>
                            </li>
                        )) : <p className="text-gray-400 text-center mt-8">No events detected recently.</p>}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default CCTVMonitoring;