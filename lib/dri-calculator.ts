/**
 * DengueSat — 5-Factor Dengue Risk Index Calculator
 * DRI = (Tw × 0.25) + (Rw × 0.25) + (Vw × 0.15) + (Hw × 0.15) + (Ww × 0.20)
 */

import { DRIFactors, DRIResult, SeverityLevel, SeverityProtocol } from './types';

/**
 * Temperature Weight (Tw): 25-35°C optimal for Aedes mosquito breeding
 * Peak at 28-32°C → score 100. Outside range → decreasing score.
 */
function calculateTw(tempC: number): number {
  if (tempC >= 28 && tempC <= 32) return 100;
  if (tempC >= 25 && tempC < 28) return 60 + ((tempC - 25) / 3) * 40;
  if (tempC > 32 && tempC <= 35) return 60 + ((35 - tempC) / 3) * 40;
  if (tempC >= 20 && tempC < 25) return 20 + ((tempC - 20) / 5) * 40;
  if (tempC > 35 && tempC <= 40) return 20 + ((40 - tempC) / 5) * 40;
  return Math.max(0, 10);
}

/**
 * Rainfall Weight (Rw): More rain = more stagnant water = more breeding
 * Formula: min(totalPrecip / 1.5, 100)
 */
function calculateRw(precipMm: number): number {
  return Math.min((precipMm / 1.5) * 100 / 100, 100);
}

/**
 * Vegetation Weight (Vw): NDVI indicates mosquito shelter
 * Formula: min(ndvi × 200, 100)
 */
function calculateVw(ndvi: number): number {
  return Math.min(ndvi * 200, 100);
}

/**
 * Humidity Weight (Hw): >60% humidity is critical
 * Formula: if >60%, ((humidity-60)/30)×100, capped at 100
 */
function calculateHw(humidity: number): number {
  if (humidity <= 60) return Math.max(0, (humidity / 60) * 30);
  return Math.min(((humidity - 60) / 30) * 100, 100);
}

/**
 * Water Index Weight (Ww): NDWI indicates stagnant water bodies
 * Formula: min(ndwi × 250, 100)
 */
function calculateWw(ndwi: number): number {
  return Math.min(ndwi * 250, 100);
}

function getSeverity(dri: number): SeverityLevel {
  if (dri > 75) return 'CRITICAL';
  if (dri > 50) return 'HIGH';
  if (dri > 25) return 'MODERATE';
  return 'LOW';
}

function getProtocol(dri: number): SeverityProtocol {
  if (dri > 75) return 'EMERGENCY';
  if (dri > 50) return 'SURVEILLANCE';
  if (dri > 25) return 'MONITORING';
  return 'ROUTINE';
}

/**
 * Calculate the full 5-factor Dengue Risk Index
 */
export function calculateDRI(factors: DRIFactors): DRIResult {
  const Tw = calculateTw(factors.temperature);
  const Rw = calculateRw(factors.rainfall);
  const Vw = calculateVw(factors.vegetation);
  const Hw = calculateHw(factors.humidity);
  const Ww = calculateWw(factors.waterIndex);

  const score = Math.round(
    (Tw * 0.25) + (Rw * 0.25) + (Vw * 0.15) + (Hw * 0.15) + (Ww * 0.20)
  );

  const severity = getSeverity(score);
  const protocol = getProtocol(score);

  const reasoning = [
    `Temperature ${factors.temperature}°C → ${factors.temperature >= 25 && factors.temperature <= 35 ? 'WITHIN' : 'OUTSIDE'} optimal range (25-35°C) → Tw=${Tw}`,
    `Rainfall ${factors.rainfall}mm → ${factors.rainfall > 20 ? 'Creates stagnant pools' : 'Moderate precipitation'} → Rw=${Rw}`,
    `NDVI ${factors.vegetation.toFixed(2)} → ${factors.vegetation > 0.4 ? 'Dense vegetation' : 'Sparse vegetation'} → Vw=${Vw}`,
    `Humidity ${factors.humidity}% → ${factors.humidity > 60 ? 'Exceeds 60% threshold' : 'Below threshold'} → Hw=${Hw}`,
    `NDWI ${factors.waterIndex.toFixed(2)} → ${factors.waterIndex > 0.3 ? 'Significant standing water' : 'Low water index'} → Ww=${Ww}`,
    ``,
    `DRI = (${Tw}×0.25)+(${Rw}×0.25)+(${Vw}×0.15)+(${Hw}×0.15)+(${Ww}×0.20) = ${score}`,
    `DECISION: DRI=${score} → ${severity} → ${protocol} protocol`,
  ].join('\n');

  return {
    score,
    severity,
    protocol,
    factors,
    factorScores: { Tw, Rw, Vw, Hw, Ww },
    reasoning,
  };
}
