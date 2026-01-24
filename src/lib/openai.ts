import { OpenRouter } from '@openrouter/sdk';

if (!process.env.OPENROUTER_API_KEY) {
  console.warn('!!! WARNING: Missing OPENROUTER_API_KEY. AI calls will fail or fall back to mock data if logic allows. !!!');
} else {
  console.log('AI Client: OPENROUTER_API_KEY is present.');
}

export const openRouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || 'dummy-key-for-mock-mode',
});

// Default model
const DEFAULT_MODEL = process.env.AI_MODEL_ID || 'google/gemini-flash-1.5';

// Per-task model configuration - can be overridden via env vars
// Usage: Set AI_MODEL_CRITIQUE=anthropic/claude-sonnet-4 in .env.local
export const AI_MODELS = {
  // Fast/cheap model for simpler tasks
  critique: process.env.AI_MODEL_CRITIQUE || DEFAULT_MODEL,
  migration: process.env.AI_MODEL_MIGRATION || DEFAULT_MODEL,

  // Main model for complex analysis
  componentArchitect: process.env.AI_MODEL_COMPONENT || DEFAULT_MODEL,
  contentOptimizer: process.env.AI_MODEL_CONTENT || DEFAULT_MODEL,
  specification: process.env.AI_MODEL_SPECIFICATION || DEFAULT_MODEL,

  // High-quality model for final output (can use more expensive model)
  designSystem: process.env.AI_MODEL_DESIGN || DEFAULT_MODEL,
  implementation: process.env.AI_MODEL_IMPLEMENTATION || DEFAULT_MODEL,

  // Visual/Creative tasks
  mockup: process.env.AI_MODEL_MOCKUP || DEFAULT_MODEL,
  styleExtractor: process.env.AI_MODEL_STYLE || DEFAULT_MODEL,

  // Fallback
  default: DEFAULT_MODEL,
};

// Legacy exports for backward compatibility
export const MODEL_GEMINI_FLASH = DEFAULT_MODEL;
export const MODEL_OPUS = DEFAULT_MODEL;
export const MODEL_SONNET = DEFAULT_MODEL;
export const MODEL_GEMINI_REASONING = DEFAULT_MODEL;

console.log(`AI Client initialized. Default model: ${DEFAULT_MODEL}`);
