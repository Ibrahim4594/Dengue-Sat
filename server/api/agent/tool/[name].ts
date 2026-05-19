import { callAgent } from '../../../lib/agent';
import * as schemas from '../../../lib/schemas';
import * as prompts from '../../../lib/prompts';

export const config = { runtime: 'edge' };

const AGENT_MAP: Record<string, { system: string; schema: any; model: 'claude-sonnet-4-6' | 'claude-haiku-4-5-20251001'; thinking?: boolean }> = {
  signal_fuse: { system: prompts.SIGNAL_FUSE_SYSTEM, schema: schemas.SignalFuseOutput, model: 'claude-sonnet-4-6' },
  outbreak_eye: { system: prompts.OUTBREAK_EYE_SYSTEM, schema: schemas.OutbreakEyeOutput, model: 'claude-sonnet-4-6' },
  severity_mind: { system: prompts.SEVERITY_MIND_SYSTEM, schema: schemas.SeverityMindOutput, model: 'claude-sonnet-4-6', thinking: true },
  resource_forge: { system: prompts.RESOURCE_FORGE_SYSTEM, schema: schemas.ResourceForgeOutput, model: 'claude-sonnet-4-6', thinking: true },
  crisis_sim: { system: prompts.CRISIS_SIM_SYSTEM, schema: schemas.CrisisSimOutput, model: 'claude-sonnet-4-6' },
  recovery_guard: { system: prompts.RECOVERY_GUARD_SYSTEM, schema: schemas.RecoveryGuardOutput, model: 'claude-sonnet-4-6' },
  trend_spy: { system: prompts.TREND_SPY_SYSTEM, schema: schemas.TrendSpyOutput, model: 'claude-haiku-4-5-20251001' },
  citizen_signal: { system: prompts.CITIZEN_SIGNAL_SYSTEM, schema: schemas.CitizenSignalOutput, model: 'claude-sonnet-4-6' },
};

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const name = url.pathname.split('/').pop()!;
  const cfg = AGENT_MAP[name];
  if (!cfg) {
    return new Response(JSON.stringify({ error: `unknown agent ${name}` }), { status: 404 });
  }

  const body = await req.json();
  const userPrompt = `Input data:\n\`\`\`json\n${JSON.stringify(body.input, null, 2)}\n\`\`\`\n\nReturn VALID JSON matching the required schema.`;

  const result = await callAgent({
    model: cfg.model,
    system: cfg.system,
    cacheSystem: true,
    maxTokens: 4096,
    thinking: cfg.thinking ? { type: 'enabled', budget_tokens: 4000 } : undefined,
    messages: [{ role: 'user', content: userPrompt }],
  });

  let parsed: any = null;
  let raw: any = null;
  try {
    const jsonMatch = result.text.match(/```json\n([\s\S]*?)\n```/) ?? [null, result.text];
    raw = JSON.parse(jsonMatch[1] ?? result.text);
  } catch (e) {
    return new Response(JSON.stringify({ error: 'json_parse_failed', raw: result.text, parseError: String(e) }), { status: 500 });
  }

  let schemaError: string | null = null;
  try {
    parsed = cfg.schema.parse(raw);
  } catch (err) {
    // Schema drift: log + return raw so demo continues. Bridge layer handles loose shapes.
    schemaError = String(err).slice(0, 300);
    console.warn(`[tool ${name}] schema validation soft-fail:`, schemaError);
    parsed = raw;
  }

  const thinkingText = result.raw.content
    .filter((b: any) => b.type === 'thinking')
    .map((b: any) => b.thinking)
    .join('\n');

  return new Response(
    JSON.stringify({
      agent: name,
      output: parsed,
      reasoning: thinkingText,
      usage: result.usage,
      _schemaError: schemaError,
    }),
    { headers: { 'content-type': 'application/json' } },
  );
}
