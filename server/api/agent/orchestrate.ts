import Anthropic from '@anthropic-ai/sdk';
import { MASTER_SYSTEM } from '../../lib/prompts';

export const config = { runtime: 'edge' };

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' });

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'signal_fuse',
    description: 'Fuse multi-source raw data into unified signal package. Call FIRST.',
    input_schema: { type: 'object', properties: { rawData: { type: 'object' } }, required: ['rawData'] },
  },
  {
    name: 'outbreak_eye',
    description: 'Classify crises from fused signal. Call after signal_fuse.',
    input_schema: { type: 'object', properties: { fusedSignal: { type: 'object' } }, required: ['fusedSignal'] },
  },
  {
    name: 'severity_mind',
    description: 'Compute 5-factor DRI + visible chain-of-thought reasoning for ALL detected crises in one call. Pass the full crises array.',
    input_schema: { type: 'object', properties: { crises: { type: 'array' } }, required: ['crises'] },
  },
  {
    name: 'resource_forge',
    description: 'Allocate constrained resources across crises with tradeoff reasoning.',
    input_schema: { type: 'object', properties: { crises: { type: 'array' }, assessments: { type: 'array' } }, required: ['crises'] },
  },
  {
    name: 'crisis_sim',
    description: 'Simulate impact + generate stakeholder messages (Urdu+Eng).',
    input_schema: { type: 'object', properties: { allocation: { type: 'object' }, crises: { type: 'array' } }, required: ['allocation'] },
  },
  {
    name: 'recovery_guard',
    description: 'Verify classifications, detect false positives, resolve conflicts. Call as final verification.',
    input_schema: { type: 'object', properties: { crises: { type: 'array' }, newEvidence: { type: 'array' } }, required: ['crises'] },
  },
  {
    name: 'trend_spy',
    description: 'Get Google Trends anomaly score for a dengue keyword.',
    input_schema: { type: 'object', properties: { keyword: { type: 'string' } }, required: ['keyword'] },
  },
  {
    name: 'citizen_signal',
    description: 'Process aggregated citizen reports. ONLY call when prefetched citizenReports array is non-empty. Skip otherwise — individual reports go through Vision endpoint.',
    input_schema: { type: 'object', properties: { reports: { type: 'array' } }, required: ['reports'] },
  },
];

function sse(data: any): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function normalizeUsage(u: any, model: 'claude-sonnet-4-6' | 'claude-haiku-4-5-20251001' = 'claude-sonnet-4-6') {
  const input = u?.input_tokens ?? u?.inputTokens ?? 0;
  const output = u?.output_tokens ?? u?.outputTokens ?? 0;
  const cacheRead = u?.cache_read_input_tokens ?? u?.cacheReadTokens ?? 0;
  const cacheWrite = u?.cache_creation_input_tokens ?? u?.cacheWriteTokens ?? 0;
  const pricing = model === 'claude-sonnet-4-6'
    ? { in: 3, out: 15, cacheRead: 0.3, cacheWrite: 3.75 }
    : { in: 1, out: 5, cacheRead: 0.1, cacheWrite: 1.25 };
  const costUSD = (input * pricing.in + output * pricing.out + cacheRead * pricing.cacheRead + cacheWrite * pricing.cacheWrite) / 1_000_000;
  return { inputTokens: input, outputTokens: output, cacheReadTokens: cacheRead, cacheWriteTokens: cacheWrite, costUSD };
}

export default async function handler(req: Request) {
  const body = await req.json();
  const { location, runId, prefetchedData } = body;
  const baseURL = new URL(req.url).origin;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let closed = false;
      const emit = (event: any) => {
        if (closed) return;
        try { controller.enqueue(encoder.encode(sse(event))); } catch { closed = true; }
      };
      // Keepalive ping every 10s prevents idle disconnect + keeps libuv socket flushing on Windows.
      const keepalive = setInterval(() => {
        if (closed) return;
        try { controller.enqueue(encoder.encode(`: ping ${Date.now()}\n\n`)); } catch { closed = true; }
      }, 10_000);
      const closeAll = () => { closed = true; clearInterval(keepalive); try { controller.close(); } catch {} };

      const stepCounter = { value: 0 };
      const nextStep = () => ++stepCounter.value;

      const antigravityMeta = (extras: Record<string, any> = {}) => ({
        _antigravity: {
          schemaVersion: '1.0.0',
          workspace: 'denguesat-ciro',
          runId,
          parentRunId: null,
          stepIndex: nextStep(),
          orchestrator: 'claude-master-coordinator',
          model: 'claude-haiku-4-5-20251001',
          thinkingEnabled: false,
          ...extras,
        },
      });

      emit({ type: 'master.start', runId, location, timestamp: Date.now(), ...antigravityMeta({ phase: 'init', toolsAvailable: TOOLS.map(t => t.name) }) });

      let messages: Anthropic.MessageParam[] = [
        {
          role: 'user',
          content: `Run full crisis analysis for ${location.district}, ${location.city}, ${location.province}.

Prefetched raw data:
\`\`\`json
${JSON.stringify(prefetchedData, null, 2)}
\`\`\`

Run your protocol. Use the tools. Return final summary when done.`,
        },
      ];

      const MAX_ITERS = 12;
      let totalCost = 0;
      let masterDoneEmitted = false;

      for (let iter = 0; iter < MAX_ITERS; iter++) {
        let msg: Anthropic.Message | null = null;
        let lastErr: any = null;
        // Retry on 429 rate-limit with exponential backoff.
        for (let attempt = 0; attempt < 4; attempt++) {
          try {
            msg = await client.messages.create({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: 4096,
              system: MASTER_SYSTEM,
              tools: TOOLS,
              messages,
            });
            lastErr = null;
            break;
          } catch (err: any) {
            lastErr = err;
            const errStr = String(err);
            const is429 = errStr.includes('429') || errStr.includes('rate_limit');
            if (!is429 || attempt === 3) break;
            // Prefer Retry-After header from Anthropic if present, else exponential backoff.
            const headerRetry = err?.headers?.['retry-after'] ?? err?.headers?.get?.('retry-after');
            const headerMs = headerRetry ? Number(headerRetry) * 1000 : NaN;
            const waitMs = Number.isFinite(headerMs) && headerMs > 0 ? Math.min(headerMs, 90_000) : (attempt + 1) * 20_000;
            emit({ type: 'tool.error', iter, name: 'master', error: `429 retry ${attempt + 1} in ${waitMs}ms${headerRetry ? ' (Retry-After)' : ''}`, timestamp: Date.now() });
            await new Promise(r => setTimeout(r, waitMs));
          }
        }
        if (!msg) {
          emit({ type: 'tool.error', iter, name: 'master', error: String(lastErr), timestamp: Date.now() });
          emit({ type: 'master.done', finalText: 'Master failed: ' + String(lastErr), totalCostUSD: totalCost, timestamp: Date.now() });
          masterDoneEmitted = true;
          break;
        }

        const thinking = msg.content.filter((b: any) => b.type === 'thinking').map((b: any) => b.thinking).join('\n');
        const text = msg.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n');
        const toolUses = msg.content.filter((b: any) => b.type === 'tool_use');

        const masterUsage = normalizeUsage(msg.usage, 'claude-haiku-4-5-20251001');
        totalCost += masterUsage.costUSD;

        emit({
          type: 'master.iter',
          iter,
          thinking,
          text,
          toolCallsPlanned: toolUses.map((t: any) => t.name),
          usage: masterUsage,
          timestamp: Date.now(),
          ...antigravityMeta({
            phase: 'plan',
            stopReason: msg.stop_reason,
            plannerDecisionReason: text ? text.slice(0, 280) : 'tool-dispatch',
            iter,
          }),
        });

        if (msg.stop_reason === 'end_turn' || toolUses.length === 0) {
          emit({
            type: 'master.done',
            finalText: text,
            totalCostUSD: totalCost,
            timestamp: Date.now(),
            ...antigravityMeta({ phase: 'complete', iter, stopReason: msg.stop_reason }),
          });
          masterDoneEmitted = true;
          break;
        }

        messages.push({ role: 'assistant', content: msg.content });

        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        for (const tu of toolUses as any[]) {
          const toolStartTime = Date.now();
          emit({
            type: 'tool.start',
            toolUseId: tu.id,
            name: tu.name,
            input: tu.input,
            timestamp: toolStartTime,
            ...antigravityMeta({ phase: 'tool-dispatch', tool: tu.name, iter, toolUseId: tu.id }),
          });
          try {
            const r = await fetch(`${baseURL}/api/agent/tool/${tu.name}`, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ input: tu.input }),
            });
            const data = await r.json();
            const subUsage = normalizeUsage(data.usage, tu.name === 'trend_spy' ? 'claude-haiku-4-5-20251001' : 'claude-sonnet-4-6');
            totalCost += subUsage.costUSD;

            emit({
              type: 'tool.done',
              toolUseId: tu.id,
              name: tu.name,
              output: data.output,
              reasoning: data.reasoning,
              usage: subUsage,
              timestamp: Date.now(),
              ...antigravityMeta({
                phase: 'tool-result',
                tool: tu.name,
                iter,
                toolUseId: tu.id,
                latencyMs: Date.now() - toolStartTime,
                confidence: data.output?.confidence ?? data.output?.crises?.[0]?.confidence ?? null,
                evidenceQuotesCount: (data.output?.evidence_quotes ?? data.output?.assessments?.[0]?.evidence_quotes ?? []).length,
              }),
            });
            toolResults.push({
              type: 'tool_result',
              tool_use_id: tu.id,
              content: JSON.stringify(data.output ?? data.error ?? {}),
              is_error: !data.output,
            });
          } catch (err) {
            emit({ type: 'tool.error', toolUseId: tu.id, name: tu.name, error: String(err), timestamp: Date.now() });
            toolResults.push({
              type: 'tool_result',
              tool_use_id: tu.id,
              content: JSON.stringify({ error: String(err) }),
              is_error: true,
            });
          }
        }

        messages.push({ role: 'user', content: toolResults });
      }

      // Safety: if loop exited via MAX_ITERS without end_turn, still emit master.done.
      if (!masterDoneEmitted) {
        emit({
          type: 'master.done',
          finalText: '',
          totalCostUSD: totalCost,
          timestamp: Date.now(),
          ...antigravityMeta({ phase: 'complete', stopReason: 'max_iters_exhausted' }),
        });
      }

      closeAll();
    },
    cancel() { /* client disconnected — let GC handle */ },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      'connection': 'keep-alive',
    },
  });
}
