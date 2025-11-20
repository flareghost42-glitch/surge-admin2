import React from 'react';
import { useAppContext } from '../context/AppContext';

const GenericPage: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-gray-400">This page is under construction. Data and functionality will be added soon.</p>
      <div className="mt-8 flex items-center justify-center h-64 bg-gray-900 rounded-lg">
        <p className="text-gray-500">Content for {title}</p>
      </div>
    </div>
  );
};

export const Emergency: React.FC = () => <GenericPage title="Emergency" />;
export const Staff: React.FC = () => <GenericPage title="Staff" />;
export const Patients: React.FC = () => <GenericPage title="Patients" />;
export const Tasks: React.FC = () => <GenericPage title="Tasks" />;
export const Appointments: React.FC = () => <GenericPage title="Appointments" />;
export const Supplies: React.FC = () => <GenericPage title="Supplies" />;
export const Beds: React.FC = () => <GenericPage title="Beds" />;

// Keep Settings simple for now
const SettingsComponent: React.FC = () => {
  const { state, dispatch } = useAppContext();
  return (
     <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>
      <div className="flex items-center justify-between">
        <span className="text-gray-300">Theme</span>
        <button 
          onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
        >
          Switch to {state.theme === 'dark' ? 'Light' : 'Dark'} Mode
        </button>
      </div>
    </div>
  )
}
export const Settings: React.FC = () => <SettingsComponent />;
