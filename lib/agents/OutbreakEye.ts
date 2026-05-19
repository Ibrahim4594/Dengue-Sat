// lib/agents/OutbreakEye.ts
import { BaseAgent } from './BaseAgent';
import { AgentName } from '../types';

export class OutbreakEye extends BaseAgent {
  name: AgentName = 'OutbreakEye';
  toolName = 'outbreak_eye';

  async run(fusedSignal: any) {
    return this.reason({ fusedSignal });
  }
}
