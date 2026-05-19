// lib/agents/ResourceForge.ts
import { BaseAgent } from './BaseAgent';
import { AgentName } from '../types';

export class ResourceForge extends BaseAgent {
  name: AgentName = 'ResourceForge';
  toolName = 'resource_forge';

  async run(payload: { crises: any[]; assessments: any[] }) {
    return this.reason(payload);
  }
}
