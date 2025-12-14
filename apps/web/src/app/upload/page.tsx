'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import ReceiptUploader from '@/components/ReceiptUploader';
import ReceiptReview from '@/components/ReceiptReview';
import { ItemNorm } from '@grocery-cam/shared';

export default function UploadPage() {
    const [reviewData, setReviewData] = useState<{ receiptId: string, items: ItemNorm[] } | null>(null);

    return (
        <div className="min-h-screen pb-20 md:pb-0 relative">
            <Navbar />

            {reviewData ? (
                <ReceiptReview
                    initialItems={reviewData.items}
                    initialReceiptId={reviewData.receiptId}
                    onCancel={() => setReviewData(null)}
                />
            ) : (
                <main className="max-w-3xl mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-2">Add New Receipt</h1>
                        <p className="text-gray-500">Snap a photo or upload a file to update your pantry.</p>
                    </div>
                    <div className="w-full">
                        <ReceiptUploader
                            onSuccess={(data) => setReviewData(data)}
                        />
                    </div>
                </main>
            )}
        </div>
    );
}
