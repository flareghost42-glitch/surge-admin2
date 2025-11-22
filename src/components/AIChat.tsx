
import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { SendIcon, XIcon, LogoIcon } from './Icons';
import { runLLM, ChatMessage } from '../lib/openrouter';
import { buildSystemContext } from '../agent/prompts/chatPrompt';
import { AnimatePresence, motion } from 'framer-motion';

interface AIChatProps {
    isOpen: boolean;
    onClose: () => void;
}

const AIChat: React.FC<AIChatProps> = ({ isOpen, onClose }) => {
    const { state } = useAppContext();
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: 'Hello Admin. I am connected to the SurgeMind live stream. How can I assist with hospital operations today?' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMsg: ChatMessage = { role: 'user', content: inputValue };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        try {
            // Build dynamic system prompt with CURRENT state
            const systemMsg = buildSystemContext(state);
            
            // Filter out system messages from history to avoid duplication, keep last 10 for context
            const history = messages.filter(m => m.role !== 'system').slice(-10);
            
            const fullPayload = [systemMsg, ...history, userMsg];
            
            // Call LLM in default text mode (jsonMode = false)
            const aiResponse = await runLLM(fullPayload);
            
            setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting to the neural network. Please check your connection or API key." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="fixed bottom-28 right-4 sm:right-8 z-50 flex flex-col items-end pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="w-80 sm:w-96 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
                        style={{ height: '500px' }}
                    >
                        {/* Header */}
                        <div className="bg-gray-900 p-4 flex justify-between items-center border-b border-gray-700">
                            <div className="flex items-center gap-2">
                                <div className="bg-blue-600 p-1.5 rounded-lg">
                                    <LogoIcon className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm">SurgeMind AI</h3>
                                    <div className="flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        <span className="text-xs text-gray-400">Live Data Connected</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={onClose}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-800/50">
                            {messages.map((msg, idx) => (
                                <div 
                                    key={idx} 
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div 
                                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                                            msg.role === 'user' 
                                            ? 'bg-blue-600 text-white rounded-br-none' 
                                            : 'bg-gray-700 text-gray-200 rounded-bl-none'
                                        }`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-700 rounded-2xl rounded-bl-none px-4 py-3 flex gap-1 items-center">
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-gray-900 border-t border-gray-700">
                            <div className="relative flex items-center">
                                <input 
                                    type="text" 
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Ask about patients, beds, or tasks..."
                                    className="w-full bg-gray-800 text-white rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700"
                                />
                                <button 
                                    onClick={handleSend}
                                    disabled={!inputValue.trim() || isTyping}
                                    className="absolute right-1.5 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <SendIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AIChat;
