import { NextResponse } from 'next/server';
import { analyzeIntent } from '@/lib/services/gemini';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    let body;
    try {
        body = await req.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { text, previousContext, conversationHistory = [] } = body;
    if (!text) return NextResponse.json({ error: 'Text required' }, { status: 400 });

    try {
        // Build conversation history for context
        const historyText = conversationHistory
            .slice(-5) // Last 5 messages
            .map((msg: any) => `${msg.role === 'user' ? 'USER' : 'ASSISTANT'}: ${msg.content}`)
            .join('\n');

        const prompt = `You are GroceryCam AI, a smart and friendly kitchen assistant.

SYSTEM CONTEXT:
- Current Time: ${new Date().toLocaleString()}
- App Name: GroceryCam
- Capabilities: 
  1. Pantry Management (Add/Remove items via voice or manual input)
  2. Smart Scanning (Upload receipts OR scan individual ingredients via camera)
  3. Recipe Generation (Based on available pantry ingredients)
  4. Voice Assistant (Hands-free control)

CONVERSATION HISTORY:
${historyText || 'None'}

USER SAID: "${text}"

RULES:
1. GREETINGS: Respond warmly.
2. GENERAL KNOWLEDGE (time, facts, jokes): Answer naturally.
3. APP QUESTIONS: Enable users to discover features (especially scanning individual items).
4. "ADD ITEMS" (no items specified): Ask "What would you like to add?" and suggest "Scan Receipt".
5. RECIPES:
   - "Suggest recipes" -> GENERATE_RECIPES (Query: null)
   - "I want to cook chicken" -> ASK_CLARIFICATION (Confirm dish)
6. VALIDATION: 
   - IF user adds non-grocery items (e.g. "sunscreen", "shoes", "iphone"), REFUSE politely. 
   - Say: "I can only track grocery and pantry items."
   - Intent: GENERAL_RESPONSE.
7. VAGUE: Ask for clarification.

OUTPUT JSON schema:
{
  "intent": "GREETING|APP_INFO|ADD_ITEM|REMOVE_ITEM|ASK_CLARIFICATION|GENERATE_RECIPES|GENERAL_RESPONSE|VIEW_PANTRY|SCAN_RECEIPT",
  "response": "Your conversational response here. BE NATURAL.",
  "suggestions": ["Action 1", "Action 2"],
  "items": [
    { 
      "name": "item_name", 
      "quantity": 1, 
      "unit": "count",
      "category": "General", // e.g. Produce, Dairy, Meat
      "emoji": "📦" // e.g. 🍎, 🥛, 🥩
    }
  ], 
  "query": null
}

IMPORTANT: 
1. 'items' MUST be an array of OBJECTS.
2. ALWAYS infer the 'category' and 'emoji' for the item.
WRONG: [{"name": "banana", "quantity": 5}]
RIGHT: [{"name": "banana", "quantity": 5, "unit": "count", "category": "Fruit", "emoji": "🍌"}]

EXAMPLES:
"What time is it?" -> {"intent":"GENERAL_RESPONSE", "response":"It is currently ..."}
"Add items" -> {"intent":"ASK_CLARIFICATION", "response":"Sure! What items would you like to add? You can also scan them with your camera.", "suggestions":["Cancel", "Scan Items"]}
"5 bananas" -> {"intent":"ADD_ITEM","response":"Got it. Adding 5 bananas.","items":[{"name":"banana","quantity":5,"unit":"count","category":"Fruit","emoji":"🍌"}]}
"Remove 2 apples" -> {"intent":"REMOVE_ITEM","response":"Removed 2 apples from your pantry.","items":[{"name":"apple","quantity":2,"unit":"count","category":"Fruit","emoji":"🍎"}]}
"Add sunscreen" -> {"intent":"GENERAL_RESPONSE","response":"I can only help you track grocery and food items. Sunscreen doesn't belong in the pantry!","items":[]}
"Suggest recipes" -> {"intent":"GENERATE_RECIPES", "response":"Checking your pantry...", "query": null}
"Scan Items" -> {"intent":"SCAN_RECEIPT", "response":"Opening the scanner for you. You can scan receipts or ingredients!", "query": null}
"Scan this apple" -> {"intent":"SCAN_RECEIPT", "response":"Sure! Opening scanner...", "query": null}

NOW RESPOND AS JSON.`;

        const result = await analyzeIntent(prompt);

        if (!result) {
            console.error("Gemini returned null/undefined, using fallback rules.");
            return NextResponse.json(getFallbackResponse(text));
        }

        // Ensure response field exists
        const intentData = (result as any).intent ? result : (result as any);
        if (!intentData.response) {
            console.warn("No response field in result, using fallback");
            const fallback = getFallbackResponse(text);
            intentData.response = fallback.response;
            intentData.intent = fallback.intent;
        }

        return NextResponse.json(intentData);

    } catch (error: any) {
        console.error("Intent Parse Error:", error);
        // Even on error, return fallback response
        return NextResponse.json(getFallbackResponse(text || ""));
    }
}

// Helper for offline/fallback responses
function getFallbackResponse(text: string) {
    // Only use fallbacks if the API completely fails
    return {
        intent: 'GENERAL_RESPONSE',
        response: "I'm having trouble connecting to my brain right now. 🧠\nPlease check your internet or try again in a moment.",
        suggestions: ["Try again"]
    };
}
