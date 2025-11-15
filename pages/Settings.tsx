
import React from 'react';
import { useAppContext } from '../context/AppContext';

const Settings: React.FC = () => {
    const { state, dispatch } = useAppContext();
    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>
            
            <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                    <div>
                        <h3 className="font-semibold">Theme</h3>
                        <p className="text-sm text-gray-400">Current mode: {state.theme === 'dark' ? 'Dark' : 'Light'}</p>
                    </div>
                    <button
                        onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
                    >
                        Switch to {state.theme === 'dark' ? 'Light' : 'Dark'} Mode
                    </button>
                </div>
                <div className="p-4 bg-gray-700 rounded-lg">
                    <h3 className="font-semibold mb-2">Notification Preferences</h3>
                    <p className="text-sm text-gray-400">Notification settings are not yet available.</p>
                </div>
                 <div className="p-4 bg-gray-700 rounded-lg">
                    <h3 className="font-semibold mb-2">System Info</h3>
                    <p className="text-sm text-gray-400">SurgeMind Admin Dashboard v1.0</p>
                </div>
            </div>
        </div>
    )
};

export default Settings;
