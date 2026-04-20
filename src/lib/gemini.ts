const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_FALLBACK_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-latest'];
const GEMINI_API_VERSIONS = ['v1beta', 'v1'] as const;

const normalizeGeminiModel = (model: string | undefined) => {
  const value = (model || DEFAULT_GEMINI_MODEL).trim();
  if (!value) {
    return DEFAULT_GEMINI_MODEL;
  }

  // Accept either "gemini-..." or "models/gemini-..." in env config.
  return value.replace(/^models\//, '');
};

export const geminiModel = normalizeGeminiModel(import.meta.env.VITE_GEMINI_MODEL as string | undefined);
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

const buildGeminiUrl = (model: string, apiVersion: typeof GEMINI_API_VERSIONS[number]) => (
  `https://generativelanguage.googleapis.com/${apiVersion}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(geminiApiKey || '')}`
);

const requestGeminiTextForModel = async (
  prompt: string,
  model: string,
  apiVersion: typeof GEMINI_API_VERSIONS[number]
) => {
  const response = await fetch(buildGeminiUrl(model, apiVersion), {
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
  });

  const payload = (await response.json()) as GeminiResponse;
  const errorMessage = payload.error?.message || 'Gemini request failed.';

  if (!response.ok) {
    const isApiBlocked = /are blocked|permission denied|access denied|api key not valid/i.test(errorMessage);
    return {
      ok: false as const,
      errorMessage,
      isModelProblem: /not found|not supported|unsupported/i.test(errorMessage),
      isApiBlocked,
    };
  }

  const text = payload.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? '')
    .join('')
    .trim();

  if (!text) {
    return {
      ok: false as const,
      errorMessage: 'Gemini returned an empty response.',
      isModelProblem: false,
      isApiBlocked: false,
    };
  }

  return {
    ok: true as const,
    text,
  };
};

export const generateGeminiText = async (prompt: string): Promise<string> => {
  if (!geminiApiKey) {
    throw new Error('Gemini API key is not configured.');
  }

  const triedModels = new Set<string>();
  const modelsToTry = [geminiModel, ...GEMINI_FALLBACK_MODELS].filter((model) => {
    if (triedModels.has(model)) {
      return false;
    }
    triedModels.add(model);
    return true;
  });

  let lastError = 'Gemini request failed.';

  for (const apiVersion of GEMINI_API_VERSIONS) {
    for (const model of modelsToTry) {
      const result = await requestGeminiTextForModel(prompt, model, apiVersion);
      if (result.ok) {
        return result.text;
      }

      lastError = result.errorMessage;

      // If the whole version is blocked, move to the next API version.
      if (result.isApiBlocked) {
        break;
      }

      if (!result.isModelProblem) {
        break;
      }
    }
  }

  if (/are blocked|permission denied|access denied|api key not valid/i.test(lastError)) {
    throw new Error(
      'Gemini API access is blocked for the current API key. Use a Gemini API key from Google AI Studio and ensure Generative Language API access is enabled for your project.'
    );
  }

  throw new Error(lastError);
};
