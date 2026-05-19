// lib/agents/RecoveryGuard.ts
import { BaseAgent } from './BaseAgent';
import { AgentName } from '../types';

export class RecoveryGuard extends BaseAgent {
  name: AgentName = 'RecoveryGuard';
  toolName = 'recovery_guard';

  async run(payload: { crises: any[]; newEvidence?: any[] }) {
    return this.reason(payload);
  }
}
