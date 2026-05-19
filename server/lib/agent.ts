import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('[agent.ts] WARNING: ANTHROPIC_API_KEY is not set. Calls will fail.');
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? 'missing' });

export type ModelId = 'claude-sonnet-4-6' | 'claude-haiku-4-5-20251001';

export interface CallOpts {
  system: string;
  messages: Anthropic.MessageParam[];
  model?: ModelId;
  maxTokens?: number;
  thinking?: { type: 'enabled'; budget_tokens: number };
  tools?: Anthropic.Tool[];
  cacheSystem?: boolean;
}

export interface CallResult {
  text: string;
  toolUses: Array<{ id: string; name: string; input: any }>;
  stopReason: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    costUSD: number;
  };
  raw: Anthropic.Message;
}

const PRICING: Record<ModelId, { in: number; out: number; cacheRead: number; cacheWrite: number }> = {
  'claude-sonnet-4-6': { in: 3, out: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  'claude-haiku-4-5-20251001': { in: 1, out: 5, cacheRead: 0.1, cacheWrite: 1.25 },
};

export async function callAgent(opts: CallOpts): Promise<CallResult> {
  const model = opts.model ?? 'claude-sonnet-4-6';
  const systemBlocks = opts.cacheSystem
    ? [{ type: 'text' as const, text: opts.system, cache_control: { type: 'ephemeral' as const } }]
    : opts.system;

  const msg = await client.messages.create({
    model,
    max_tokens: opts.maxTokens ?? 4096,
    system: systemBlocks as any,
    messages: opts.messages,
    ...(opts.thinking ? { thinking: opts.thinking } : {}),
    ...(opts.tools ? { tools: opts.tools } : {}),
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('\n');

  const toolUses = msg.content
    .filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
    .map(b => ({ id: b.id, name: b.name, input: b.input }));

  const pricing = PRICING[model];
  const u = msg.usage;
  const cacheRead = (u as any).cache_read_input_tokens ?? 0;
  const cacheWrite = (u as any).cache_creation_input_tokens ?? 0;
  const costUSD =
    (u.input_tokens * pricing.in +
      u.output_tokens * pricing.out +
      cacheRead * pricing.cacheRead +
      cacheWrite * pricing.cacheWrite) /
    1_000_000;

  return {
    text,
    toolUses,
    stopReason: msg.stop_reason ?? 'unknown',
    usage: {
      inputTokens: u.input_tokens,
      outputTokens: u.output_tokens,
      cacheReadTokens: cacheRead,
      cacheWriteTokens: cacheWrite,
      costUSD,
    },
    raw: msg,
  };
}
