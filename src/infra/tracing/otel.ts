import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { getEnvironment } from '@config/environment';
import { createLogger } from '@utils/logger';

const logger = createLogger('OpenTelemetry');

const env = getEnvironment();

const traceExporter = new OTLPTraceExporter({
  url: `${env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
});

const metricExporter = new OTLPMetricExporter({
  url: `${env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/metrics`,
});

const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
});

export const sdk = new NodeSDK({
  traceExporter,
  metricReader,
  instrumentations: [getNodeAutoInstrumentations()],
});

export async function initializeTracing(): Promise<void> {
  try {
    await sdk.start();
    logger.info('OpenTelemetry tracing initialized');
  } catch (error) {
    logger.error({ error }, 'Failed to initialize OpenTelemetry');
  }
}

export async function shutdownTracing(): Promise<void> {
  try {
    await sdk.shutdown();
    logger.info('OpenTelemetry tracing shut down');
  } catch (error) {
    logger.error({ error }, 'Failed to shutdown OpenTelemetry');
  }
}
