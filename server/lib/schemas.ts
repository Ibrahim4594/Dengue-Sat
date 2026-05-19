import { z } from 'zod';

export const SignalFuseOutput = z.preprocess((raw: any) => {
  if (!raw || typeof raw !== 'object') return raw;
  // Normalize snake_case → camelCase top-level keys
  const out: any = { ...raw };
  if (raw.fused_signal && !out.fusedSignal) out.fusedSignal = raw.fused_signal;
  if (raw.source_credibility && !out.sourceCredibility) out.sourceCredibility = raw.source_credibility;
  return out;
}, z.object({
  fusedSignal: z.any().optional(),
  sourceCredibility: z.any().optional(),
  evidence_quotes: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(100).optional(),
}).passthrough());

export const OutbreakEyeOutput = z.object({
  crises: z.array(
    z.object({
      id: z.string(),
      type: z.enum(['DENGUE_OUTBREAK', 'HEATWAVE', 'INFRASTRUCTURE_FAILURE', 'OTHER']),
      district: z.string(),
      severityIndicator: z.number(),
      populationAtRisk: z.number(),
      confidence: z.number().min(0).max(100),
      contradictions: z.array(z.string()),
      evidence_quotes: z.array(z.string()),
    }),
  ),
});

export const SeverityMindOutput = z.object({
  assessments: z.array(
    z.object({
      crisisId: z.string(),
      dri: z.object({
        score: z.number().min(0).max(100),
        factors: z.object({ Tw: z.number(), Rw: z.number(), Vw: z.number(), Hw: z.number(), Ww: z.number() }),
        severity: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']),
        protocol: z.enum(['ROUTINE', 'MONITORING', 'SURVEILLANCE', 'EMERGENCY']),
        reasoning: z.string(),
      }),
      affectedRadiusKm: z.number(),
      populationAtRisk: z.number(),
      expectedDurationDays: z.number(),
      peakImpactDaysFromNow: z.number(),
      uncertaintyPct: z.number(),
      evidence_quotes: z.array(z.string()),
    }),
  ),
});

export const ResourceForgeOutput = z.object({
  allocation: z.object({
    perCrisis: z.array(
      z.object({
        crisisId: z.string(),
        ambulances: z.number(),
        fumigationTrucks: z.number(),
        hospitalBeds: z.number(),
        medicalTeams: z.number(),
      }),
    ),
    reserve: z.object({ ambulances: z.number(), trucks: z.number(), beds: z.number(), teams: z.number() }),
  }),
  tradeoff: z.string(),
  sideEffects: z.array(z.string()),
  routing: z.array(z.object({ from: z.string(), to: z.string(), via: z.string() })),
});

export const CrisisSimOutput = z.object({
  beforeState: z.record(z.string(), z.any()),
  afterState: z.record(z.string(), z.any()),
  metrics: z.object({
    casesReduced: z.number(),
    livesSaved: z.number(),
    responseTimeMin: z.number(),
    hospitalOccupancyChange: z.number(),
  }),
  stakeholderMessages: z.object({
    publicUrdu: z.string(),
    publicEnglish: z.string(),
    emergency: z.string(),
    hospital: z.string(),
    government: z.string(),
    media: z.string(),
  }),
});

export const RecoveryGuardOutput = z.object({
  verdict: z.enum(['UPHOLD', 'RECLASSIFY', 'SPLIT', 'RETRACT']),
  reclassifications: z.array(z.object({ crisisId: z.string(), newType: z.string(), reason: z.string() })),
  retractionMessages: z.object({ publicUrdu: z.string(), publicEnglish: z.string() }).optional(),
  utilityNotifications: z.array(z.object({ provider: z.string(), payload: z.record(z.string(), z.any()) })),
  conflictResolution: z.string(),
});

export const TrendSpyOutput = z.object({
  keyword: z.string(),
  geo: z.string(),
  anomalyScore: z.number().min(0).max(100),
  trendDirection: z.enum(['rising', 'falling', 'stable', 'spike']),
  weeklyValues: z.array(z.number()),
});

export const CitizenSignalOutput = z.object({
  accepted: z.boolean(),
  riskScore: z.number().min(0).max(100),
  breedingLikelihood: z.enum(['low', 'medium', 'high']),
  recommendation: z.string(),
  evidence_quotes: z.array(z.string()),
});
