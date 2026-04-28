export function buildAnalyzePrompt(
  content: string,
  task: 'review' | 'bugs' | 'optimize' | 'explain' = 'review',
): string {
  const taskInstructions: Record<string, string> = {
    review: 'Review the content for quality, clarity, structure, and accuracy.',
    bugs: 'Find logical errors, inconsistencies, factual mistakes, or broken references.',
    optimize:
      'Suggest concrete improvements for readability, structure, and engagement.',
    explain: 'Explain what this content is about in simple, plain language.',
  };

  return `You are an expert content analyst.
${taskInstructions[task]}

Return ONLY a valid JSON object with exactly these fields (no markdown, no backticks, no extra text):
{
  "analysis": "<detailed analysis as a single string>",
  "suggestions": ["<suggestion 1>", "<suggestion 2>"],
  "severity": "<one of: info | warning | error>"
}

Use severity "error" for critical issues, "warning" for moderate ones, "info" for minor or positive feedback.

Content to analyze:
${content}`;
}
