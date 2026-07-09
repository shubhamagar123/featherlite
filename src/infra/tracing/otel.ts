import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { getEnvironment } from '@config/environment';

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
    console.log('✅ OpenTelemetry tracing initialized');
  } catch (error) {
    console.error('Failed to initialize OpenTelemetry:', error);
  }
}

export async function shutdownTracing(): Promise<void> {
  try {
    await sdk.shutdown();
    console.log('✅ OpenTelemetry tracing shut down');
  } catch (error) {
    console.error('Failed to shutdown OpenTelemetry:', error);
  }
}
