'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, Loader2, Send, MessageSquare, X } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import ChatInterface, { Message } from './ChatInterface';

export default function VoiceAssistant() {
    const [listening, setListening] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [partialTranscript, setPartialTranscript] = useState('');
    const [textInput, setTextInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [showChat, setShowChat] = useState(false);

    const recognitionRef = useRef<any>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const [hasVoice, setHasVoice] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            // @ts-ignore
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const speech = new SpeechRecognition();
            speech.continuous = true;
            speech.lang = 'en-US';
            speech.interimResults = true;

            speech.onstart = () => {
                setListening(true);
                setPartialTranscript("");
            };

            speech.onend = () => {
                setListening(false);
            };

            speech.onresult = async (event: any) => {
                const resultsLength = event.results.length;
                const latestResult = event.results[resultsLength - 1];

                if (latestResult.isFinal) {
                    const final = latestResult[0].transcript.trim();
                    console.log("Final Heard:", final);
                    handleCommand(final, speech);
                } else {
                    setPartialTranscript(latestResult[0].transcript);
                }
            };

            speech.onerror = (event: any) => {
                console.error("Speech Error:", event.error);
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    setHasVoice(false);
                    setListening(false);
                }
            };

            recognitionRef.current = speech;
            setHasVoice(true);
        } else {
            console.warn("Voice API not supported");
            setHasVoice(false);
        }
    }, []);

    // Text-to-Speech function with female voice
    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();

            // Clean text for speech: remove emojis and Markdown stars
            const cleanText = text
                .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
                .replace(/\*/g, '')
                .trim();

            const utterance = new SpeechSynthesisUtterance(cleanText);

            const voices = window.speechSynthesis.getVoices();
            const femaleVoice = voices.find(voice =>
                voice.name.includes('Female') ||
                voice.name.includes('Samantha') ||
                voice.name.includes('Victoria') ||
                voice.name.includes('Google UK English Female') ||
                voice.name.includes('Microsoft Zira')
            ) || voices.find(voice => voice.lang.startsWith('en'));

            if (femaleVoice) {
                utterance.voice = femaleVoice;
            }

            utterance.rate = 1.05; // Slightly faster for more natural flow
            utterance.pitch = 1.1; // Slightly higher pitch for friendliness
            utterance.volume = 1.0;

            // Speak
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleCommand = async (text: string, speechInstance?: any) => {
        if (!text) return;

        // Add user message to chat
        const userMessage: Message = {
            role: 'user',
            content: text,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);

        setProcessing(true);
        setPartialTranscript("");
        setTextInput('');

        try {
            const res = await apiClient('/parse-intent', {
                method: 'POST',
                body: JSON.stringify({
                    text,
                    conversationHistory: messages.slice(-10) // Last 10 messages for context
                })
            });

            console.log("AI Response:", res);

            // Check if response has the required fields
            if (!res) {
                throw new Error('No response from server');
            }

            // Use the response field from the AI
            const responseText = res.response || "I'm here to help! What would you like to do?";

            // Add AI response to chat
            const aiMessage: Message = {
                role: 'assistant',
                content: responseText,
                timestamp: new Date(),
                suggestions: res.suggestions
            };
            setMessages(prev => [...prev, aiMessage]);

            // Speak response (cleaned)
            speak(responseText);

            // Execute action if needed
            await executeAction(res, recognitionRef.current);

        } catch (error: any) {
            console.error(error);
            const errorMessage: Message = {
                role: 'assistant',
                content: error.message || "Sorry, I'm having trouble connecting. Please try again.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
            speak("Sorry, I encountered an error.");
        } finally {
            setProcessing(false);
        }
    };

    const executeAction = async (action: any, speechInstance: any) => {
        if (!auth.currentUser) {
            console.error("No authenticated user found");
            throw new Error("You must be logged in to perform actions.");
        }

        const uid = auth.currentUser.uid;
        const pantryRef = collection(db, 'users', uid, 'pantry');

        // Stop mic for completed actions, keep it on for clarifications
        const shouldKeepMicOn = ['ASK_CLARIFICATION', 'CONFIRM_UNCLEAR', 'GREETING', 'SMALL_TALK', 'APP_INFO', 'GENERAL_RESPONSE'].includes(action.intent);

        if (!shouldKeepMicOn) {
            speechInstance?.stop();
        }

        try {
            if (action.intent === 'ADD_ITEM' && action.items) {
                for (const item of action.items) {
                    if (!item.name) continue;

                    const { name, quantity, unit } = item;
                    const snap = await getDocs(pantryRef);
                    const targetName = name.toLowerCase().trim();

                    const existingDoc = snap.docs.find(d => {
                        const data = d.data();
                        return data.name?.toLowerCase().trim() === targetName;
                    });

                    if (existingDoc) {
                        const docRef = doc(db, 'users', uid, 'pantry', existingDoc.id);
                        const currentQty = existingDoc.data().quantity || 0;
                        await updateDoc(docRef, { quantity: currentQty + (quantity || 1) });
                    } else {
                        await addDoc(pantryRef, {
                            name,
                            quantity: quantity || 1,
                            unit: unit || 'count',
                            category: item.category || 'General',
                            emoji: item.emoji || '📦',
                            updatedAt: new Date().toISOString()
                        });
                    }
                }
            }
            else if (action.intent === 'REMOVE_ITEM' && action.items) {
                for (const item of action.items) {
                    if (!item.name) continue;

                    const { name, quantity } = item;
                    const snap = await getDocs(pantryRef);
                    const targetName = name.toLowerCase().trim();

                    const existingDoc = snap.docs.find(d => {
                        const data = d.data();
                        return data.name?.toLowerCase().trim() === targetName;
                    });

                    if (existingDoc) {
                        const docRef = doc(db, 'users', uid, 'pantry', existingDoc.id);
                        const currentQty = existingDoc.data().quantity;
                        const newQty = Math.max(0, currentQty - (quantity || 1));

                        if (newQty === 0) {
                            await deleteDoc(docRef);
                        } else {
                            await updateDoc(docRef, { quantity: newQty });
                        }
                    }
                }
            }
            else if (action.intent === 'GENERATE_RECIPES') {
                const queryParam = action.query ? `&query=${encodeURIComponent(action.query)}` : '';
                router.push(`/recipes?auto=true${queryParam}`);
                setShowChat(false); // Close chat to show recipes
            }
            else if (action.intent === 'VIEW_PANTRY') {
                router.push('/dashboard');
                setShowChat(false); // Close chat to see items
            }
            else if (action.intent === 'SCAN_RECEIPT') {
                router.push('/upload');
                setShowChat(false);
            }
        } catch (dbError: any) {
            console.error("Database Action Error:", dbError);
            throw new Error(`Database error: ${dbError.message}`);
        }
    };

    const toggleListening = () => {
        if (hasVoice) {
            if (listening) {
                recognitionRef.current?.stop();
            } else {
                try {
                    setShowChat(true);
                    recognitionRef.current?.start();
                } catch (e) { console.error(e); }
            }
        } else {
            setShowChat(true);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handleSuggestionClick = (text: string) => {
        handleCommand(text);
    };

    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (textInput.trim()) {
            handleCommand(textInput);
        }
    };

    const toggleChat = () => {
        setShowChat(!showChat);
        if (listening) {
            recognitionRef.current?.stop();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 flex flex-col items-end gap-4 z-50">
            {/* Chat Overlay */}
            {showChat && (
                <div className="fixed inset-x-0 bottom-24 mx-4 md:right-6 md:left-auto md:w-[400px] z-40 animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <ChatInterface
                        messages={messages}
                        isTyping={processing}
                        onSuggestionClick={handleSuggestionClick}
                    />

                    {/* Input Area */}
                    <div className="mt-2 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-3">
                        {listening && (
                            <div className="mb-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-3 py-2 rounded-lg text-sm">
                                <p className="font-bold text-xs uppercase opacity-75 mb-1">Listening...</p>
                                <p className="italic">"{partialTranscript}"</p>
                            </div>
                        )}

                        <form onSubmit={handleTextSubmit} className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1 bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                disabled={processing}
                            />
                            <button
                                type="submit"
                                disabled={!textInput.trim() || processing}
                                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Floating Action Buttons */}
            <div className="flex gap-2">
                {showChat && (
                    <button
                        onClick={toggleChat}
                        className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 flex items-center justify-center shadow-lg transition-all"
                    >
                        <X className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                    </button>
                )}

                <button
                    onClick={showChat ? toggleListening : toggleChat}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all ${listening
                        ? 'bg-red-500 animate-pulse ring-4 ring-red-200'
                        : processing
                            ? 'bg-orange-400'
                            : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:scale-105'
                        } text-white`}
                >
                    {processing ? (
                        <Loader2 className="animate-spin w-6 h-6" />
                    ) : showChat && hasVoice ? (
                        <Mic className="w-6 h-6" />
                    ) : (
                        <MessageSquare className="w-6 h-6" />
                    )}
                </button>
            </div>
        </div>
    );
}
