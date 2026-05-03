export function buildSummarizePrompt(
  content: string,
  maxLength: 'short' | 'medium' | 'detailed' = 'medium',
): string {
  const lengthInstructions = {
    short: 'in 2-3 sentences (max 100 words)',
    medium: 'in 1 short paragraph (max 250 words)',
    detailed: 'in 3-5 paragraphs covering all key points',
  };

  return `You are a professional content summarizer.
Summarize the following article ${lengthInstructions[maxLength]}.
Return ONLY the summary text, no preamble, no labels, no markdown.

Article:
${content}`;
}
