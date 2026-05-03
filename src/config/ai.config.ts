export default () => ({
  ai: {
    apiKey: process.env.GEMINI_API_KEY,
    baseUrl: process.env.GEMINI_API_BASE_URL,
    model: process.env.GEMINI_MODEL,
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL,

    rateLimitRpm: Number(process.env.AI_RATE_LIMIT_RPM) || 20,
    cacheTtlSec: Number(process.env.AI_CACHE_TTL_SEC) || 300,
  },
});
