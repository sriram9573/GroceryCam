import { z } from 'zod';
import { ItemRawSchema, ItemNormSchema, PantryItemSchema, RecipeSchema } from './schemas';

// POST /api/ocr
export const OcrRequestSchema = z.object({
    imageUrl: z.string().url(),
    currency: z.string().optional(),
});
export type OcrRequest = z.infer<typeof OcrRequestSchema>;

export const OcrResponseSchema = z.object({
    receiptId: z.string(),
    storeName: z.string().optional(),
    rawText: z.string(),
    items: z.array(ItemRawSchema),
});
export type OcrResponse = z.infer<typeof OcrResponseSchema>;

// POST /api/normalize-items
export const NormalizeRequestSchema = z.object({
    itemsRaw: z.array(ItemRawSchema),
    rawText: z.string().optional(),
});
export type NormalizeRequest = z.infer<typeof NormalizeRequestSchema>;

export const NormalizeResponseSchema = z.object({
    items: z.array(ItemNormSchema),
});
export type NormalizeResponse = z.infer<typeof NormalizeResponseSchema>;

// POST /api/update-pantry
export const UpdatePantryRequestSchema = z.object({
    receiptId: z.string(),
    items: z.array(ItemNormSchema),
});
export type UpdatePantryRequest = z.infer<typeof UpdatePantryRequestSchema>;

export const UpdatePantryResponseSchema = z.object({
    merged: z.array(PantryItemSchema),
    upsertedCount: z.number(),
    updatedCount: z.number(),
});
export type UpdatePantryResponse = z.infer<typeof UpdatePantryResponseSchema>;

// GET /api/recipes
export const GetRecipesRequestSchema = z.object({
    budgetPerMeal: z.string().optional().transform(Number), // Query params often strings
    dietary: z.string().optional(), // Comma sep list
});
export type GetRecipesRequest = z.infer<typeof GetRecipesRequestSchema>;

export const GetRecipesResponseSchema = z.object({
    recipes: z.array(RecipeSchema),
});
export type GetRecipesResponse = z.infer<typeof GetRecipesResponseSchema>;
