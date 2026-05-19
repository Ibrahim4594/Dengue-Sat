import { v4 as uuid } from 'uuid';
import { useCrisisStore } from '../hooks/useCrisisStore';
import { orchestrateStream } from './agent-client';
import { parseFinalSummary } from './bilingual';
import { fetchNasaClimate } from './api/nasa';
import { fetchOpenWeather } from './api/openweather';
import { fetchNearbyHospitals } from './api/google-maps';
import { fetchHospitals } from './api/firebase-rtdb';
import { fetchTrends } from './api/google-trends';
import { fetchSynthPosts } from './synth-posts';
import { AntigravityTrace, AntigravityEventType, ExtendedSourceStatus, AgentName } from './types';

const TOOL_TO_AGENT: Record<string, AgentName> = {
  signal_fuse: 'SignalFuse',
  outbreak_eye: 'OutbreakEye',
  severity_mind: 'SeverityMind',
  resource_forge: 'ResourceForge',
  crisis_sim: 'CrisisSim',
  recovery_guard: 'RecoveryGuard',
  trend_spy: 'TrendSpy',
  citizen_signal: 'CitizenSignal' as AgentName,
};

/**
 * Translate orchestrator tool outputs into legacy store fields
 * so existing screens (Alerts, Intel, Map, Sim) keep working.
 */
function bridgeToolOutput(toolName: string, output: any, store: any) {
  if (!output) return;

  if (toolName === 'signal_fuse') {
    try {
      const fused = output.fusedSignal ?? output;
      store.setFusedSignal?.({
        social: { posts: [], credibility: output.sourceCredibility?.social ?? 70, postCount: fused?.socialVolume ?? 0 },
        weather: {
          temperature: fused?.climate?.temp ?? 0,
          humidity: fused?.climate?.humidity ?? 0,
          precipitation: fused?.climate?.rainfall ?? 0,
          windSpeed: fused?.climate?.wind ?? 0,
          ndvi: fused?.vegetation?.ndvi ?? 0,
          ndwi: fused?.vegetation?.ndwi ?? 0,
          source: 'nasa',
        },
        hospital: { data: [], admissionSpike: fused?.hospitalLoad?.dengueAdmissions24h ?? 0 },
        traffic: [],
        overallCredibility: {
          nasa: output.sourceCredibility?.nasa ?? 99,
          hospital: output.sourceCredibility?.hospital ?? 95,
          social: output.sourceCredibility?.social ?? 70,
          maps: output.sourceCredibility?.maps ?? 88,
        },
      });
    } catch (e) { console.warn('[antigravity] bridge failed for', toolName, e); }
  }

  if (toolName === 'outbreak_eye') {
    try {
      // Agent may wrap in `outbreakEyeOutput`, return `crises` flat, or single-crisis under `riskSummary`.
      const inner = output.outbreakEyeOutput ?? output;
      let crisesRaw: any[] = Array.isArray(inner.crises) ? inner.crises
        : Array.isArray(inner.detectedCrises) ? inner.detectedCrises
        : Array.isArray(inner.anomaliesDetected) ? [{
            id: inner.detectionId ?? `crisis-${Date.now()}`,
            type: inner.crisisClassification?.primaryType ?? 'DENGUE_OUTBREAK',
            district: inner.location?.district,
            severityIndicator: inner.riskSummary?.overallRiskScore ?? 0,
            populationAtRisk: inner.populationAtRisk?.estimatedAtRiskPopulation ?? 0,
            confidence: inner.crisisClassification?.confidence ?? inner.riskSummary?.overallConfidence ?? 0,
          }]
        : [];

      const sevMap: Record<string, string> = { LOW: 'LOW', MODERATE: 'MODERATE', HIGH: 'HIGH', CRITICAL: 'CRITICAL' };
      const overallSev = String(inner.riskSummary?.overallRiskLevel ?? '').toUpperCase();

      const crises = crisesRaw.map((c: any) => {
        const score = c.severityIndicator ?? c.riskScore ?? c.score ?? c.dri?.score ?? inner.riskSummary?.overallRiskScore ?? 0;
        const sevRaw = String(c.severity ?? c.dri?.severity ?? overallSev ?? '').toUpperCase();
        const severity = sevMap[sevRaw] ?? (score >= 75 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MODERATE' : 'LOW');
        return {
          id: c.id ?? c.crisisId ?? `crisis-${Date.now()}`,
          type: c.type ?? 'DENGUE_OUTBREAK',
          location: {
            city: store.currentLocation?.city?.name ?? '',
            district: c.district ?? store.currentLocation?.district?.name ?? '',
            latitude: store.currentLocation?.district?.lat ?? 0,
            longitude: store.currentLocation?.district?.lng ?? 0,
            radiusKm: 3,
          },
          dri: {
            score,
            severity,
            protocol: severity === 'CRITICAL' ? 'EMERGENCY' : severity === 'HIGH' ? 'SURVEILLANCE' : 'MONITORING',
            factors: { temperature: 0, rainfall: 0, vegetation: 0, humidity: 0, waterIndex: 0 },
            factorScores: { Tw: 0, Rw: 0, Vw: 0, Hw: 0, Ww: 0 },
            reasoning: c.classificationRationale ?? inner.crisisClassification?.classificationRationale ?? '',
          },
          confidence: ((c.confidence ?? inner.crisisClassification?.confidence ?? 0) / 100),
          populationAtRisk: c.populationAtRisk ?? inner.populationAtRisk?.estimatedAtRiskPopulation ?? 0,
          estimatedDuration: '',
          peakImpactTime: '',
          timestamp: new Date().toISOString(),
        };
      });
      if (crises.length > 0) store.setActiveCrises?.(crises);
    } catch (e) { console.warn('[antigravity] bridge failed for', toolName, e); }
  }

  if (toolName === 'severity_mind') {
    try {
      const current = store.activeCrises ?? [];
      const inner = output.severityMindOutput ?? output;
      const assessments = inner.assessments ?? inner.crises ?? [];
      const merged = current.map((c: any) => {
        const a = assessments.find((x: any) => x.crisisId === c.id);
        if (!a) return c;
        return {
          ...c,
          dri: {
            score: a.dri.score,
            severity: a.dri.severity,
            protocol: a.dri.protocol,
            factors: {
              temperature: 0,
              rainfall: 0,
              vegetation: 0,
              humidity: 0,
              waterIndex: 0,
            },
            factorScores: a.dri.factors ?? { Tw: 0, Rw: 0, Vw: 0, Hw: 0, Ww: 0 },
            reasoning: a.dri.reasoning ?? '',
          },
          populationAtRisk: a.populationAtRisk ?? c.populationAtRisk,
          estimatedDuration: `${a.expectedDurationDays} days`,
          peakImpactTime: `${a.peakImpactDaysFromNow} days from now`,
        };
      });
      store.setActiveCrises?.(merged);
    } catch (e) { console.warn('[antigravity] bridge failed for', toolName, e); }
  }

  if (toolName === 'resource_forge') {
    try {
      const alloc = output.allocation ?? {};
      store.setResourcePlan?.({
        allocations: (alloc.perCrisis ?? []).map((a: any, i: number) => ({
          crisisId: a.crisisId,
          ambulances: a.ambulances,
          fumigationTrucks: a.fumigationTrucks,
          hospitalBeds: a.hospitalBeds,
          medicalTeams: a.medicalTeams,
          percentage: 0,
          priority: i + 1,
        })),
        reserve: {
          ambulances: { total: 15, available: alloc.reserve?.ambulances ?? 0 },
          fumigationTrucks: { total: 8, available: alloc.reserve?.trucks ?? 0 },
          hospitalBeds: { total: 200, available: alloc.reserve?.beds ?? 0 },
          medicalTeams: { total: 12, available: alloc.reserve?.teams ?? 0 },
        },
        tradeoffs: [output.tradeoff ?? ''],
        sideEffects: output.sideEffects ?? [],
      });
    } catch (e) { console.warn('[antigravity] bridge failed for', toolName, e); }
  }

  if (toolName === 'crisis_sim') {
    try {
      const inner = output.crisisSimOutput ?? output;
      const msgs = inner.stakeholderMessages ?? inner.messages ?? {};
      const metrics = inner.metrics ?? {};
      const beforeDri = inner.beforeState?.dri ?? 0;
      const afterDri = inner.afterState?.dri ?? 0;
      const notifications = [
        { type: 'public', recipient: 'Citizens', title: 'Public Safety Alert', titleUrdu: 'عوامی حفاظتی الرٹ', message: msgs.publicEnglish ?? '', messageUrdu: msgs.publicUrdu ?? '', messageEn: msgs.publicEnglish ?? '', messageUr: msgs.publicUrdu ?? '', urgency: 'CRITICAL', priority: 1, timestamp: new Date().toISOString() },
        { type: 'emergency', recipient: 'Emergency Services', title: 'Dispatch Order', titleUrdu: 'ہنگامی ڈسپیچ', message: msgs.emergency ?? '', messageUrdu: '', urgency: 'CRITICAL', priority: 1, timestamp: new Date().toISOString() },
        { type: 'hospitals', recipient: 'Hospital Network', title: 'Preparation Alert', titleUrdu: 'ہسپتال تیاری الرٹ', message: msgs.hospital ?? '', messageUrdu: '', urgency: 'HIGH', priority: 2, timestamp: new Date().toISOString() },
        { type: 'government', recipient: 'Government / NDMA', title: 'Situation Report', titleUrdu: 'صورتحال رپورٹ', message: msgs.government ?? '', messageUrdu: '', urgency: 'HIGH', priority: 2, timestamp: new Date().toISOString() },
        { type: 'media', recipient: 'Media', title: 'Press Briefing', titleUrdu: 'پریس بریفنگ', message: msgs.media ?? '', messageUrdu: '', urgency: 'MODERATE', priority: 3, timestamp: new Date().toISOString() },
      ];
      store.setSimulationResult?.({
        before: {
          dri: beforeDri,
          hospitalOccupancy: inner.beforeState?.hospitalOccupancy ?? 0,
          responseTime: inner.beforeState?.responseTime ?? 0,
          projectedCases: inner.beforeState?.projectedCases ?? 0,
          projectedDeaths: inner.beforeState?.projectedDeaths ?? 0,
        },
        after: {
          dri: afterDri,
          hospitalOccupancy: inner.afterState?.hospitalOccupancy ?? 0,
          responseTime: metrics.responseTimeMin ?? 0,
          projectedCases: inner.afterState?.projectedCases ?? 0,
          projectedDeaths: inner.afterState?.projectedDeaths ?? 0,
        },
        actions: [],
        livesSaved: metrics.livesSaved ?? 0,
        casesReduced: metrics.casesReduced ?? 0,
        stakeholderNotifications: notifications as any,
      });
    } catch (e) { console.warn('[antigravity] bridge failed for', toolName, e); }
  }
}

export class AntigravityOrchestrator {
  async runFullPipeline(): Promise<void> {
    const store = useCrisisStore.getState() as any;
    const location = store.currentLocation;
    if (!location) throw new Error('Location not set — call setLocation first');

    const runId = uuid();
    store.clearAntigravityTraces();
    store.resetCost();
    store.clearTraces?.();
    store.setActiveCrises?.([]);
    store.setSimulationResult?.(null);
    store.setResourcePlan?.(null);
    store.setFusedSignal?.(null);
    store.setFinalSummary?.(null);
    // Reset all agents to idle
    Object.values(TOOL_TO_AGENT).forEach(agentName => {
      store.updateAgentStatus?.(agentName, 'idle');
    });
    store.setAnalyzing?.(true);

    const HARD_TIMEOUT_MS = 420_000;
    const hardTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Pipeline hard timeout (420s). Proxy or agent likely unresponsive.')), HARD_TIMEOUT_MS),
    );
    const pipelinePromise = (async () => {
      const lat = location.district.lat;
      const lng = location.district.lng;
      const [nasa, ow, maps, hospital, trends, posts] = await Promise.allSettled([
        fetchNasaClimate(lat, lng),
        fetchOpenWeather(lat, lng),
        fetchNearbyHospitals(lat, lng),
        fetchHospitals(location.city.id),
        fetchTrends(`dengue ${location.city.name}`),
        fetchSynthPosts(location.district.name, location.city.name, 10),
      ]);

      const status = (s: PromiseSettledResult<any>, fromCache?: boolean): ExtendedSourceStatus =>
        s.status === 'fulfilled' ? (fromCache ? 'cached' : 'live') : 'failed';

      const prefetchedData: any = {
        location: {
          province: location.province.name,
          city: location.city.name,
          district: location.district.name,
          lat,
          lng,
          population: location.district.population,
        },
        nasa: nasa.status === 'fulfilled' ? nasa.value : { error: 'failed' },
        openweather: ow.status === 'fulfilled' ? ow.value : { error: 'failed' },
        maps: maps.status === 'fulfilled' ? maps.value : { error: 'failed' },
        hospital: hospital.status === 'fulfilled' ? hospital.value : { error: 'failed' },
        trends: trends.status === 'fulfilled' ? trends.value : { error: 'failed' },
        social: posts.status === 'fulfilled' ? posts.value : { error: 'failed' },
      };

      store.setExtendedSourceStatus('nasa', status(nasa, nasa.status === 'fulfilled' && nasa.value?._cache?.fromCache));
      store.setExtendedSourceStatus('openweather', status(ow, ow.status === 'fulfilled' && ow.value?._cache?.fromCache));
      store.setExtendedSourceStatus('maps', status(maps));
      store.setExtendedSourceStatus('firebase', status(hospital));
      store.setExtendedSourceStatus('trends', status(trends));
      store.setExtendedSourceStatus('social', status(posts));

      const stream = orchestrateStream({ runId, location: prefetchedData.location, prefetchedData });

      for await (const event of stream) {
        const trace: AntigravityTrace = {
          id: uuid(),
          type: event.type as AntigravityEventType,
          runId,
          iter: event.iter,
          agent: event.name,
          toolUseId: event.toolUseId,
          input: event.input,
          output: event.output,
          reasoning: event.reasoning,
          thinking: event.thinking,
          text: event.text ?? event.finalText,
          toolCallsPlanned: event.toolCallsPlanned,
          usage: event.usage,
          error: event.error,
          timestamp: event.timestamp ?? Date.now(),
        };
        store.addAntigravityTrace(trace);

        if (event.usage) {
          const tokens = (event.usage.inputTokens ?? 0) + (event.usage.outputTokens ?? 0);
          store.addCost(event.name ?? 'master', tokens, event.usage.costUSD ?? 0);
        }

        // Wire agent status from SSE events
        if ((event.type === 'tool.start' || event.type === 'tool.done' || event.type === 'tool.error') && event.name) {
          const agentName = TOOL_TO_AGENT[event.name];
          if (agentName) {
            const newStatus =
              event.type === 'tool.start' ? 'processing'
              : event.type === 'tool.done' ? 'done'
              : 'error';
            useCrisisStore.getState().updateAgentStatus?.(agentName, newStatus as any);
          }
        }

        // Bridge tool outputs to legacy store fields
        if (event.type === 'tool.done' && event.name && event.output) {
          bridgeToolOutput(event.name, event.output, useCrisisStore.getState());
        }

        // Parse bilingual final summary from master.done
        if (event.type === 'master.done') {
          const finalText: string | undefined = event.finalText ?? event.text;
          const summary = parseFinalSummary(finalText ?? '');
          if (summary) {
            useCrisisStore.getState().setFinalSummary?.(summary);
          } else {
            console.warn('[antigravity] master.done without parseable bilingual JSON', finalText?.slice(0, 200));
          }
        }
      }
    })();

    try {
      await Promise.race([pipelinePromise, hardTimeout]);
    } finally {
      // Use a getter so every read sees the latest store snapshot (Zustand mutates state).
      const getFresh = () => useCrisisStore.getState() as any;
      const fresh1 = getFresh();

      // Fallback finalSummary: synth from activeCrises if master.done lacked bilingual JSON.
      if (!fresh1.finalSummary) {
        const crises = fresh1.activeCrises ?? [];
        if (crises.length === 0) {
          const dist = location.district.name;
          fresh1.setFinalSummary?.({
            summaryEn: `Analysis complete for ${dist}. No active dengue crises detected from current signals.`,
            summaryUr: `${dist} کا تجزیہ مکمل۔ موجودہ اشاروں سے کوئی فعال ڈینگی بحران نہیں ملا۔`,
            actionEn: 'Maintain routine mosquito prevention. Drain water containers weekly and monitor for fever.',
            actionUr: 'مچھروں کی روک تھام جاری رکھیں۔ ہفتہ وار پانی کے برتن خالی کریں اور بخار پر نظر رکھیں۔',
            headlineSeverity: 'LOW',
          });
        } else {
          const top = [...crises].sort((a: any, b: any) => (b?.dri?.score ?? 0) - (a?.dri?.score ?? 0))[0];
          const sevRaw = String(top?.dri?.severity ?? 'MODERATE').toUpperCase();
          const allowed = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];
          const severity = (allowed.includes(sevRaw) ? sevRaw : 'MODERATE') as any;
          const dist = location.district.name;
          const pop = top?.populationAtRisk ?? location.district.population ?? 0;
          fresh1.setFinalSummary?.({
            summaryEn: `${severity} dengue risk detected in ${dist}. Approximately ${pop.toLocaleString()} residents may be affected based on climate and hospital signals.`,
            summaryUr: `${dist} میں ڈینگی کا ${severity === 'CRITICAL' ? 'انتہائی شدید' : severity === 'HIGH' ? 'شدید' : severity === 'MODERATE' ? 'درمیانہ' : 'کم'} خطرہ پایا گیا ہے۔ تقریباً ${pop.toLocaleString()} افراد متاثر ہو سکتے ہیں۔`,
            actionEn: 'Drain standing water, use repellent, and seek medical care for fever lasting over 48 hours.',
            actionUr: 'کھڑے پانی کو ختم کریں، مچھر بھگانے والی دوا استعمال کریں، اور 48 گھنٹے سے زائد بخار پر ڈاکٹر سے رجوع کریں۔',
            headlineSeverity: severity,
          });
        }
      }

      // Fallback simulationResult: if crisis_sim never produced notifications, synth a minimal set.
      // Re-read fresh after potential setFinalSummary above.
      const fresh = getFresh();
      const existingSim = fresh.simulationResult;
      const existingNotifs = existingSim?.stakeholderNotifications ?? [];
      const needsSimFallback = !existingSim || existingNotifs.length === 0;
      if (needsSimFallback) try {
        const crises = fresh.activeCrises ?? [];
        const top = crises[0];
        const sevRaw = String(top?.dri?.severity ?? fresh.finalSummary?.headlineSeverity ?? 'LOW').toUpperCase();
        const sev = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'].includes(sevRaw) ? sevRaw : 'LOW';
        const dist = location.district.name;
        console.log('[antigravity] firing simulationResult fallback', { sev, hasCrises: crises.length });
        fresh.setSimulationResult?.({
          before: { dri: top?.dri?.score ?? 0, hospitalOccupancy: 0, responseTime: 0, projectedCases: 0, projectedDeaths: 0 },
          after: { dri: top?.dri?.score ?? 0, hospitalOccupancy: 0, responseTime: 0, projectedCases: 0, projectedDeaths: 0 },
          actions: [],
          livesSaved: 0,
          casesReduced: 0,
          stakeholderNotifications: [
            { type: 'public', recipient: 'Citizens', title: 'Public Safety Alert', titleUrdu: 'عوامی حفاظتی الرٹ', message: `${sev} dengue risk in ${dist}. Drain standing water near homes. Seek care for sustained fever.`, messageUrdu: `${dist} میں ڈینگی کا خطرہ۔ کھڑا پانی ختم کریں اور بخار پر ڈاکٹر سے رجوع کریں۔`, messageEn: '', messageUr: '', urgency: sev as any, priority: 1, timestamp: new Date().toISOString() },
            { type: 'emergency', recipient: 'Emergency Services', title: 'Dispatch Order', titleUrdu: 'ہنگامی ڈسپیچ', message: `Pre-position fumigation teams in ${dist}. Stage ambulances near high-DRI zones.`, messageUrdu: '', urgency: sev as any, priority: 1, timestamp: new Date().toISOString() },
            { type: 'hospitals', recipient: 'Hospital Network', title: 'Preparation Alert', titleUrdu: 'ہسپتال تیاری الرٹ', message: `Stockpile NS1 kits and platelet units. Expect admission surge in ${dist}.`, messageUrdu: '', urgency: 'HIGH' as any, priority: 2, timestamp: new Date().toISOString() },
            { type: 'government', recipient: 'Government / NDMA', title: 'Situation Report', titleUrdu: 'صورتحال رپورٹ', message: `DengueSat CIRO classified ${dist} at ${sev}. Recommend district-level response plan.`, messageUrdu: '', urgency: 'HIGH' as any, priority: 2, timestamp: new Date().toISOString() },
            { type: 'media', recipient: 'Media', title: 'Press Briefing', titleUrdu: 'پریس بریفنگ', message: `Health authorities monitoring ${sev}-level dengue indicators in ${dist}. Public advised to remove water containers.`, messageUrdu: '', urgency: 'MODERATE' as any, priority: 3, timestamp: new Date().toISOString() },
          ] as any,
        });
      } catch (e) { console.warn('[antigravity] simulationResult fallback failed', e); }

      const final = getFresh();
      final.setAnalyzing?.(false);
      // Mark any still-processing agents as error so UI never shows infinite spinner.
      final.agents?.forEach((a: any) => {
        if (a.status === 'processing') final.updateAgentStatus?.(a.name, 'error');
      });
    }
  }
}

export const antigravity = new AntigravityOrchestrator();
