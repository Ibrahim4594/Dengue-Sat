/**
 * DengueSat — Cost-Effectiveness Analysis
 * PKR-based ROI calculations for stakeholder convincing
 */

import { costData } from '../constants/cost-data';

export interface CostAnalysis {
  pilotCost: string;
  treatmentWithout: string;
  treatmentWith: string;
  savings: string;
  roi: string;
  livesSaved: number;
  casesPrevented: number;
  summaryEn: string;
  summaryUr: string;
}

function formatPKR(amount: number): string {
  if (amount >= 1_000_000) {
    return `PKR ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `PKR ${(amount / 1_000).toFixed(0)}K`;
  }
  return `PKR ${amount}`;
}

export function calculateCostEffectiveness(): CostAnalysis {
  const d = costData;

  return {
    pilotCost: formatPKR(d.pilot.totalPKR),
    treatmentWithout: formatPKR(d.withoutIntervention.totalCostPKR),
    treatmentWith: formatPKR(d.withDengueSat.totalCostPKR),
    savings: formatPKR(d.savings.costSavedPKR),
    roi: `${d.savings.roi}x`,
    livesSaved: d.savings.livesSaved,
    casesPrevented: d.savings.casesPrevented,
    summaryEn: `DengueSat pilot costs ${formatPKR(d.pilot.totalPKR)}. Without intervention: ${d.withoutIntervention.projectedCases} cases costing ${formatPKR(d.withoutIntervention.totalCostPKR)}. With DengueSat: ${d.withDengueSat.projectedCases} cases costing ${formatPKR(d.withDengueSat.totalCostPKR)}. Net savings: ${formatPKR(d.savings.costSavedPKR)}. ROI: ${d.savings.roi}x. Lives saved: ${d.savings.livesSaved}.`,
    summaryUr: `ڈینگی سیٹ پائلٹ لاگت: ${formatPKR(d.pilot.totalPKR)}۔ مداخلت کے بغیر: ${d.withoutIntervention.projectedCases} کیسز، لاگت ${formatPKR(d.withoutIntervention.totalCostPKR)}۔ ڈینگی سیٹ کے ساتھ: ${d.withDengueSat.projectedCases} کیسز، لاگت ${formatPKR(d.withDengueSat.totalCostPKR)}۔ بچت: ${formatPKR(d.savings.costSavedPKR)}۔ ${d.savings.livesSaved} جانیں بچائی گئیں۔`,
  };
}
