// lib/agents/SignalFuse.ts
import { BaseAgent } from './BaseAgent';
import { AgentName } from '../types';

export class SignalFuse extends BaseAgent {
  name: AgentName = 'SignalFuse';
  toolName = 'signal_fuse';

  async run(rawData: any) {
    return this.reason({ rawData });
  }
}
