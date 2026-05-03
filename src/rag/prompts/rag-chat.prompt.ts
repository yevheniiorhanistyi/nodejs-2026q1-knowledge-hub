export interface SourceChunk {
  articleTitle: string;
  chunkText: string;
}

export function buildRagChatPrompt(
  question: string,
  chunks: SourceChunk[],
  conversationHistory: Array<{ role: string; content: string }> = [],
): string {
  const context = chunks
    .map((c, i) => `[Source ${i + 1}: "${c.articleTitle}"]\n${c.chunkText}`)
    .join('\n\n---\n\n');

  const historyText =
    conversationHistory.length > 0
      ? conversationHistory
          .map(
            (m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`,
          )
          .join('\n')
      : '';

  return `You are a helpful knowledge base assistant. Answer the user's question based ONLY on the provided context below.
If the answer is not found in the context, say "I could not find relevant information in the knowledge base."
Always be concise and accurate. Do not make up information.

${historyText ? `Previous conversation:\n${historyText}\n\n` : ''}Context from Knowledge Hub:
${context}

User question: ${question}

Answer:`;
}
