import { z } from 'zod';

export const UserSchema = z.object({
    uid: z.string(),
    email: z.string().email(),
    displayName: z.string().optional(),
    createdAt: z.string().or(z.date()), // Firestore timestamp behavior
});

export const ItemRawSchema = z.object({
    nameRaw: z.string(),
    quantity: z.number().optional().default(1),
    unitPrice: z.number().optional(),
    lineTotal: z.number().optional(),
    confidence: z.number().optional(),
});

export const ItemNormSchema = z.object({
    nameNorm: z.string(),
    category: z.string(),
    quantity: z.number(),
    unit: z.enum(['count', 'g', 'ml', 'kg', 'l', 'lb', 'oz']), // Expanded units
    unitPrice: z.number().nullable(),
    lineTotal: z.number().nullable(),
    confidence: z.number(),
});

export const ReceiptSchema = z.object({
    id: z.string(),
    userId: z.string(),
    imageUrl: z.string(),
    detectedAt: z.string(),
    storeName: z.string().optional(),
    currency: z.string().default('USD'),
    subtotal: z.number().optional(),
    tax: z.number().optional(),
    total: z.number().optional(),
    rawText: z.string().optional(),
    items: z.array(ItemNormSchema),
});

export const PriceHistoryPointSchema = z.object({
    price: z.number(),
    date: z.string(),
});

export const PantryItemSchema = z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    quantity: z.number(),
    unit: z.string(),
    updatedAt: z.string(),
    priceHistory: z.array(PriceHistoryPointSchema).default([]),
});

export const IngredientSchema = z.object({
    name: z.string(),
    qty: z.number(),
    unit: z.string(),
    inStock: z.boolean().optional().default(true),
});

export const RecipeSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    userId: z.string().optional(),
    ingredients: z.array(IngredientSchema),
    steps: z.array(z.string()),
    estCost: z.number(),
    cookTimeMin: z.number(),
});

export type User = z.infer<typeof UserSchema>;
export type ItemRaw = z.infer<typeof ItemRawSchema>;
export type ItemNorm = z.infer<typeof ItemNormSchema>;
export type Receipt = z.infer<typeof ReceiptSchema>;
export type PantryItem = z.infer<typeof PantryItemSchema>;
export type Recipe = z.infer<typeof RecipeSchema>;
