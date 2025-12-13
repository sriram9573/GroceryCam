import { NextResponse } from 'next/server';
import { generateContent } from '@/lib/services/gemini';
import { NormalizeRequestSchema } from '@grocery-cam/shared';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parse = NormalizeRequestSchema.safeParse(body);
        if (!parse.success) {
            return NextResponse.json({ error: parse.error }, { status: 400 });
        }
        const { itemsRaw, rawText } = parse.data;
        const context = rawText || itemsRaw.map(i => i.nameRaw).join('\n');

        const prompt = `
    You are a grocery product normalizer. Convert noisy OCR line items into normalized JSON.
    Output array only. For each line, return:
    { "nameNorm": string, "category": string, "quantity": number, "unit": "count"|"g"|"ml"|"kg"|"l"|"lb"|"oz", "unitPrice": number|null, "lineTotal": number|null, "confidence": 0..1 }
    
    Rules:
    - Use common grocery taxonomy for category.
    - Use metric units when possible.
    - If quantity is unknown, infer 1 count.
    - Extract price if visible in the line text.
    - Output MUST be valid JSON array.

    INPUT_TEXT:
    ${context}
    `;

        const normalizedItems = await generateContent(prompt);

        if (!normalizedItems || !Array.isArray(normalizedItems)) {
            return NextResponse.json({ error: "Failed to normalize items" }, { status: 500 });
        }

        return NextResponse.json({ items: normalizedItems });
    } catch (error) {
        console.error('Normalize Route Error:', error);
        return NextResponse.json({ error: 'Failed to normalize items' }, { status: 500 });
    }
}
