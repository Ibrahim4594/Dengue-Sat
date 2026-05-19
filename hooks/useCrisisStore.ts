import { create } from 'zustand';
import { AppState, Crisis, AgentName, AgentStatus, TraceEvent, FusedSignal, ResourcePlan, SimResult, SourceHealthMap, ProximityState, DiagnosisResult, AgentState, SelectedLocation, AntigravityTrace, CitizenReport, CostState, ExtendedSourceHealth, ExtendedSourceStatus } from '../lib/types';

export type FinalSummary = {
  summaryEn: string;
  summaryUr: string;
  actionEn: string;
  actionUr: string;
  headlineSeverity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
};

const initialExtendedSourceHealth: ExtendedSourceHealth = {
  nasa: 'live',
  openweather: 'live',
  maps: 'live',
  firebase: 'live',
  trends: 'live',
  social: 'live',
  lastChecked: Date.now(),
};

const initialCost: CostState = {
  totalTokens: 0,
  totalUSD: 0,
  perAgentTokens: {},
  perAgentUSD: {},
  callCount: 0,
};

interface AppStore extends AppState {
  currentLocation: SelectedLocation | null;
  antigravityTraces: AntigravityTrace[];
  citizenReports: CitizenReport[];
  extendedSourceHealth: ExtendedSourceHealth;
  cost: CostState;
  finalSummary: FinalSummary | null;
  setLocation: (loc: SelectedLocation | null) => void;
  addAntigravityTrace: (t: AntigravityTrace) => void;
  clearAntigravityTraces: () => void;
  addCitizenReport: (r: CitizenReport) => void;
  setExtendedSourceStatus: (source: keyof Omit<ExtendedSourceHealth, 'lastChecked'>, status: ExtendedSourceStatus) => void;
  addCost: (agent: string, tokens: number, usd: number) => void;
  resetCost: () => void;
  setFinalSummary: (s: FinalSummary | null) => void;
  setActiveCrises: (crises: Crisis[]) => void;
  setAnalyzing: (isAnalyzing: boolean) => void;
  updateAgentStatus: (name: AgentName, status: AgentStatus) => void;
  addAgentTrace: (trace: TraceEvent) => void;
  clearTraces: () => void;
  setFusedSignal: (signal: FusedSignal | null) => void;
  setResourcePlan: (plan: ResourcePlan | null) => void;
  setSimulationResult: (result: SimResult | null) => void;
  setSourceHealth: (health: SourceHealthMap) => void;
  setProximityAlert: (alert: ProximityState) => void;
  setSymptomCheckResult: (result: DiagnosisResult | null) => void;
  setPlateletAlertActive: (active: boolean) => void;
  setSelectedCity: (cityId: string) => void;
  resetState: () => void;
}

const initialAgentState = (name: AgentName, nameUrdu: string, icon: string): AgentState => ({
  name,
  nameUrdu,
  status: 'idle',
  icon,
  traces: [],
});

const initialState = {
  activeCrises: [] as Crisis[],
  isAnalyzing: false,
  agents: [
    initialAgentState('SignalFuse', 'سگنل جوڑ', '📡'),
    initialAgentState('TrendSpy', 'رجحان جاسوس', '📈'),
    initialAgentState('OutbreakEye', 'وبا بین', '🔍'),
    initialAgentState('SeverityMind', 'شدت ساز', '🧠'),
    initialAgentState('ResourceForge', 'وسائل ساز', '📋'),
    initialAgentState('CrisisSim', 'تجربہ ساز', '⚡'),
    initialAgentState('RecoveryGuard', 'بحالی محافظ', '🛡️'),
    initialAgentState('CitizenSignal' as any, 'شہری اشارہ', '👤'),
  ],
  agentTraces: [],
  fusedSignal: null,
  resourcePlan: null,
  simulationResult: null,
  sourceHealth: {
    nasa: 'live' as const,
    hospital: 'live' as const,
    social: 'live' as const,
    maps: 'live' as const,
  },
  proximityAlert: {
    isInDangerZone: false,
    currentZoneSeverity: null,
    districtName: null,
    districtNameUrdu: null,
    preventionTips: [],
    preventionTipsUrdu: [],
  },
  symptomCheckResult: null,
  plateletAlertActive: false,
  selectedCity: 'karachi',
  currentLocation: null,
  antigravityTraces: [],
  citizenReports: [],
  extendedSourceHealth: initialExtendedSourceHealth,
  cost: initialCost,
  finalSummary: null,
};

export const useCrisisStore = create<AppStore>((set) => ({
  ...initialState,

  setActiveCrises: (activeCrises) => set({ activeCrises }),
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setFinalSummary: (finalSummary) => set({ finalSummary }),

  updateAgentStatus: (name, status) => set((state) => ({
    agents: state.agents.map((a) => a.name === name ? { ...a, status } : a)
  })),

  addAgentTrace: (trace) => set((state) => ({
    agentTraces: [...state.agentTraces, trace],
    agents: state.agents.map((a) =>
      a.name === trace.agent
        ? { ...a, traces: [...a.traces, trace] }
        : a
    )
  })),

  clearTraces: () => set((state) => ({
    agentTraces: [],
    agents: state.agents.map((a) => ({ ...a, traces: [], status: 'idle' })),
  })),

  setFusedSignal: (fusedSignal) => set({ fusedSignal }),
  setResourcePlan: (resourcePlan) => set({ resourcePlan }),
  setSimulationResult: (simulationResult) => set({ simulationResult }),
  setSourceHealth: (sourceHealth) => set({ sourceHealth }),
  setProximityAlert: (proximityAlert) => set({ proximityAlert }),
  setSymptomCheckResult: (symptomCheckResult) => set({ symptomCheckResult }),
  setPlateletAlertActive: (plateletAlertActive) => set({ plateletAlertActive }),
  setSelectedCity: (selectedCity) => set({ selectedCity }),

  setLocation: (currentLocation) => set({ currentLocation }),
  addAntigravityTrace: (t) => set((state) => ({ antigravityTraces: [...state.antigravityTraces, t] })),
  clearAntigravityTraces: () => set({ antigravityTraces: [] }),
  addCitizenReport: (r) => set((state) => ({ citizenReports: [...state.citizenReports, r] })),
  setExtendedSourceStatus: (source, status) => set((state) => ({
    extendedSourceHealth: { ...state.extendedSourceHealth, [source]: status, lastChecked: Date.now() },
  })),
  addCost: (agent, tokens, usd) => set((state) => ({
    cost: {
      totalTokens: state.cost.totalTokens + tokens,
      totalUSD: state.cost.totalUSD + usd,
      perAgentTokens: { ...state.cost.perAgentTokens, [agent]: (state.cost.perAgentTokens[agent] ?? 0) + tokens },
      perAgentUSD: { ...state.cost.perAgentUSD, [agent]: (state.cost.perAgentUSD[agent] ?? 0) + usd },
      callCount: state.cost.callCount + 1,
    },
  })),
  resetCost: () => set({ cost: initialCost }),

  resetState: () => set(initialState),
}));
