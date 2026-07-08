import { IResponseProcessor } from './interfaces/response-processor.interfaces';
import { ResponseProcessor, ResponseProcessorDeps } from './response.processor';
import { EventEngine, getEventEngine } from '@engines/event';

let cached: IResponseProcessor | null = null;

export interface ResponseProcessorFactoryDeps extends ResponseProcessorDeps {
  eventEngine?: EventEngine;
}

export function getResponseProcessor(
  deps: ResponseProcessorFactoryDeps = {}
): IResponseProcessor {
  if (cached && !hasOverrides(deps)) return cached;

  const processor = new ResponseProcessor({
    ...deps,
    eventEngine: deps.eventEngine ?? getEventEngine(),
  });

  if (!hasOverrides(deps)) cached = processor;
  return processor;
}

export function resetResponseProcessor(): void {
  cached = null;
}

function hasOverrides(deps: ResponseProcessorFactoryDeps): boolean {
  return Boolean(deps.parser || deps.validators || deps.detectors || deps.rules || deps.eventEngine);
}
