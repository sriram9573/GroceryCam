'use client';

import { useState, useRef } from 'react';
import { Upload, Camera, Loader2, Check } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface ReceiptUploaderProps {
    onSuccess?: (data: { receiptId: string, items: any[] }) => void;
}

export default function ReceiptUploader({ onSuccess }: ReceiptUploaderProps) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleFile = async (file: File) => {
        setLoading(true);
        setStatus('Uploading image...');

        try {
            // 1. Upload to Firebase Storage
            const fileRef = ref(storage, `receipts/${Date.now()}_${file.name}`);
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);

            // 2. OCR
            setStatus('Scanning text (OCR)...');
            const ocrRes = await apiClient('/ocr', {
                method: 'POST',
                body: JSON.stringify({ imageUrl: url })
            });

            // 3. Normalize
            setStatus('Normalizing items with AI...');
            const normRes = await apiClient('/normalize-items', {
                method: 'POST',
                body: JSON.stringify({ itemsRaw: ocrRes.items, rawText: ocrRes.rawText })
            });

            // 4. Output Data
            const reviewData = {
                receiptId: ocrRes.receiptId,
                items: normRes.items
            };

            // OPTIONAL: Persistence
            localStorage.setItem('currentReceipt', JSON.stringify(reviewData));

            if (onSuccess) {
                onSuccess(reviewData);
            } else {
                router.push('/upload/review');
            }

        } catch (error) {
            console.error(error);
            const msg = (error as Error).message;
            setStatus('Error: ' + msg);
            alert(`Upload Failed: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-6 p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
            <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            {/* Dedicated Camera Input */}
            <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                id="camera-input"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            {loading ? (
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-10 h-10 animate-spin text-green-600" />
                    <p className="text-sm font-medium">{status}</p>
                </div>
            ) : (
                <>
                    <div className="flex gap-4">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center justify-center w-32 h-32 bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition"
                        >
                            <Upload className="w-8 h-8 mb-2 text-gray-400" />
                            <span className="text-sm font-medium">Upload File</span>
                        </button>
                        <button
                            onClick={() => document.getElementById('camera-input')?.click()}
                            className="flex flex-col items-center justify-center w-32 h-32 bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition"
                        >
                            <Camera className="w-8 h-8 mb-2 text-gray-400" />
                            <span className="text-sm font-medium">Use Camera</span>
                        </button>
                    </div>
                    <p className="text-xs text-gray-500">Supported: JPG, PNG, HEIC</p>
                </>
            )}
        </div>
    );
}
