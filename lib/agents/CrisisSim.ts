// lib/agents/CrisisSim.ts
import { BaseAgent } from './BaseAgent';
import { AgentName } from '../types';

export class CrisisSim extends BaseAgent {
  name: AgentName = 'CrisisSim';
  toolName = 'crisis_sim';

  async run(payload: { allocation: any; crises: any[] }) {
    return this.reason(payload);
  }
}
