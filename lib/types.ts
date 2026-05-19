/**
 * DengueSat Core Types
 * All shared TypeScript interfaces and enums
 */

// ── Severity Levels ──
export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
export type SeverityProtocol = 'EMERGENCY' | 'SURVEILLANCE' | 'MONITORING' | 'ROUTINE';

// ── Source Health ──
export type SourceStatus = 'live' | 'cached' | 'failed';
export type SourceName = 'nasa' | 'hospital' | 'social' | 'maps';

export interface SourceHealthMap {
  nasa: SourceStatus;
  hospital: SourceStatus;
  social: SourceStatus;
  maps: SourceStatus;
}

// ── DRI (Dengue Risk Index) ──
export interface DRIFactors {
  temperature: number;    // Tw: 25-35°C optimal
  rainfall: number;       // Rw: precipitation
  vegetation: number;     // Vw: NDVI
  humidity: number;       // Hw: >60% threshold
  waterIndex: number;     // Ww: NDWI stagnant water
}

export interface DRIResult {
  score: number;          // 0-100
  severity: SeverityLevel;
  protocol: SeverityProtocol;
  factors: DRIFactors;
  factorScores: {
    Tw: number; Rw: number; Vw: number; Hw: number; Ww: number;
  };
  reasoning: string;
}

// ── Crisis ──
export interface Crisis {
  id: string;
  type: 'DENGUE_OUTBREAK' | 'HEATWAVE' | 'FLOOD' | 'INFRASTRUCTURE';
  location: {
    city: string;
    district: string;
    latitude: number;
    longitude: number;
    radiusKm: number;
  };
  dri: DRIResult;
  confidence: number;      // 0-100%
  populationAtRisk: number;
  estimatedDuration: string;
  peakImpactTime: string;
  timestamp: string;
}

// ── Signal Sources ──
export interface SocialPost {
  id: string;
  text: string;
  language: 'urdu' | 'english' | 'mixed';
  location: string;
  timestamp: string;
  credibilityScore: number;
  isVerified: boolean;
  keywords: string[];
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  ndvi: number;
  ndwi: number;
  source: 'nasa' | 'openweather' | 'cached';
}

export interface HospitalData {
  id: string;
  name: string;
  nameUrdu: string;
  district: string;
  totalBeds: number;
  availableBeds: number;
  dengueAdmissions: number;
  plateletKitsAvailable: number;
  occupancyRate: number;
  latitude: number;
  longitude: number;
  distanceKm?: number;
}

export interface TrafficData {
  congestionLevel: number;    // 0-100
  nearHospital: string;
  changeVsBaseline: number;   // percentage
}

export interface FusedSignal {
  social: { posts: SocialPost[]; credibility: number; postCount: number };
  weather: WeatherData;
  hospital: { data: HospitalData[]; admissionSpike: number };
  traffic: TrafficData[];
  overallCredibility: { nasa: number; hospital: number; social: number; maps: number };
}

// ── Resource Allocation ──
export interface ResourcePool {
  ambulances: { total: number; available: number };
  fumigationTrucks: { total: number; available: number };
  hospitalBeds: { total: number; available: number };
  medicalTeams: { total: number; available: number };
}

export interface Allocation {
  crisisId: string;
  ambulances: number;
  fumigationTrucks: number;
  hospitalBeds: number;
  medicalTeams: number;
  percentage: number;
  priority: number;
}

export interface ResourcePlan {
  allocations: Allocation[];
  reserve: ResourcePool;
  tradeoffs: string[];
  sideEffects: string[];
}

// ── Simulation ──
export interface SimulationState {
  dri: number;
  hospitalOccupancy: number;
  responseTime: number;
  projectedCases: number;
  projectedDeaths: number;
}

export interface SimResult {
  before: SimulationState;
  after: SimulationState;
  actions: SimAction[];
  livesSaved: number;
  casesReduced: number;
  stakeholderNotifications: StakeholderNotification[];
}

export interface SimAction {
  id: string;
  description: string;
  descriptionUrdu: string;
  status: 'completed' | 'in_progress' | 'pending';
  impact: string;
}

// ── Stakeholder Notifications ──
export type StakeholderType = 'public' | 'hospitals' | 'government' | 'media' | 'emergency';

export interface StakeholderNotification {
  type: StakeholderType;
  recipient?: string;
  title: string;
  titleUrdu: string;
  message: string;
  messageUrdu: string;
  messageEn?: string;
  messageUr?: string;
  urgency: SeverityLevel;
  priority?: number;
  timestamp: string;
}

// ── Agent Traces ──
export type TraceType = 'reasoning' | 'decision' | 'conflict' | 'critical' | 'false-positive' | 'success' | 'error';
export type AgentName = 'SignalFuse' | 'TrendSpy' | 'OutbreakEye' | 'SeverityMind' | 'ResourceForge' | 'CrisisSim' | 'RecoveryGuard' | 'CitizenSignal';
export type AgentStatus = 'idle' | 'processing' | 'done' | 'error';

export interface TraceEvent {
  id: string;
  agent: AgentName;
  message: string;
  type: TraceType;
  timestamp: string;
  data?: Record<string, unknown>;
}

export interface AgentState {
  name: AgentName;
  nameUrdu: string;
  icon: string;
  status: AgentStatus;
  traces: TraceEvent[];
}

// ── Scenarios ──
export type ScenarioKey = 'dual-crisis' | 'false-alarm' | 'api-failure' | 'exaggeration' | 'hospital-rush';

export interface Scenario {
  id: ScenarioKey;
  name: string;
  nameUrdu: string;
  description: string;
  icon: string;
}

// ── Symptom Checker ──
export type Symptom = 'fever' | 'headache' | 'joint_pain' | 'rash' | 'bleeding' | 'nausea' | 'fatigue' | 'eye_pain';

export interface DiagnosisResult {
  probability: number;       // 0-100
  severity: 'mild' | 'moderate' | 'severe';
  recommendation: string;
  recommendationUrdu: string;
  nearestHospital: HospitalData | null;
  disclaimer: string;
}

// ── Proximity Alert ──
export interface ProximityState {
  isInDangerZone: boolean;
  currentZoneSeverity: SeverityLevel | null;
  districtName: string | null;
  districtNameUrdu: string | null;
  preventionTips: string[];
  preventionTipsUrdu: string[];
}

// ── Store ──
export interface AppState {
  // Core
  activeCrises: Crisis[];
  isAnalyzing: boolean;

  // Agents
  agents: AgentState[];
  agentTraces: TraceEvent[];

  // Results
  fusedSignal: FusedSignal | null;
  resourcePlan: ResourcePlan | null;
  simulationResult: SimResult | null;

  // Health
  sourceHealth: SourceHealthMap;
  proximityAlert: ProximityState;
  symptomCheckResult: DiagnosisResult | null;
  plateletAlertActive: boolean;

  // City
  selectedCity: string;
}

// === MAX-POWER additions ===

export interface Province {
  id: string;
  name: string;
  nameUrdu: string;
  cities: City[];
}

export interface City {
  id: string;
  name: string;
  nameUrdu: string;
  lat: number;
  lng: number;
  population: number;
  districts: District[];
}

export interface District {
  id: string;
  name: string;
  nameUrdu: string;
  lat: number;
  lng: number;
  population: number;
}

export interface SelectedLocation {
  province: Province;
  city: City;
  district: District;
}

// Extended source health (6 sources, 4-state status)
export type ExtendedSourceStatus = 'live' | 'cached' | 'degraded' | 'failed';

export interface ExtendedSourceHealth {
  nasa: ExtendedSourceStatus;
  openweather: ExtendedSourceStatus;
  maps: ExtendedSourceStatus;
  firebase: ExtendedSourceStatus;
  trends: ExtendedSourceStatus;
  social: ExtendedSourceStatus;
  lastChecked: number;
}

export type AntigravityEventType =
  | 'master.start'
  | 'master.iter'
  | 'master.done'
  | 'tool.start'
  | 'tool.done'
  | 'tool.error'
  | 'system';

export interface AntigravityTrace {
  id: string;
  type: AntigravityEventType;
  runId: string;
  iter?: number;
  agent?: string;
  toolUseId?: string;
  input?: any;
  output?: any;
  reasoning?: string;
  thinking?: string;
  text?: string;
  toolCallsPlanned?: string[];
  usage?: { inputTokens: number; outputTokens: number; cacheReadTokens: number; costUSD: number };
  error?: string;
  timestamp: number;
}

export interface CitizenReport {
  id: string;
  timestamp: number;
  photoBase64?: string;
  text: string;
  location: { lat: number; lng: number; district: string };
  visionResult?: {
    riskScore: number;
    breedingLikelihood: 'low' | 'medium' | 'high';
    recommendation: string;
  };
  accepted: boolean;
}

export type ScenarioId = 'live' | 'dual-crisis' | 'false-alarm' | 'api-failure' | 'hospital-rush' | 'exaggeration';

export interface CostState {
  totalTokens: number;
  totalUSD: number;
  perAgentTokens: Record<string, number>;
  perAgentUSD: Record<string, number>;
  callCount: number;
}
