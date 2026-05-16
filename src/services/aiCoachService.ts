/**
 * AI Coach service — Gemini API integration
 *
 * Sports-focused AI coach with guardrails to stay within domain.
 * Uses temperature, topP, and topK for controlled generation.
 * Includes retry logic for rate limit errors.
 */

import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';

const SYSTEM_INSTRUCTION = `You are Stridely Coach, an expert AI sports coach specializing in running, cycling, and swimming. 

STRICT GUARDRAILS:
- ONLY answer questions related to: training plans, workout advice, injury prevention, nutrition for athletes, race preparation, pacing strategies, recovery, sports gear, and general fitness for endurance sports.
- If asked about ANYTHING outside your domain (politics, coding, general knowledge, etc.), politely decline: "I'm your sports coach! I can help with running, cycling, swimming, training, nutrition, and recovery. Ask me anything about those topics! 🏃‍♂️"
- Keep responses concise (under 200 words) unless the user asks for a detailed plan.
- Use emoji sparingly for encouragement (🏃‍♂️🚴‍♀️🏊‍♂️💪🎯).
- Be motivational, supportive, and knowledgeable.
- When giving training advice, always consider safety and recommend consulting a doctor for injuries.`;

/** Model fallback order — tries each until one works */
const MODEL_NAMES = ['gemini-2.5-flash', 'gemini-2.0-flash'];

let model: GenerativeModel | null = null;
let activeModelName: string = MODEL_NAMES[0];

function getModel(modelName?: string): GenerativeModel {
  const name = modelName ?? activeModelName;
  if (model && name === activeModelName) return model;

  const genAI = new GoogleGenerativeAI(API_KEY);
  model = genAI.getGenerativeModel({
    model: name,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 512,
    },
  });
  activeModelName = name;
  return model;
}

export interface CoachMessage {
  id: string;
  role: 'user' | 'coach';
  text: string;
  timestamp: number;
}

/**
 * Send a message to the AI coach and get a response.
 * Includes conversation history for context.
 * Falls back to alternate models if rate-limited.
 */
export async function sendCoachMessage(
  userMessage: string,
  history: CoachMessage[]
): Promise<string> {
  if (!API_KEY) {
    throw new Error('Gemini API key is not configured');
  }

  const chatHistory = history.map((msg) => ({
    role: msg.role === 'coach' ? 'model' as const : 'user' as const,
    parts: [{ text: msg.text }],
  }));

  // Try each model in fallback order
  let lastError: Error | null = null;
  for (const modelName of MODEL_NAMES) {
    try {
      const m = getModel(modelName);
      const chat = m.startChat({ history: chatHistory });
      const result = await chat.sendMessage(userMessage);
      return result.response.text();
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const msg = lastError.message;

      // If rate-limited (429), try next model
      if (msg.includes('429') || msg.includes('quota') || msg.includes('Too Many Requests')) {
        model = null; // Reset so next iteration creates a new model
        continue;
      }

      // For non-quota errors, throw immediately
      throw lastError;
    }
  }

  // All models exhausted — provide helpful error
  throw new Error(
    'All models are currently rate-limited. Please wait a moment and try again.'
  );
}
