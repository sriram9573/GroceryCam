import { NextResponse } from 'next/server';
import { generateContent } from '@/lib/services/gemini';

export async function POST(req: Request) {
    try {
        const { text, previousContext } = await req.json();
        if (!text) return NextResponse.json({ error: 'Text required' }, { status: 400 });

        const formattedContext = previousContext ? `Previous User Request: "${previousContext}". \n` : '';

        const prompt = `
        You are a smart kitchen assistant. 
        ${formattedContext}
        The user now said: "${text}".
        Classify the intent and extract entities.
        Output JSON only.

        Possible Intents:
        - ADD_ITEM: User wants to add something.
        - REMOVE_ITEM: User removed/used something.
        - GENERATE_RECIPES: User wants to cook/recipes.
        - ASK_CLARIFICATION: User wants to cook specific ingredient but didn't specify dish (e.g. "I want to cook chicken").
        - UNKNOWN: Anything else.

        Schema:
        {
        "intent": "ADD_ITEM" | "REMOVE_ITEM" | "GENERATE_RECIPES" | "ASK_CLARIFICATION" | "UNKNOWN",
        "item": { "name": string, "quantity": number, "unit": string } | null,
        "query": string | null, // For GENERATE_RECIPES (e.g. "Butter Chicken")
        "question": string | null // For ASK_CLARIFICATION (e.g. "Do you have a specific dish in mind for the chicken?")
        }

        Rules:
        1. ADD/REMOVE: Standard extraction.
        2. COOKING REQUESTS:
           - If user says "What can I cook?" (general) -> intent: GENERATE_RECIPES, query: null.
           - If user says "I want to cook chicken" (ingredient focus) -> intent: ASK_CLARIFICATION, question: "Do you have a specific dish in mind using chicken, or should I just look for any chicken recipes?"
           - If user says "Butter Chicken" (specific dish) -> intent: GENERATE_RECIPES, query: "Butter Chicken".
           
           **CONTEXT HANDLING (Crucial):**
           - If 'Previous User Request' exists (e.g. "Cook chicken") and current user input indicates NO SPECIFIC PREFERENCE (e.g., "No", "No preference", "I don't have any preference", "Any", "Whatever", "You choose", "Don't care"):
             -> You MUST extract the core ingredient from the *Previous* request (e.g. "Chicken") and use it as the query.
             -> Result: { intent: "GENERATE_RECIPES", query: "Chicken" }
           
           - If the input is SHORT (1-2 words) and sounds like a dish name (e.g., "Curry", "Pasta"), assume it is an answer -> intent: GENERATE_RECIPES, query: "${text}".
        `;

        const result = await generateContent(prompt);

        if (!result) return NextResponse.json({ intent: 'UNKNOWN' }, { status: 500 });
        const intentData = (result as any).intent ? result : (result as any);

        return NextResponse.json(intentData);
    } catch (error) {
        console.error("Intent Parse Error:", error);
        return NextResponse.json({ error: "Failed to parse intent" }, { status: 500 });
    }
}
