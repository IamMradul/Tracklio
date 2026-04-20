const DEFAULT_GEMINI_MODEL = 'gemini-1.5-flash';

export const geminiModel = import.meta.env.VITE_GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
export const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
export const isGeminiConfigured = Boolean(geminiApiKey);

type GeminiCandidate = {
  content?: {
    parts?: Array<{ text?: string }>;
  };
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
  error?: {
    message?: string;
  };
};

export const generateGeminiText = async (prompt: string): Promise<string> => {
  if (!geminiApiKey) {
    throw new Error('Gemini API key is not configured.');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.5,
          topP: 0.9,
          maxOutputTokens: 900,
        },
      }),
    }
  );

  const payload = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    throw new Error(payload.error?.message || 'Gemini request failed.');
  }

  const text = payload.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? '')
    .join('')
    .trim();

  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }

  return text;
};
