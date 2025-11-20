
import React from 'react';
import { SearchIcon, BellIcon, UserIcon } from './Icons';
import { useAppContext } from '../context/AppContext';

const Header: React.FC = () => {
  const { state } = useAppContext();
  const criticalEmergencies = state.emergencies.filter(e => e.severity === 'Critical').length;

  return (
    <header className="flex items-center justify-between h-20 px-8 bg-gray-800 border-b border-gray-700">
      <div>
        <h1 className="text-xl font-semibold text-white">Welcome, Admin</h1>
        <p className="text-sm text-gray-400">Here's the real-time status of your hospital.</p>
      </div>
      <div className="flex items-center space-x-6">
        {state.agenticAiEnabled && (
            <div className="flex items-center gap-2" title="The Agentic AI is analyzing hospital data in real-time.">
                <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-xs text-green-400 font-semibold">AI Agent Active</span>
            </div>
        )}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-64 pl-10 pr-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <BellIcon className="w-6 h-6 text-gray-400 hover:text-white cursor-pointer" />
          {criticalEmergencies > 0 && (
            <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs rounded-full">
              {criticalEmergencies}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
            <UserIcon className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">Admin</p>
            <p className="text-xs text-gray-400">Hospital Manager</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
