import { Router, Request, Response } from 'express';
import { detectText } from '../services/ocr.js';
import { generateContent } from '../services/gemini.js';
import { OcrRequestSchema, NormalizeRequestSchema } from '@grocery-cam/shared';
import { v4 as uuidv4 } from 'uuid';

export const receiptsRouter = Router();

// POST /api/ocr
receiptsRouter.post('/ocr', async (req: Request, res: Response) => {
    try {
        const parse = OcrRequestSchema.safeParse(req.body);
        if (!parse.success) {
            return res.status(400).json({ error: parse.error });
        }
        const { imageUrl } = parse.data;

        const { rawText } = await detectText(imageUrl);
        const receiptId = uuidv4();

        // Basic splitting by newline for "raw items"
        // In a real app, we'd use bounding polys to group line items more intelligently
        const itemsRaw = rawText.split('\n').filter((line) => line.trim().length > 3).map((line) => ({
            nameRaw: line,
            quantity: 1, // default
        }));

        return res.json({
            receiptId,
            rawText,
            items: itemsRaw, // Return these for the frontend to pass back to normalize if needed, or normalize immediately
        });
    } catch (error: any) {
        console.error('❌ OCR/Normalization Error:', error);
        console.error('Details:', error.message, error.stack);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
        res.status(500).json({ error: 'Failed to process receipt', details: error.message });
    }
});

// POST /api/normalize-items
receiptsRouter.post('/normalize-items', async (req: Request, res: Response) => {
    try {
        const parse = NormalizeRequestSchema.safeParse(req.body);
        if (!parse.success) {
            return res.status(400).json({ error: parse.error });
        }
        const { itemsRaw, rawText } = parse.data;

        // Use rawText if available for better context, otherwise use itemsRaw
        const context = rawText || itemsRaw.map(i => i.nameRaw).join('\n');

        const prompt = `
    You are a grocery product normalizer. Convert noisy OCR line items into normalized JSON.
    Output array only. For each line, return:
    { "nameNorm": string, "category": string, "quantity": number, "unit": "count"|"g"|"ml"|"kg"|"l"|"lb"|"oz", "unitPrice": number|null, "lineTotal": number|null, "confidence": 0..1 }
    
    Rules:
    - Use common grocery taxonomy for category (e.g., Produce, Dairy, Meat, Pantry, Frozen, Beverages, Household).
    - Use metric units when possible.
    - If quantity is unknown, infer 1 count.
    - Extract price if visible in the line text.
    - Be conservative with confidence if unsure.
    - Output MUST be valid JSON array.

    INPUT_TEXT:
    ${context}
    `;

        const normalizedItems = await generateContent(prompt);

        // Fallback if LLM fails or returns empty
        if (!normalizedItems || !Array.isArray(normalizedItems)) {
            console.error("Gemini returned invalid structure", normalizedItems);
            return res.status(500).json({ error: "Failed to normalize items" });
        }

        // Helper function to normalize item names (handle plurals)
        const normalizeItemName = (name: string): string => {
            const lower = name.toLowerCase().trim();
            // Remove trailing 's' for common plurals (simple heuristic)
            // Avoid removing 's' from words that end in 'ss' (e.g., 'grass')
            if (lower.endsWith('s') && !lower.endsWith('ss') && lower.length > 2) {
                return lower.slice(0, -1);
            }
            return lower;
        };

        // Consolidate duplicate items (Problem 3: merge identical items in single scan)
        const consolidated = new Map<string, any>();

        normalizedItems.forEach((item: any) => {
            const normalizedName = normalizeItemName(item.nameNorm || 'unknown');
            const key = `${normalizedName}-${item.unit || 'count'}`;

            if (consolidated.has(key)) {
                // Merge quantities
                const existing = consolidated.get(key)!;
                existing.quantity = (existing.quantity || 1) + (item.quantity || 1);

                // Average prices if both exist
                if (item.unitPrice && existing.unitPrice) {
                    const count = existing._priceCount || 1;
                    existing.unitPrice = ((existing.unitPrice * count) + item.unitPrice) / (count + 1);
                    existing._priceCount = count + 1;
                } else if (item.unitPrice) {
                    existing.unitPrice = item.unitPrice;
                }

                // Sum line totals if both exist
                if (item.lineTotal && existing.lineTotal) {
                    existing.lineTotal += item.lineTotal;
                } else if (item.lineTotal) {
                    existing.lineTotal = item.lineTotal;
                }

                // Keep highest confidence
                if (item.confidence && existing.confidence) {
                    existing.confidence = Math.max(existing.confidence, item.confidence);
                }
            } else {
                consolidated.set(key, { ...item, _priceCount: 1 });
            }
        });

        // Remove internal tracking fields and convert to array
        const finalItems = Array.from(consolidated.values()).map(item => {
            const { _priceCount, ...cleanItem } = item;
            return cleanItem;
        });

        return res.json({ items: finalItems });
    } catch (error) {
        console.error('Normalize Route Error:', error);
        return res.status(500).json({ error: 'Failed to normalize items' });
    }
});

