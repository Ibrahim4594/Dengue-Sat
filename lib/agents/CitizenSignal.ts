// lib/agents/CitizenSignal.ts
import { BaseAgent } from './BaseAgent';
import { AgentName } from '../types';

export class CitizenSignal extends BaseAgent {
  name: AgentName = 'CitizenSignal' as AgentName;
  toolName = 'citizen_signal';

  async run(payload: { reports: any[] }) {
    return this.reason(payload);
  }
}
