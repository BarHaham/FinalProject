import OpenAI from 'openai';

// All OpenAI configuration comes from the environment (Render env vars /
// backend/.env locally). The API key is never stored in code.
export const isAiEnabled = () => Boolean(process.env.OPENAI_API_KEY);

const getModel = () => process.env.OPENAI_MODEL || 'gpt-5-mini';
const getTimeoutMs = () => {
  const parsed = Number(process.env.OPENAI_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30000;
};

let client: OpenAI | null = null;
const getClient = (): OpenAI => {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: getTimeoutMs(),
      maxRetries: 0,
    });
  }
  return client;
};

export type JsonSchemaSpec = {
  name: string;
  schema: Record<string, unknown>;
};

export type CompleteJsonOptions<T> = {
  system: string;
  user: string;
  schema: JsonSchemaSpec;
  // Returns an error description when the parsed value is unacceptable, else null.
  // The error text is fed back to the model on retry.
  validate?: (value: T) => string | null;
  maxRetries?: number;
};

export class AiUnavailableError extends Error {
  constructor(message = 'AI is not configured') {
    super(message);
    this.name = 'AiUnavailableError';
  }
}

// One structured-output completion with parse/validate feedback retries.
// Do not log prompt contents here — they contain user profile data.
export const completeJson = async <T>(options: CompleteJsonOptions<T>): Promise<T> => {
  if (!isAiEnabled()) {
    throw new AiUnavailableError();
  }

  const maxRetries = options.maxRetries ?? 1;
  const messages: { role: 'system' | 'user'; content: string }[] = [
    { role: 'system', content: options.system },
    { role: 'user', content: options.user },
  ];

  let lastError = 'unknown error';
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    let response;
    try {
      response = await getClient().chat.completions.create({
        model: getModel(),
        messages,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: options.schema.name,
            strict: true,
            schema: options.schema.schema as Record<string, unknown>,
          },
        },
      });
    } catch (apiError: any) {
      // Transient API/network/timeout failures also deserve the retry budget.
      lastError = `API error: ${String(apiError?.message || apiError).slice(0, 200)}`;
      if (attempt < maxRetries) continue;
      throw apiError;
    }

    const content = response.choices[0]?.message?.content || '';
    let parsed: T | null = null;
    try {
      parsed = JSON.parse(content) as T;
    } catch {
      lastError = 'Response was not valid JSON.';
    }

    if (parsed !== null) {
      const validationError = options.validate ? options.validate(parsed) : null;
      if (!validationError) {
        return parsed;
      }
      lastError = validationError;
    }

    if (attempt < maxRetries) {
      messages.push({
        role: 'user',
        content: `Your previous answer was rejected: ${lastError} Respond again following every rule exactly.`,
      });
    }
  }

  throw new Error(`AI response failed validation: ${lastError}`);
};

export const currentModelName = getModel;
