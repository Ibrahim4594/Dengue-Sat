import Anthropic from '@anthropic-ai/sdk';
import { CITIZEN_SIGNAL_SYSTEM } from '../lib/prompts';
import { CitizenSignalOutput } from '../lib/schemas';

export const config = { runtime: 'edge' };

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' });

export default async function handler(req: Request) {
  const body = await req.json();
  const { imageBase64, text, location } = body;

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: [{ type: 'text', text: CITIZEN_SIGNAL_SYSTEM, cache_control: { type: 'ephemeral' } }] as any,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
          { type: 'text', text: `Citizen description: "${text}"\nLocation: ${JSON.stringify(location)}\n\nAnalyze for mosquito breeding risk. Return VALID JSON matching CitizenSignalOutput schema.` },
        ],
      },
    ],
  });

  const rawText = msg.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n');
  const jsonMatch = rawText.match(/```json\n([\s\S]*?)\n```/) ?? [null, rawText];
  let parsed;
  try {
    parsed = CitizenSignalOutput.parse(JSON.parse(jsonMatch[1] ?? rawText));
  } catch (err) {
    return new Response(JSON.stringify({ error: 'parse_failed', raw: rawText }), { status: 500 });
  }

  const costUSD = (msg.usage.input_tokens * 3 + msg.usage.output_tokens * 15) / 1_000_000;

  return new Response(JSON.stringify({ ...parsed, usage: { ...msg.usage, costUSD } }), {
    headers: { 'content-type': 'application/json' },
  });
}
