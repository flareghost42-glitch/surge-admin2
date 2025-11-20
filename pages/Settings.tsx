import React from 'react';
import { useAppContext } from '../context/AppContext';

const Settings: React.FC = () => {
    const { state, dispatch } = useAppContext();

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/80 shadow-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>
            
            <div className="space-y-8">
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
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
                 <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <h3 className="font-semibold mb-2">System Info</h3>
                    <p className="text-sm text-gray-400">SurgeMind Admin Dashboard v1.3</p>
                </div>
            </div>
        </div>
    )
};

export default Settings;