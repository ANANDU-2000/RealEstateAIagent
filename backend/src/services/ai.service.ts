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
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type AIResponseResult = {
  text: string;
  model_used: string;
  input_tokens: number;
  output_tokens: number;
  fallback_used: boolean;
};

const PROMPT_PATH = path.resolve(__dirname, '../../../files/ai-system-prompt-v3.md');
const AI_TIMEOUT_MS = 8000;

let cachedTemplate: string | null = null;

function loadMasterPromptTemplate(): string {
  if (cachedTemplate) return cachedTemplate;

  const content = fs.readFileSync(PROMPT_PATH, 'utf-8');
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

  cachedTemplate = afterMarker.slice(openFence + 4, closeFence).trim();
  return cachedTemplate;
}

export function buildSystemPrompt(params: BuildSystemPromptParams): string {
  let prompt = loadMasterPromptTemplate();

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
  };

  for (const [key, value] of Object.entries(replacements)) {
    prompt = prompt.replaceAll(`{${key}}`, value);
  }

  return prompt;
}

async function callAnthropic(
  systemPrompt: string,
  history: ChatMessage[]
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
      fallback_used: false,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function callOpenAI(
  systemPrompt: string,
  history: ChatMessage[]
): Promise<AIResponseResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      max_tokens: Number(process.env.ANTHROPIC_MAX_TOKENS ?? 400),
      temperature: Number(process.env.ANTHROPIC_TEMPERATURE ?? 0.3),
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
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
    fallback_used: true,
  };
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
  conversationId?: string | null
): Promise<AIResponseResult> {
  let result: AIResponseResult;

  try {
    result = await callAnthropic(systemPrompt, history);
  } catch (anthropicError) {
    console.error('Anthropic failed, trying OpenAI fallback:', anthropicError);

    if (process.env.OPENAI_FALLBACK_ENABLED === 'false') {
      throw anthropicError;
    }

    result = await callOpenAI(systemPrompt, history);
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
