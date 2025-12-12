'use client';

import Navbar from '@/components/Navbar';
import ReceiptUploader from '@/components/ReceiptUploader';

export default function UploadPage() {
    return (
        <div className="min-h-screen pb-20 md:pb-0">
            <Navbar />
            <main className="max-w-3xl mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">Add New Receipt</h1>
                    <p className="text-gray-500">Snap a photo or upload a file to update your pantry.</p>
                </div>
                <div className="w-full">
                    <ReceiptUploader />
                </div>
            </main>
        </div>
    );
}
