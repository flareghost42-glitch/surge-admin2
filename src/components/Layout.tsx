
import React, { useState } from 'react';
import Header from './Header';
import { Pages, useAppContext } from '../context/AppContext';
import { EmergencySeverity, TaskStatus } from '../types';
import { 
  DashboardIcon, ForecastIcon, CctvIcon, IotIcon, EmergencyIcon, StaffIcon, PatientIcon, 
  TaskIcon, AppointmentIcon, SupplyIcon, BedIcon, SettingsIcon, ChatIcon 
} from './Icons';
import Dock from './Dock';
import { EmergencyAlert } from './EmergencyAlert';
import AIChat from './AIChat';


interface LayoutProps {
  children: React.ReactNode;
  activePage: Pages;
  setActivePage: (page: Pages) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
  { id: 'forecast', label: 'Forecast', icon: ForecastIcon },
  { id: 'cctvMonitoring', label: 'CCTV Monitoring', icon: CctvIcon },
  { id: 'iotMonitoring', label: 'IoT Monitoring', icon: IotIcon },
  { id: 'emergency', label: 'Emergency', icon: EmergencyIcon },
  { id: 'staff', label: 'Staff', icon: StaffIcon },
  { id: 'patients', label: 'Patients', icon: PatientIcon },
  { id: 'tasks', label: 'Tasks', icon: TaskIcon },
  { id: 'appointments', label: 'Appointments', icon: AppointmentIcon },
  { id: 'supplies', label: 'Supplies', icon: SupplyIcon },
  { id: 'beds', label: 'Beds', icon: BedIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
] as const;

const Layout: React.FC<LayoutProps> = ({ children, activePage, setActivePage }) => {
  const { state } = useAppContext();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const criticalEmergencies = state.emergencies.filter(e => e.severity === EmergencySeverity.Critical).length;
  const pendingTasks = state.tasks.filter(t => t.status === TaskStatus.Pending).length;

  const dockItems = [
      ...navItems.map(item => ({
          icon: <item.icon className="w-full h-full p-2" />,
          label: item.label,
          onClick: () => setActivePage(item.id),
          badgeCount: item.id === 'emergency' ? criticalEmergencies :
                      item.id === 'tasks' ? pendingTasks : undefined,
      })),
      {
          icon: <ChatIcon className="w-full h-full p-2 text-blue-400" />,
          label: 'AI Assistant',
          onClick: () => setIsChatOpen(!isChatOpen),
          badgeCount: undefined
      }
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-200 font-sans relative">
      <EmergencyAlert />
      <Header />
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900 p-4 sm:p-6 lg:p-8 pb-24">
        {children}
      </main>
      <AIChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <Dock items={dockItems} className="bg-gray-800/30 backdrop-blur-md border-gray-700" />
    </div>
  );
};

export default Layout;
