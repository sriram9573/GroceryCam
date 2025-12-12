import { Router, Request, Response } from 'express';
import { db } from '../config/firebase.js';
import { verifyAuth } from '../middleware/auth.js';
import { generateContent } from '../services/gemini.js';

export const recipesRouter = Router();

recipesRouter.post('/recipes', async (req: Request, res: Response) => {
    try {
        const { items, query } = req.body; // items: { name, qty, unit }[], query: string (optional)

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: 'Valid pantry items array required' });
        }

        const pantryList = items.map((i: any) => `- ${i.name} (${i.qty} ${i.unit})`).join('\n');

        let promptContext = "";
        let strictConstraint = "CRITICAL: usage of pantry items is MANDATORY. Do NOT generate generic recipes.";

        if (query) {
            promptContext = `USER REQUEST: "${query}". You MUST generate recipes that match this request (e.g. if 'Chicken', every recipe must update Chicken). 
            If they don't have ingredients for "${query}", YOU MUST STILL SUGGEST RECIPES FOR "${query}" but mark missing ingredients as not inStock.`;
            strictConstraint = `Constraint: The User Query "${query}" is the PRIMARY constraint. Use pantry items where possible, but if they lack the main ingredient for "${query}", assume they will buy it.`;
        } else {
            promptContext = `Suggest 15 creative recipes using THESE ingredients. Prioritize recipes where they have most ingredients.`;
        }

        const prompt = `
        You are a Michelin-star chef helper.
        ${promptContext}

        My Pantry:
        ${pantryList}
        
        Output strictly valid JSON list of recipes. Each recipe should be an object with the following structure:
        { 
            "name": string, 
            "ingredients": [{ "name": string, "qty": number, "unit": string, "inStock": boolean }], 
            "steps": string[], 
            "estCost": number, 
            "cookTimeMin": number 
        }
        "inStock" should be true if the user has the item in their pantry (fuzzy match), and false if they need to buy it.
        ${strictConstraint}
        Every recipe should use at least one major ingredient from the provided list.
        
        PANTRY_JSON:
        ${JSON.stringify(items)}
        `;

        const recipes = await generateContent(prompt);

        if (!recipes || !Array.isArray(recipes)) {
            // Fallback for LLM sometimes wrapping in a "recipes" key
            if (recipes && (recipes as any).recipes) return res.json({ recipes: (recipes as any).recipes });
            console.error("Gemini returned invalid structure", recipes);
            return res.status(500).json({ error: "Failed to generate recipes" });
        }

        res.json({ recipes });

    } catch (error) {
        console.error("Recipe Gen Error:", error);
        res.status(500).json({ error: "Failed to generate recipes" });
    }
});

