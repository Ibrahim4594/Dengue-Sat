import type { FinalSummary } from '../hooks/useCrisisStore';

/**
 * Extract bilingual final summary from master.done event finalText.
 * Master is instructed to emit a JSON object inside a ```json``` fence.
 * Returns null if shape doesn't match — UI falls back to other state.
 */
export function parseFinalSummary(finalText: string | undefined | null): FinalSummary | null {
  if (!finalText || typeof finalText !== 'string') return null;

  const fenceMatch = finalText.match(/```json\s*([\s\S]*?)\s*```/i);
  // If no fence found, extract first {...} block; survives wrapping prose, markdown headers, etc.
  const candidate = fenceMatch
    ? fenceMatch[1]
    : (finalText.match(/\{[\s\S]*\}/)?.[0] ?? finalText);

  try {
    const parsed = JSON.parse(candidate);
    if (
      typeof parsed.summaryEn === 'string' &&
      typeof parsed.summaryUr === 'string' &&
      typeof parsed.actionEn === 'string' &&
      typeof parsed.actionUr === 'string'
    ) {
      const sev = String(parsed.headlineSeverity ?? '').toUpperCase();
      const allowed = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'] as const;
      const headlineSeverity = (allowed.includes(sev as any) ? sev : 'MODERATE') as FinalSummary['headlineSeverity'];
      return {
        summaryEn: parsed.summaryEn.trim(),
        summaryUr: parsed.summaryUr.trim(),
        actionEn: parsed.actionEn.trim(),
        actionUr: parsed.actionUr.trim(),
        headlineSeverity,
      };
    }
  } catch (e) {
    console.warn('[bilingual] JSON parse failed', e, candidate?.slice(0, 120));
  }
  return null;
}
