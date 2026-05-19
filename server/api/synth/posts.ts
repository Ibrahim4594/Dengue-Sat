import { callAgent } from '../../lib/agent';
import { z } from 'zod';

export const config = { runtime: 'edge' };

// Lenient schema — accept any post shape, normalize on consumer side
const PostSchema = z.object({
  posts: z.array(z.record(z.string(), z.any())),
});

const SYSTEM = `You are a synthetic social media simulator for dengue crisis monitoring in Pakistan.
Generate REALISTIC citizen social media posts about dengue symptoms, sightings, complaints, or fears
in the specified district. Mix Urdu, Roman Urdu, and English naturally. Vary credibility (some verified
accounts, some anonymous panic posts). Include real local terms: bukhar, machhar, platelet, ڈینگی, بخار.

REQUIRED fields per post: "author" (string), "text" (string, main content), "language" ("urdu"|"english"|"roman-urdu"),
"timestamp" (ISO string), "credibilityScore" (0-100), "keywords" (array of strings).
Output VALID JSON: { "posts": [...] }. No prose outside JSON.`;

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const district = url.searchParams.get('district') ?? 'Korangi';
  const city = url.searchParams.get('city') ?? 'Karachi';
  const count = parseInt(url.searchParams.get('n') ?? '10', 10);

  const result = await callAgent({
    model: 'claude-sonnet-4-6',
    system: SYSTEM,
    cacheSystem: true,
    maxTokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Generate exactly ${count} synthetic posts for ${district}, ${city}. Return JSON: { "posts": [...] }`,
      },
    ],
  });

  let parsed;
  try {
    const jsonMatch = result.text.match(/```json\n([\s\S]*?)\n```/) ?? [null, result.text];
    parsed = PostSchema.parse(JSON.parse(jsonMatch[1] ?? result.text));
  } catch (e) {
    return new Response(JSON.stringify({ error: 'parse failed', raw: result.text }), { status: 500 });
  }

  return new Response(JSON.stringify({ ...parsed, _cost: result.usage }), {
    headers: { 'content-type': 'application/json' },
  });
}
