
import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { runLLM, ChatMessage } from '../lib/openrouter';
import { buildSystemContext } from '../agent/prompts/chatPrompt';
import { SendIcon, LogoIcon, UserIcon } from '../components/Icons';

const SurgeMind: React.FC = () => {
  const { state } = useAppContext();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'I am SurgeMind, your dedicated hospital operations AI. I have access to real-time data regarding beds, staff, patients, and emergencies. How can I help you optimize operations today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg: ChatMessage = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
        const systemMsg = buildSystemContext(state);
        const history = messages.filter(m => m.role !== 'system').slice(-20); // Keep more context for full page
        const fullPayload = [systemMsg, ...history, userMsg];

        const aiResponse = await runLLM(fullPayload);
        setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
        console.error("SurgeMind error:", error);
        setMessages(prev => [...prev, { role: 'assistant', content: "Connection interrupted. Please check system status." }]);
    } finally {
        setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/80 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 p-6 border-b border-gray-700 flex items-center gap-4">
         <div className="p-3 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
            <LogoIcon className="w-8 h-8 text-white" />
         </div>
         <div>
            <h2 className="text-2xl font-bold text-white">SurgeMind Intelligence</h2>
            <p className="text-gray-400 text-sm">Autonomous Hospital Operations Assistant</p>
         </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[80%] gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gray-700' : 'bg-blue-600'}`}>
                        {msg.role === 'user' ? <UserIcon className="w-6 h-6 text-gray-300" /> : <LogoIcon className="w-6 h-6 text-white" />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-gray-700 text-gray-200 rounded-tl-none'
                    }`}>
                        {msg.content}
                    </div>
                </div>
            </div>
        ))}
         {isTyping && (
            <div className="flex justify-start">
                 <div className="flex max-w-[80%] gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <LogoIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="bg-gray-700 rounded-2xl rounded-tl-none px-6 py-4 flex gap-2 items-center">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-gray-800 border-t border-gray-700">
        <div className="relative">
            <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Query hospital data (e.g. 'Summarize active emergencies' or 'Which ward is busiest?')..."
                className="w-full bg-gray-900/50 text-white rounded-xl pl-6 pr-14 py-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700 transition-all"
            />
            <button 
                onClick={handleSend}
                disabled={!inputValue.trim() || isTyping}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <SendIcon className="w-6 h-6" />
            </button>
        </div>
        <p className="text-center text-xs text-gray-500 mt-3">
            SurgeMind has access to live operational data. Do not share PII.
        </p>
      </div>
    </div>
  );
};

export default SurgeMind;
