
import React, { useState } from 'react';
import { 
  DashboardIcon, ForecastIcon, CctvIcon, IotIcon, EmergencyIcon, StaffIcon, PatientIcon, 
  TaskIcon, AppointmentIcon, SupplyIcon, BedIcon, SettingsIcon, LogoIcon, ChevronLeftIcon 
} from './Icons';
import { Pages } from '../context/AppContext';

interface SidebarProps {
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


const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`relative flex flex-col bg-gray-800 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
       <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 z-10 p-1 rounded-full bg-gray-700 hover:bg-blue-600 text-white transition-transform duration-300"
        style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
       >
        <ChevronLeftIcon className="w-5 h-5" />
       </button>
      <div className="flex items-center h-20 px-4 border-b border-gray-700">
        <LogoIcon className="h-10 w-10 text-blue-500" />
        {!isCollapsed && <span className="ml-3 text-2xl font-bold text-white">SurgeMind</span>}
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul>
          {navItems.map((item) => (
            <li key={item.id} className="px-4 py-1">
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); setActivePage(item.id); }}
                className={`flex items-center p-2 rounded-lg transition-colors duration-200 ${
                  activePage === item.id 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon className="h-6 w-6" />
                {!isCollapsed && <span className="ml-4 font-medium">{item.label}</span>}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
