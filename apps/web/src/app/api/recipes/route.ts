import { NextResponse } from 'next/server';
import { generateContent } from '@/lib/services/gemini';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { items, query } = await req.json();

        if (!items || !Array.isArray(items)) {
            return NextResponse.json({ error: 'Valid pantry items array required' }, { status: 400 });
        }

        const pantryList = items.map((i: any) => `- ${i.name} (${i.qty} ${i.unit})`).join('\n');

        let promptContext = "";
        let strictConstraint = "CRITICAL: usage of pantry items is MANDATORY. Do NOT generate generic recipes.";

        if (query) {
            promptContext = `USER REQUEST: "${query}".You MUST generate recipes that match this request(e.g.if 'Chicken', every recipe must update Chicken). 
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
            if (recipes && (recipes as any).recipes) return NextResponse.json({ recipes: (recipes as any).recipes });
            console.error("Gemini returned invalid structure", recipes);
            return NextResponse.json({ error: "Failed to generate recipes" }, { status: 500 });
        }

        return NextResponse.json({ recipes });
    } catch (error) {
        console.error("Recipe Gen Error:", error);
        return NextResponse.json({ error: "Failed to generate recipes" }, { status: 500 });
    }
}
