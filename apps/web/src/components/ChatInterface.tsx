'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    suggestions?: string[];
}

interface ChatInterfaceProps {
    messages: Message[];
    isTyping: boolean;
    onSuggestionClick: (text: string) => void;
}

export default function ChatInterface({ messages, isTyping, onSuggestionClick }: ChatInterfaceProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    return (
        <div className="flex flex-col h-full max-h-[500px] bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-neutral-200 dark:border-neutral-800 bg-gradient-to-r from-orange-500 to-amber-500">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg">
                    <span className="text-2xl">🤖</span>
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-white">GroceryCam AI</h3>
                    <p className="text-xs text-white/80">Your kitchen assistant</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center mb-4">
                            <span className="text-3xl">👋</span>
                        </div>
                        <h4 className="font-bold text-lg text-neutral-800 dark:text-neutral-200 mb-2">
                            Welcome to GroceryCam!
                        </h4>
                        <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-xs">
                            I'm here to help with your kitchen needs. Ask me anything or try voice commands!
                        </p>
                    </div>
                )}

                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex gap-3 animate-in slide-in-from-bottom-4 fade-in duration-300 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                            }`}
                    >
                        {/* Avatar */}
                        {message.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center shrink-0">
                                <span className="text-lg">🤖</span>
                            </div>
                        )}

                        {/* Message Bubble */}
                        <div
                            className={`max-w-[75%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-tr-none'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-tl-none'
                                }`}
                        >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

                            {/* Quick Action Buttons */}
                            {message.suggestions && message.suggestions.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {message.suggestions.map((suggestion, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => onSuggestionClick(suggestion)}
                                            className="text-xs px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors border border-white/20 hover:scale-105 active:scale-95 cursor-pointer"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Timestamp */}
                            <p
                                className={`text-xs mt-1 ${message.role === 'user' ? 'text-white/70' : 'text-neutral-500 dark:text-neutral-400'
                                    }`}
                            >
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>

                        {/* User Avatar */}
                        {message.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-neutral-300 dark:bg-neutral-700 flex items-center justify-center shrink-0">
                                <span className="text-lg">👤</span>
                            </div>
                        )}
                    </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex gap-3 animate-in slide-in-from-bottom-4 fade-in duration-300">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center shrink-0">
                            <span className="text-lg">🤖</span>
                        </div>
                        <div className="bg-neutral-100 dark:bg-neutral-800 rounded-2xl rounded-tl-none px-4 py-3">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>
        </div>
    );
}
