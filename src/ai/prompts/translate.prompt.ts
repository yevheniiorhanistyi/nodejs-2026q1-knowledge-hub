export function buildTranslatePrompt(
  content: string,
  targetLanguage: string,
  sourceLanguage?: string,
): string {
  const sourcePart = sourceLanguage ? `from ${sourceLanguage} ` : '';

  return `You are a professional translator.
Translate the following text ${sourcePart}to ${targetLanguage}.

Return ONLY a valid JSON object with exactly these two fields (no markdown, no backticks, no extra text):
{
  "translatedText": "<full translated text here>",
  "detectedLanguage": "<detected or provided source language name in English>"
}

Text to translate:
${content}`;
}
