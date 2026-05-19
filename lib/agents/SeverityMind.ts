// lib/agents/SeverityMind.ts
import { BaseAgent } from './BaseAgent';
import { AgentName } from '../types';

export class SeverityMind extends BaseAgent {
  name: AgentName = 'SeverityMind';
  toolName = 'severity_mind';

  async run(crises: any[]) {
    return this.reason({ crises });
  }
}
