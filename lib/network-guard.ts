import { SourceStatus } from './types';

/**
 * NetworkGuard
 * Centralised network resilience layer for the CIRO agent system.
 * Handles source health checks, retry logic, fallback data, and degraded mode.
 */
export class NetworkGuard {
  private degradedMode: boolean = false;

  static fallbackCache: Record<string, any> = {
    nasa: {
      karachi: {
        temperature: 29.5,
        humidity: 68,
        precipitation: 12.5,
        windSpeed: 8,
        ndvi: 0.45,
        ndwi: 0.35,
        source: 'cached',
        last_updated: '2026-05-13T12:00:00Z',
      },
      lahore: {
        temperature: 32.0,
        humidity: 75,
        precipitation: 85.0,
        windSpeed: 6,
        ndvi: 0.65,
        ndwi: 0.55,
        source: 'cached',
        last_updated: '2026-05-13T12:00:00Z',
      },
    },
    hospital: {
      karachi: [
        {
          id: 'h1_cache',
          name: 'Jinnah Hospital',
          nameUrdu: 'جناح ہسپتال',
          district: 'South',
          totalBeds: 500,
          availableBeds: 10,
          dengueAdmissions: 135,
          plateletKitsAvailable: 45,
          occupancyRate: 0.98,
          latitude: 24.85,
          longitude: 67.03,
          distanceKm: 4.2,
        },
        {
          id: 'h2_cache',
          name: 'Civil Hospital',
          nameUrdu: 'سول ہسپتال',
          district: 'East',
          totalBeds: 400,
          availableBeds: 8,
          dengueAdmissions: 170,
          plateletKitsAvailable: 8,
          occupancyRate: 0.98,
          latitude: 24.86,
          longitude: 67.02,
          distanceKm: 5.8,
        },
      ],
      lahore: [
        {
          id: 'h3_cache',
          name: 'Mayo Hospital',
          nameUrdu: 'میو ہسپتال',
          district: 'Central',
          totalBeds: 600,
          availableBeds: 22,
          dengueAdmissions: 200,
          plateletKitsAvailable: 60,
          occupancyRate: 0.963,
          latitude: 31.55,
          longitude: 74.33,
        },
      ],
    },
    social: {
      karachi: [
        {
          id: 's1_cache',
          text: 'High fever cases reported in Gulshan-e-Iqbal area. Several families affected.',
          language: 'english',
          location: 'Gulshan-e-Iqbal',
          timestamp: null,
          credibilityScore: 0.80,
          isVerified: false,
          keywords: ['fever', 'dengue'],
        },
        {
          id: 's2_cache',
          text: 'پلیٹلیٹس کی شدید کمی، ہسپتالوں میں جگہ نہیں۔',
          language: 'urdu',
          location: 'Nazimabad',
          timestamp: null,
          credibilityScore: 0.85,
          isVerified: true,
          keywords: ['platelets', 'hospital'],
        },
      ],
    },
    maps: {
      karachi: [
        {
          congestionLevel: 88,
          nearHospital: 'Jinnah Hospital',
          changeVsBaseline: 40,
        },
        {
          congestionLevel: 90,
          nearHospital: 'Civil Hospital',
          changeVsBaseline: 45,
        },
      ],
      lahore: [
        {
          congestionLevel: 75,
          nearHospital: 'Mayo Hospital',
          changeVsBaseline: 30,
        },
      ],
    },
  };

  /**
   * Checks the health of a given source endpoint.
   * Returns the source status (live, cached, or failed).
   */
  async checkSource(source: string): Promise<SourceStatus> {
    if (this.degradedMode) {
      return 'failed';
    }

    try {
      await this.fetchWithRetry(`https://api.mock/${source}/health`, 2, 200);
      return 'live';
    } catch {
      const fallback = NetworkGuard.fallbackCache[source];
      if (fallback) {
        return 'cached';
      }
      return 'failed';
    }
  }

  /**
   * Generic fetch with retry logic and exponential backoff.
   */
  async fetchWithRetry(url: string, retries: number, backoff: number): Promise<any> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          const delay = backoff * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Returns cached fallback data for a given source.
   */
  getFallbackData(source: string): any {
    const data = NetworkGuard.fallbackCache[source];
    if (!data) {
      return null;
    }

    const timestamp = new Date().toISOString();
    console.log(`[NetworkGuard] Serving cached ${source} data. Timestamp: ${timestamp}`);
    return data;
  }

  /**
   * Activates degraded mode, causing all source checks to return 'failed'.
   */
  enterDegradedMode(): void {
    this.degradedMode = true;
    console.warn('[NetworkGuard] Entered degraded mode. All sources will report as failed.');
  }

  /**
   * Exits degraded mode, restoring normal source checks.
   */
  exitDegradedMode(): void {
    this.degradedMode = false;
    console.log('[NetworkGuard] Exited degraded mode. Normal source checks resumed.');
  }

  /**
   * Returns whether the guard is currently in degraded mode.
   */
  isDegraded(): boolean {
    return this.degradedMode;
  }
}
