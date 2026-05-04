import { monitorEventLoopDelay } from 'node:perf_hooks';
import { logger } from './logger';

interface EventLoopMetrics {
  min: number;
  max: number;
  mean: number;
  p50: number;
  p90: number;
  p99: number;
}

interface EventLoopMonitorConfig {
  warnThreshold: number;
  criticalThreshold: number;
  resolution: number;
}

const DEFAULT_CONFIG: EventLoopMonitorConfig = {
  warnThreshold: 100,
  criticalThreshold: 500,
  resolution: 10,
};

class EventLoopMonitor {
  private histogram: ReturnType<typeof monitorEventLoopDelay> | null = null;
  private isMonitoring = false;
  private config: EventLoopMonitorConfig;

  constructor(config: Partial<EventLoopMonitorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  start(): void {
    if (this.isMonitoring) {
      logger.warn('Event loop monitor is already running');
      return;
    }

    try {
      this.histogram = monitorEventLoopDelay({
        resolution: this.config.resolution,
      });

      this.histogram.enable();
      this.isMonitoring = true;
      logger.info('Event loop monitoring started', {
        warnThreshold: `${this.config.warnThreshold}ms`,
        criticalThreshold: `${this.config.criticalThreshold}ms`,
      });
    } catch (error) {
      logger.error('Failed to start event loop monitor', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  stop(): void {
    if (!this.isMonitoring || !this.histogram) {
      return;
    }

    this.histogram.disable();
    this.histogram = null;
    this.isMonitoring = false;
    logger.info('Event loop monitoring stopped');
  }

  getMetrics(skipLogging = false): EventLoopMetrics {
    const defaultMetrics: EventLoopMetrics = {
      min: 0,
      max: 0,
      mean: 0,
      p50: 0,
      p90: 0,
      p99: 0,
    };

    if (!this.isMonitoring || !this.histogram) {
      return defaultMetrics;
    }

    // Convert nanoseconds to milliseconds (monitorEventLoopDelay returns nanoseconds)
    const nsToMs = (ns: number | bigint): number => {
      const num = typeof ns === 'bigint' ? Number(ns) : ns;
      return num / 1_000_000;
    };

    const metrics: EventLoopMetrics = {
      min: nsToMs(this.histogram.min),
      max: nsToMs(this.histogram.max),
      mean: nsToMs(this.histogram.mean),
      p50: nsToMs(this.histogram.percentile(50)),
      p90: nsToMs(this.histogram.percentile(90)),
      p99: nsToMs(this.histogram.percentile(99)),
    };

    if (!skipLogging) {
      if (metrics.max > this.config.criticalThreshold) {
        logger.error('Critical event loop delay detected', {
          max: `${metrics.max.toFixed(2)}ms`,
          p99: `${metrics.p99.toFixed(2)}ms`,
          p90: `${metrics.p90.toFixed(2)}ms`,
          threshold: `${this.config.criticalThreshold}ms`,
        });
      } else if (metrics.max > this.config.warnThreshold) {
        logger.warn('High event loop delay detected', {
          max: `${metrics.max.toFixed(2)}ms`,
          p99: `${metrics.p99.toFixed(2)}ms`,
          p90: `${metrics.p90.toFixed(2)}ms`,
          threshold: `${this.config.warnThreshold}ms`,
        });
      }
    }

    return metrics;
  }

  isRunning(): boolean {
    return this.isMonitoring;
  }
}

export const eventLoopMonitor = new EventLoopMonitor();
export type { EventLoopMetrics };
