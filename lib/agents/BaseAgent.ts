// lib/agents/BaseAgent.ts
import { useCrisisStore } from '../../hooks/useCrisisStore';
import { callAgentTool } from '../agent-client';
import { v4 as uuid } from 'uuid';
import { AgentName, AgentStatus, TraceType } from '../types';

export abstract class BaseAgent {
  abstract name: AgentName;
  abstract toolName: string;

  protected log(message: string, type: TraceType = 'reasoning', data?: Record<string, unknown>) {
    useCrisisStore.getState().addAgentTrace?.({
      id: uuid(),
      agent: this.name,
      message,
      type,
      timestamp: new Date().toISOString(),
      data,
    });
  }

  protected setStatus(status: AgentStatus) {
    useCrisisStore.getState().updateAgentStatus?.(this.name, status);
  }

  protected async reason<T>(input: any): Promise<T> {
    this.setStatus('processing');
    this.log(`Calling ${this.toolName} via proxy…`, 'reasoning');
    try {
      const r = await callAgentTool(this.toolName, input);
      if (r?.error) {
        this.log(`Backend error: ${r.error}`, 'decision');
        this.setStatus('error' as any);
        throw new Error(r.error);
      }
      this.log(`Received output (cost $${r.usage?.costUSD?.toFixed(5) ?? 'n/a'})`, 'success');
      this.setStatus('done');
      return r.output as T;
    } catch (err) {
      this.log(`Error: ${String(err)}`, 'decision');
      this.setStatus('error' as any);
      throw err;
    }
  }
}
