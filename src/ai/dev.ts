import { config } from 'dotenv';
config();

const userApiKey = process.env['gemini_api _key'] || process.env.gemini_api_key;
if (userApiKey && !process.env.GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = userApiKey;
}

import '@/ai/flows/analyze-voice-recording.ts';
import '@/ai/flows/analyze-spiral-drawing.ts';
import '@/ai/flows/analyze-tapping-patterns.ts';
import '@/ai/flows/analyze-reaction-time.ts';
import '@/ai/flows/analyze-tremor.ts';
