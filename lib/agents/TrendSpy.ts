// lib/agents/TrendSpy.ts
import { BaseAgent } from './BaseAgent';
import { AgentName } from '../types';

export class TrendSpy extends BaseAgent {
  name: AgentName = 'TrendSpy';
  toolName = 'trend_spy';

  async run(keyword: string) {
    return this.reason({ keyword });
  }
}
