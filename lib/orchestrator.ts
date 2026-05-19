// lib/orchestrator.ts
import { antigravity } from './antigravity';

/**
 * Legacy orchestrator interface preserved.
 * Delegates to the new Antigravity runtime.
 */
export class AntigravityOrchestrator {
  async runPipeline(): Promise<void> {
    await antigravity.runFullPipeline();
  }
}

export const orchestrator = new AntigravityOrchestrator();
