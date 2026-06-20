import fs from 'fs';
import path from 'path';
import { pool } from '../db';

export type BuildSystemPromptParams = {
  workspace_name: string;
  owner_name: string;
  ai_name: string;
  office_address: string;
  office_maps_link: string;
  language_default: string;
  market: string;
  property_list_json: string;
  available_slots_json: string;
  booked_slots_json: string;
  min_property_price: string;
  max_property_price: string;
  currency: string;
  followup_max: string;
  no_msg_after_hour: string;
  document_chunks_json: string;
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type VisionAttachment = {
  mimeType: string;
  base64: string;
  caption?: string;
};

export type AIRequestOptions = {
  visionAttachment?: VisionAttachment;
};

export type AIResponseResult = {
  text: string;
  model_used: string;
  input_tokens: number;
  output_tokens: number;
  fallback_used: boolean;
};

type AIProvider = 'anthropic' | 'openai';

const PROMPT_CANDIDATES = [
  path.resolve(__dirname, '../prompts/ai-system-prompt-v3.md'),
  path.resolve(__dirname, '../../../files/ai-system-prompt-v3.md'),
];
const AI_TIMEOUT_MS = 8000;

let cachedFileTemplate: string | null = null;
let cachedDbPrompt: { version: number; content: string } | null = null;

function resolvePromptPath(): string {
  const found = PROMPT_CANDIDATES.find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error('ai-system-prompt-v3.md not found');
  }
  return found;
}

function loadMasterPromptTemplateFromFile(): string {
  if (cachedFileTemplate) return cachedFileTemplate;

  const content = fs.readFileSync(resolvePromptPath(), 'utf-8');
  const marker = '## THE MASTER SYSTEM PROMPT';
  const markerIndex = content.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error('Master prompt section not found in ai-system-prompt-v3.md');
  }

  const afterMarker = content.slice(markerIndex);
  const openFence = afterMarker.indexOf('```\n');
  const closeFence = afterMarker.indexOf('```', openFence + 4);
  if (openFence === -1 || closeFence === -1) {
    throw new Error('Master prompt code fence not found in ai-system-prompt-v3.md');
  }

  cachedFileTemplate = afterMarker.slice(openFence + 4, closeFence).trim();
  return cachedFileTemplate;
}

async function loadMasterPromptTemplate(): Promise<string> {
  try {
    const result = await pool.query<{ content: string; version: number }>(
      `SELECT content, version FROM prompt_versions
       WHERE is_active = true
       ORDER BY version DESC
       LIMIT 1`
    );

    const row = result.rows[0];
    const isPlaceholder =
      !row?.content?.trim() ||
      row.content.includes('see docs') ||
      row.content.length < 500;

    if (row?.content?.trim() && !isPlaceholder) {
      if (!cachedDbPrompt || cachedDbPrompt.version !== row.version) {
        cachedDbPrompt = { version: row.version, content: row.content.trim() };
      }
      return cachedDbPrompt.content;
    }
  } catch (error) {
    console.error('Failed to load prompt from DB, using file fallback:', error);
  }

  return loadMasterPromptTemplateFromFile();
}

export function invalidatePromptCache(): void {
  cachedDbPrompt = null;
}

export async function buildSystemPrompt(params: BuildSystemPromptParams): Promise<string> {
  let prompt = await loadMasterPromptTemplate();

  const replacements: Record<string, string> = {
    workspace_name: params.workspace_name,
    owner_name: params.owner_name,
    ai_name: params.ai_name,
    office_address: params.office_address,
    office_maps_link: params.office_maps_link,
    language_default: params.language_default,
    market: params.market,
    property_list_json: params.property_list_json,
    available_slots_json: params.available_slots_json,
    booked_slots_json: params.booked_slots_json,
    min_property_price: params.min_property_price,
    max_property_price: params.max_property_price,
    currency: params.currency,
    followup_max: params.followup_max,
    no_msg_after_hour: params.no_msg_after_hour,
    document_chunks_json: params.document_chunks_json,
  };

  for (const [key, value] of Object.entries(replacements)) {
    prompt = prompt.replaceAll(`{${key}}`, value);
  }

  if (!prompt.includes(params.document_chunks_json) && params.document_chunks_json !== '[]') {
    prompt += `\n\n## BROKER DOCUMENT EXCERPTS\n${params.document_chunks_json}\nOnly answer document questions from these excerpts. If no match, hand off to ${params.owner_name}.`;
  }

  return prompt;
}

function resolvePrimaryProvider(): AIProvider {
  const configured = (process.env.AI_PRIMARY_PROVIDER ?? 'auto').toLowerCase();
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY?.trim());
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY?.trim());

  if (configured === 'openai') return 'openai';
  if (configured === 'anthropic') return 'anthropic';

  if (hasOpenAI && !hasAnthropic) return 'openai';
  if (hasAnthropic && !hasOpenAI) return 'anthropic';
  if (hasAnthropic) return 'anthropic';
  if (hasOpenAI) return 'openai';

  throw new Error('No AI provider configured (set ANTHROPIC_API_KEY or OPENAI_API_KEY)');
}

async function callAnthropic(
  systemPrompt: string,
  history: ChatMessage[],
  fallbackUsed: boolean
): Promise<AIResponseResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514',
        max_tokens: Number(process.env.ANTHROPIC_MAX_TOKENS ?? 400),
        temperature: Number(process.env.ANTHROPIC_TEMPERATURE ?? 0.3),
        system: systemPrompt,
        messages: history.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${body}`);
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
      model?: string;
    };

    const text =
      data.content.find((block) => block.type === 'text')?.text?.trim() ?? '';

    return {
      text,
      model_used: data.model ?? (process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514'),
      input_tokens: data.usage?.input_tokens ?? 0,
      output_tokens: data.usage?.output_tokens ?? 0,
      fallback_used: fallbackUsed,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function callOpenAI(
  systemPrompt: string,
  history: ChatMessage[],
  fallbackUsed: boolean,
  options?: AIRequestOptions
): Promise<AIResponseResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  const vision = options?.visionAttachment;
  const openAiMessages: Array<Record<string, unknown>> = [
    { role: 'system', content: systemPrompt },
  ];

  for (let i = 0; i < history.length; i++) {
    const message = history[i];
    const isLastUser =
      i === history.length - 1 &&
      message.role === 'user' &&
      vision?.mimeType.startsWith('image/');

    if (isLastUser && vision) {
      openAiMessages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text:
              vision.caption?.trim() ||
              message.content ||
              'Customer sent this image about a property enquiry.',
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${vision.mimeType};base64,${vision.base64}`,
            },
          },
        ],
      });
      continue;
    }

    openAiMessages.push({ role: message.role, content: message.content });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        max_tokens: Number(process.env.OPENAI_MAX_TOKENS ?? process.env.ANTHROPIC_MAX_TOKENS ?? 400),
        temperature: Number(process.env.OPENAI_TEMPERATURE ?? process.env.ANTHROPIC_TEMPERATURE ?? 0.3),
        messages: openAiMessages,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${body}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
      model?: string;
    };

    const text = data.choices[0]?.message?.content?.trim() ?? '';

    return {
      text,
      model_used: data.model ?? (process.env.OPENAI_MODEL ?? 'gpt-4o-mini'),
      input_tokens: data.usage?.prompt_tokens ?? 0,
      output_tokens: data.usage?.completion_tokens ?? 0,
      fallback_used: fallbackUsed,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function estimateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  if (model.includes('gpt-4o-mini')) {
    return inputTokens * 0.00000015 + outputTokens * 0.0000006;
  }
  if (model.includes('claude')) {
    return inputTokens * 0.000003 + outputTokens * 0.000015;
  }
  return 0;
}

async function logAiUsage(params: {
  tenantId: string;
  conversationId: string | null;
  model: string;
  inputTokens: number;
  outputTokens: number;
  fallbackUsed: boolean;
}): Promise<void> {
  const costUsd = estimateCostUsd(params.model, params.inputTokens, params.outputTokens);

  await pool.query(
    `INSERT INTO ai_usage_log
       (tenant_id, conversation_id, model, input_tokens, output_tokens, cost_usd, fallback_used)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      params.tenantId,
      params.conversationId,
      params.model,
      params.inputTokens,
      params.outputTokens,
      costUsd,
      params.fallbackUsed,
    ]
  );
}

export async function getAIResponse(
  systemPrompt: string,
  history: ChatMessage[],
  tenantId: string,
  conversationId?: string | null,
  options?: AIRequestOptions
): Promise<AIResponseResult> {
  const primary = resolvePrimaryProvider();
  const fallbackEnabled = process.env.OPENAI_FALLBACK_ENABLED !== 'false';
  const hasVision = Boolean(options?.visionAttachment?.mimeType.startsWith('image/'));
  let result: AIResponseResult;

  try {
    if (primary === 'openai' || hasVision) {
      result = await callOpenAI(systemPrompt, history, false, options);
    } else {
      result = await callAnthropic(systemPrompt, history, false);
    }
  } catch (primaryError) {
    console.error(`${primary} failed, trying fallback:`, primaryError);

    if (!fallbackEnabled || hasVision) {
      throw primaryError;
    }

    try {
      if (primary === 'openai') {
        result = await callAnthropic(systemPrompt, history, true);
      } else {
        result = await callOpenAI(systemPrompt, history, true, options);
      }
    } catch (fallbackError) {
      console.error('AI fallback also failed:', fallbackError);
      throw primaryError;
    }
  }

  if (!result.text.trim()) {
    result.text =
      'Thanks for your message. Our team will follow up with you shortly with the details you need.';
  }

  await logAiUsage({
    tenantId,
    conversationId: conversationId ?? null,
    model: result.model_used,
    inputTokens: result.input_tokens,
    outputTokens: result.output_tokens,
    fallbackUsed: result.fallback_used,
  });

  return result;
}
