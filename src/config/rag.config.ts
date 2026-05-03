export default () => ({
  rag: {
    provider: process.env.RAG_VECTOR_DB_PROVIDER,
    url: process.env.RAG_VECTOR_DB_URL,
    collection: process.env.RAG_VECTOR_COLLECTION,

    chunkSize: Number(process.env.RAG_CHUNK_SIZE) || 800,
    chunkOverlap: Number(process.env.RAG_CHUNK_OVERLAP) || 200,

    maxMessages: Number(process.env.RAG_CONVERSATION_MAX_MESSAGES) || 20,
  },
});
