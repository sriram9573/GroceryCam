import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';
import { OcrRequestSchema } from '@grocery-cam/shared';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parse = OcrRequestSchema.safeParse(body);
        if (!parse.success) {
            return NextResponse.json({ error: parse.error }, { status: 400 });
        }
        const { imageUrl } = parse.data;

        const { rawText } = await detectText(imageUrl);
        const receiptId = uuidv4();

        const itemsRaw = rawText.split('\n').filter((line) => line.trim().length > 3).map((line) => ({
            nameRaw: line,
            quantity: 1,
        }));

        return NextResponse.json({
            receiptId,
            rawText,
            items: itemsRaw,
        });
    } catch (error: any) {
        console.error('❌ OCR Error:', error);
        return NextResponse.json({ error: 'Failed to process receipt', details: error.message }, { status: 500 });
    }
}
