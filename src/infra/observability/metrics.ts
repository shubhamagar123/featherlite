import { metrics } from '@opentelemetry/api';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { getEnvironment } from '@config/environment';

let meterProvider: MeterProvider | null = null;

export function initializeMetrics(): void {
  const env = getEnvironment();
  const exporter = new OTLPMetricExporter({
    url: `${env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/metrics`,
  });

  meterProvider = new MeterProvider({
    readers: [new PeriodicExportingMetricReader({ exporter })],
  });

  metrics.setGlobalMeterProvider(meterProvider);
}

export class MetricsCollector {
  private static readonly meter = metrics.getMeter('featherlight-backend', '0.1.0');

  private static readonly requestCounter = this.meter.createCounter('http.requests.total', {
    description: 'Total HTTP requests',
  });

  private static readonly requestDuration = this.meter.createHistogram('http.request.duration_ms', {
    description: 'HTTP request duration in milliseconds',
  });

  private static readonly errorCounter = this.meter.createCounter('errors.total', {
    description: 'Total errors by category',
  });

  private static readonly cacheHitCounter = this.meter.createCounter('cache.hits.total', {
    description: 'Cache hits',
  });

  private static readonly cacheMissCounter = this.meter.createCounter('cache.misses.total', {
    description: 'Cache misses',
  });

  private static readonly llmTokenCounter = this.meter.createCounter('llm.tokens.total', {
    description: 'Total LLM tokens consumed',
  });

  private static readonly llmLatency = this.meter.createHistogram('llm.latency_ms', {
    description: 'LLM request latency in milliseconds',
  });

  private static readonly dbQueryDuration = this.meter.createHistogram('db.query.duration_ms', {
    description: 'Database query duration in milliseconds',
  });

  private static readonly eventPublishedCounter = this.meter.createCounter('events.published.total', {
    description: 'Total events published',
  });

  private static readonly eventProcessedCounter = this.meter.createCounter('events.processed.total', {
    description: 'Total events processed',
  });

  static recordHttpRequest(method: string, _path: string, statusCode: number, durationMs: number): void {
    this.requestCounter.add(1, {
      'http.method': method,
      'http.status_code': statusCode,
    });

    this.requestDuration.record(durationMs, {
      'http.method': method,
    });
  }

  static recordError(category: string, severity: string): void {
    this.errorCounter.add(1, {
      'error.category': category,
      'error.severity': severity,
    });
  }

  static recordCacheHit(cacheType: string): void {
    this.cacheHitCounter.add(1, {
      'cache.type': cacheType,
    });
  }

  static recordCacheMiss(cacheType: string): void {
    this.cacheMissCounter.add(1, {
      'cache.type': cacheType,
    });
  }

  static recordLLMUsage(provider: string, model: string, promptTokens: number, completionTokens: number): void {
    const totalTokens = promptTokens + completionTokens;
    this.llmTokenCounter.add(totalTokens, {
      'llm.provider': provider,
      'llm.model': model,
      'token.type': 'all',
    });

    this.llmTokenCounter.add(promptTokens, {
      'llm.provider': provider,
      'llm.model': model,
      'token.type': 'prompt',
    });

    this.llmTokenCounter.add(completionTokens, {
      'llm.provider': provider,
      'llm.model': model,
      'token.type': 'completion',
    });
  }

  static recordLLMLatency(provider: string, model: string, durationMs: number): void {
    this.llmLatency.record(durationMs, {
      'llm.provider': provider,
      'llm.model': model,
    });
  }

  static recordDbQuery(operation: string, table: string, durationMs: number): void {
    this.dbQueryDuration.record(durationMs, {
      'db.operation': operation,
      'db.table': table,
    });
  }

  static recordEventPublished(eventType: string, source: string): void {
    this.eventPublishedCounter.add(1, {
      'event.type': eventType,
      'event.source': source,
    });
  }

  static recordEventProcessed(eventType: string, handler: string, success: boolean): void {
    this.eventProcessedCounter.add(1, {
      'event.type': eventType,
      'event.handler': handler,
      'event.success': success,
    });
  }
}
