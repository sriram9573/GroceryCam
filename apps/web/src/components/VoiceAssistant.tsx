'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, Loader2, X, Keyboard } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function VoiceAssistant() {
    const [listening, setListening] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [partialTranscript, setPartialTranscript] = useState('');
    const [showInput, setShowInput] = useState(false);
    const [textInput, setTextInput] = useState('');
    const recognitionRef = useRef<any>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const [hasVoice, setHasVoice] = useState(false);
    const [lastContext, setLastContext] = useState<string | null>(null);
    const [processedIndex, setProcessedIndex] = useState(0); // Added for continuous mode

    // Add a Ref for context to solve stale closure in useEffect
    const contextRef = useRef<string | null>(null);

    // Update ref when state changes (if we set it elsewhere)
    useEffect(() => { contextRef.current = lastContext; }, [lastContext]);

    useEffect(() => {
        if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            // @ts-ignore
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const speech = new SpeechRecognition();
            speech.continuous = true; // Keep mic open
            speech.lang = 'en-US';
            speech.interimResults = true;

            speech.onstart = () => {
                setListening(true);
                setFeedback("Start speaking...");
                setPartialTranscript("");
            };

            speech.onend = () => {
                // Only effectively stop if we decided to stop (not just silence)
                // But in continuous mode, it might stop on network error or timeout.
                // We'll let the UI reflect that.
                setListening(false);
            };

            speech.onresult = async (event: any) => {
                let interim = '';
                let final = '';

                // We only care about new results we haven't processed
                // But React state in callback is stale. We need a ref or robust idx tracking.
                // For simplicity in this functional component without refs for all state, 
                // we'll process the *last* final result.

                const resultsLength = event.results.length;
                const latestResult = event.results[resultsLength - 1];

                if (latestResult.isFinal) {
                    final = latestResult[0].transcript.trim();
                    // Avoid reprocessing same index if possible, or just debounce?
                    // Rely on processing flag.
                    console.log("Final Heard:", final);
                    handleCommand(final, speech);
                } else {
                    interim = latestResult[0].transcript;
                }

                if (interim) setPartialTranscript(interim);
            };

            speech.onerror = (event: any) => {
                console.error("Speech Error:", event.error);
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    setFeedback(" mic access denied. Using text.");
                    setHasVoice(false);
                    setListening(false);
                }
                // Don't stop on 'no-speech', just keep listening or let it timeout
            };

            recognitionRef.current = speech;
            setHasVoice(true);
        } else {
            console.warn("Voice API not supported");
            setHasVoice(false);
        }
    }, []); // Check deps? Empty is fine for setup.

    // Updated handleCommand to accept speech instance for control
    const handleCommand = async (text: string, speechInstance: any) => {
        if (!text) return;

        // Prevent overlapping processing
        // Note: processing state here might be stale in the closure of onresult
        // But we can check a ref if needed. For now assume linear flow.

        setProcessing(true);
        setFeedback(`Processing: "${text}"...`);
        setPartialTranscript("");
        setShowInput(false);
        setTextInput('');

        let isClarification = false;

        try {
            // Use functional state update to get latest context if needed, 
            // but here we are in a closure. Ideally use a Ref for lastContext.
            // ... Actually `lastContext` is stale here! 
            // We need a Ref for context to work in this closure.

            // FIX: Using Ref for context
            const ctxPayload = contextRef.current;

            const res = await apiClient('/parse-intent', {
                method: 'POST',
                body: JSON.stringify({ text, previousContext: ctxPayload })
            });

            console.log("Intent:", res);

            if (!res || !res.intent || res.intent === 'UNKNOWN') {
                setFeedback("I didn't understand that.");
                // If unknown, we might want to keep listening or stop?
                // Let's stop to reset.
                speechInstance.stop();
                setTimeout(() => setFeedback(null), 3000);
                return;
            }

            if (res.intent !== 'ASK_CLARIFICATION') {
                setLastContext(null);
                contextRef.current = null;
                // Intent fulfilled, STOP listening
                speechInstance.stop();
            } else {
                if (!ctxPayload) {
                    setLastContext(text);
                    contextRef.current = text;
                }
                isClarification = true;
                // DO NOT STOP MIC. Keep listening for answer.
            }

            await executeAction(res);

        } catch (error) {
            console.error(error);
            setFeedback("Error processing command.");
            speechInstance.stop();
        } finally {
            setProcessing(false);
            if (!isClarification) {
                setTimeout(() => setFeedback(null), 4000);
            }
            // Do not overwrite feedback for clarification. The question set in executeAction is what we want.
        }
    };

    const executeAction = async (action: any) => {
        if (!auth.currentUser) return;
        const uid = auth.currentUser.uid;
        const pantryRef = collection(db, 'users', uid, 'pantry');

        if (action.intent === 'ADD_ITEM') {
            const itemsToAdd = action.items || (action.item ? [action.item] : []);
            let successCount = 0;

            for (const item of itemsToAdd) {
                const { name, quantity, unit, category } = item;

                // Fuzzy match logic
                const snap = await getDocs(pantryRef);
                const targetName = name.toLowerCase().trim();

                const existingDoc = snap.docs.find(d => {
                    const data = d.data();
                    return data.name?.toLowerCase().trim() === targetName;
                });

                if (existingDoc) {
                    // Update existing
                    const docRef = doc(db, 'users', uid, 'pantry', existingDoc.id);
                    const currentQty = existingDoc.data().quantity || 0;
                    await updateDoc(docRef, { quantity: currentQty + quantity });
                } else {
                    // Create new
                    await addDoc(pantryRef, {
                        name, // Use the name from voice command if new
                        quantity,
                        unit: unit || 'count',
                        category: category || 'General', // Use inferred category or fallback
                        updatedAt: new Date().toISOString()
                    });
                }
                successCount++;
            }

            if (successCount > 0) {
                // Summarize feedback
                if (itemsToAdd.length === 1) {
                    setFeedback(`Added ${itemsToAdd[0].quantity} ${itemsToAdd[0].name}(s).`);
                } else {
                    setFeedback(`Added ${itemsToAdd.length} items to pantry.`);
                }
            }
        }
        else if (action.intent === 'REMOVE_ITEM') {
            const itemsToRemove = action.items || (action.item ? [action.item] : []);
            let removedCount = 0;

            for (const item of itemsToRemove) {
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
                    const newQty = Math.max(0, currentQty - quantity);

                    if (newQty === 0) {
                        await deleteDoc(docRef);
                    } else {
                        await updateDoc(docRef, { quantity: newQty });
                    }
                    removedCount++;
                }
            }

            if (removedCount > 0) {
                if (itemsToRemove.length === 1) {
                    setFeedback(`Removed ${itemsToRemove[0].name}.`);
                } else {
                    setFeedback(`Updated ${removedCount} items.`);
                }
            } else {
                setFeedback("Could not find item(s) to remove.");
            }
        }
        else if (action.intent === 'ASK_CLARIFICATION') {
            const question = action.question || "Do you have a specific dish in mind?";
            setFeedback(question);
            // Mic is ALREADY ON (Continuous Mode).
            // Just updated UI text.
        }
        else if (action.intent === 'GENERATE_RECIPES') {
            const queryParam = action.query ? `&query=${encodeURIComponent(action.query)}` : '';
            setFeedback("Generating ideas...");
            router.push(`/recipes?auto=true${queryParam}`);
        }
    };

    const toggleListening = () => {
        if (hasVoice) {
            if (listening) {
                recognitionRef.current?.stop();
                setFeedback("Stopped.");
            } else {
                try {
                    // Reset processed state if needed?
                    recognitionRef.current?.start();
                } catch (e) { console.error(e); }
            }
        } else {
            setShowInput(prev => !prev);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (textInput.trim()) {
            handleCommand(textInput, { stop: () => { } }); // Mock speech object for text
        }
    };

    return (
        <div className="fixed bottom-6 right-6 flex flex-col items-end gap-2 z-50">
            {/* Live Caption Bubble */}
            {listening && (
                <div className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm mb-1 shadow-lg animate-in fade-in slide-in-from-bottom-4">
                    <p className="font-bold text-xs uppercase opacity-75 mb-1">Listening...</p>
                    <p className="italic">"{partialTranscript}"</p>
                </div>
            )}

            {/* Feedback / Processing Bubble - Always show if present */}
            {feedback && (
                <div className="bg-black/80 text-white px-4 py-2 rounded-lg text-sm mb-2 shadow-lg backdrop-blur animate-in slide-in-from-bottom-2 fade-in">
                    {feedback}
                </div>
            )}

            {showInput && (
                <form onSubmit={handleTextSubmit} className="mb-2 flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Type command..."
                        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 shadow-lg w-64 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button type="button" onClick={() => setShowInput(false)} className="bg-gray-200 dark:bg-gray-700 p-2 rounded-full"><X className="w-4 h-4" /></button>
                </form>
            )}

            <button
                onClick={toggleListening}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all ${listening
                    ? 'bg-red-500 animate-pulse ring-4 ring-red-200'
                    : processing
                        ? 'bg-orange-400'
                        : 'bg-orange-600 hover:bg-orange-700 hover:scale-105'
                    } text-white`}
            >
                {processing ? (
                    <Loader2 className="animate-spin" />
                ) : hasVoice ? (
                    <Mic className="w-6 h-6" />
                ) : (
                    <Keyboard className="w-6 h-6" />
                )}
            </button>
        </div>
    );
}
