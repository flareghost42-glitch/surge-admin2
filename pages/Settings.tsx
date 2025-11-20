import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const Settings: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [isEnabled, setIsEnabled] = useState(state.agenticAiEnabled);
    const [model, setModel] = useState(state.llmModel);
    const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SUCCESS'>('IDLE');

    const handleSave = () => {
        dispatch({ type: 'SET_AGENT_CONFIG', payload: { enabled: isEnabled, model } });
        setSaveStatus('SUCCESS');
        setTimeout(() => setSaveStatus('IDLE'), 2000);
    };

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/80 shadow-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>
            
            <div className="space-y-8">
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <h3 className="font-semibold text-lg mb-4">Agentic AI Configuration</h3>
                    <p className="text-sm text-gray-400 mb-4">
                        Enable the Agentic AI to get intelligent analysis and recommendations powered by Google's Gemini models. 
                        The API Key must be configured as an environment variable (`process.env.API_KEY`).
                    </p>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-900/50">
                            <label htmlFor="agentToggle" className="block text-sm font-medium text-gray-300">Enable Agentic AI</label>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={isEnabled} onChange={() => setIsEnabled(!isEnabled)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                <span className={`ml-3 text-sm font-semibold ${isEnabled ? 'text-green-400' : 'text-gray-400'}`}>{isEnabled ? 'Enabled' : 'Disabled'}</span>
                            </label>
                        </div>
                        <div>
                            <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-1">Gemini Model</label>
                            <input
                                type="text"
                                id="model"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                placeholder="gemini-2.5-flash"
                                className="w-full pl-4 pr-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={!isEnabled}
                            />
                        </div>
                        <div className="flex items-center justify-end gap-4">
                             {saveStatus === 'SUCCESS' && <p className="text-sm text-green-400">Settings saved!</p>}
                             <button
                                onClick={handleSave}
                                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
                            >
                                Save AI Settings
                            </button>
                        </div>
                    </div>
                </div>

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
                    <p className="text-sm text-gray-400">SurgeMind Admin Dashboard v1.2 (Gemini Agent)</p>
                </div>
            </div>
        </div>
    )
};

export default Settings;