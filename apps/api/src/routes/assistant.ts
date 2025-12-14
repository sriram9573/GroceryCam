import { Router, Request, Response } from 'express';
import { generateContent } from '../services/gemini.js';

export const assistantRouter = Router();

assistantRouter.post('/parse-intent', async (req: Request, res: Response) => {
  try {
    const { text, previousContext, conversationHistory = [] } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });

    // Build conversation history for context
    const historyText = conversationHistory
      .slice(-5) // Last 5 messages
      .map((msg: any) => `${msg.role === 'user' ? 'USER' : 'ASSISTANT'}: ${msg.content}`)
      .join('\n');

    const prompt = `You are GroceryCam AI, a friendly kitchen assistant. Follow these rules EXACTLY.

CONVERSATION HISTORY:
${historyText || 'None'}

USER SAID: "${text}"

RULES:
1. GREETINGS (hi, hello, how are you): Respond warmly and offer help
2. APP INFO (what can you do, help): List ALL features clearly
3. ADD ITEMS (add 3 apples): Extract items, confirm addition
4. RECIPE REQUESTS: ALWAYS ask for confirmation, NEVER auto-generate
5. VAGUE (yeah, ok): Ask what they want to do

OUTPUT JSON:
{
  "intent": "GREETING|APP_INFO|ADD_ITEM|REMOVE_ITEM|ASK_CLARIFICATION|GENERATE_RECIPES|GENERAL_RESPONSE",
  "response": "Your friendly response text",
  "suggestions": ["Action 1", "Action 2"],
  "items": [{"name": "apple", "quantity": 3, "unit": "count"}],
  "query": "dish name for recipes"
}

EXAMPLES:

"Hi" →
{"intent":"GREETING","response":"Hi there! 👋 I'm doing great! How can I help you today?","suggestions":["Add items","Get recipes"]}

"How are you?" →
{"intent":"GREETING","response":"I'm wonderful, thanks for asking! 😊 What would you like to do?","suggestions":["Add items","Get recipes"]}

"What can you do?" →
{"intent":"APP_INFO","response":"I can help you with:\\n\\n📦 Manage pantry - add/remove items\\n🍳 Generate recipe ideas\\n📸 Scan receipts\\n🎤 Voice commands\\n\\nWhat would you like to try?","suggestions":["Add items","Get recipes"]}

"Add 3 apples" →
{"intent":"ADD_ITEM","response":"Got it! Adding 3 apples to your pantry. 🍎","items":[{"name":"apple","quantity":3,"unit":"count"}]}

"What can I cook?" →
{"intent":"ASK_CLARIFICATION","response":"I'd love to help! What kind of dish are you in the mood for?","suggestions":["Suggest recipes","I'll tell you"]}

"Butter chicken" →
{"intent":"ASK_CLARIFICATION","response":"Butter chicken sounds delicious! 🍗 Would you like me to find recipes for you?","query":"butter chicken","suggestions":["Yes please","No thanks"]}

"Yes" (after asking about recipes) →
{"intent":"GENERATE_RECIPES","response":"Great! Finding delicious recipes for you...","query":"butter chicken"}

NOW RESPOND. Output ONLY valid JSON, nothing else.`;

    const result = await generateContent(prompt);

    console.log("Gemini Raw Result:", result);

    if (!result) {
      console.error("Gemini returned null/undefined, using fallback rules.");
      return res.json(getFallbackResponse(text));
    }

    // Ensure response field exists
    const intentData = (result as any).intent ? result : (result as any);
    if (!intentData.response) {
      console.warn("No response field in result, using fallback");
      const fallback = getFallbackResponse(text);
      intentData.response = fallback.response;
      intentData.intent = fallback.intent;
    }

    console.log("Sending response:", intentData);
    res.json(intentData);

  } catch (error: any) {
    console.error("Intent Parse Error:", error);
    // Even on error, try to give a helpful response based on keywords
    res.json(getFallbackResponse(req.body.text || ""));
  }
});

// Helper for offline/fallback responses
function getFallbackResponse(text: string) {
  const lower = text.toLowerCase();

  if (lower.match(/\b(hi|hello|hey|greetings)\b/)) {
    return {
      intent: 'GREETING',
      response: "Hi there! 👋 I'm your updated GroceryCam AI. I can help you manage your pantry, find recipes, or answer questions about the app. How can I help?",
      suggestions: ["What can you do?", "Add items", "Recipe ideas"]
    };
  }

  if (lower.match(/\b(how are you|how is it going)\b/)) {
    return {
      intent: 'GREETING',
      response: "I'm doing great, thanks for asking! 😊 I'm ready to help you with your groceries and cooking. What's on your mind?",
      suggestions: ["What can you do?", "Check pantry"]
    };
  }

  if (lower.match(/\b(what can you do|help|capabilities|features|what is this app)\b/)) {
    return {
      intent: 'APP_INFO',
      response: "I'm GroceryCam, your smart kitchen assistant! 🤖\n\nI can help you:\n📦 Manage your pantry (add/remove items)\n📸 Scan receipts automatically\n🍳 Suggest recipes based on your ingredients\n🎤 Take voice commands\n\nTry saying 'Add 3 apples' or 'What can I cook?'!",
      suggestions: ["Add items", "Recipe ideas"]
    };
  }

  if (lower.match(/\b(cook|recipe|recipes|dinner|lunch|breakfast)\b/)) {
    return {
      intent: 'ASK_CLARIFICATION',
      response: "That sounds tasty! 😋 What kind of dish are you in the mood for? Or should I suggest something based on your pantry?",
      suggestions: ["Suggest recipes", "I'll choose"]
    };
  }

  return {
    intent: 'GENERAL_RESPONSE',
    response: "I'm listening! You can ask me to add items, find recipes, or explain what I can do. What would you like to try?",
    suggestions: ["What can you do?", "Add items"]
  };
}
