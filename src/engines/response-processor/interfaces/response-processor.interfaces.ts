import { IResult } from '@services/types/result.type';
import {
  RawLLMResponse,
  ParsedResponse,
  ResponseValidationOutcome,
  ProcessedResponse,
  ResponseProcessingContext,
  DetectedItem,
} from '../dtos/response-processor.dtos';

export interface IResponseParser {
  parse(raw: RawLLMResponse): IResult<ParsedResponse>;
}

export interface IResponseValidator {
  validate(parsed: ParsedResponse, ctx: ResponseProcessingContext): IResult<ResponseValidationOutcome>;
}

export interface IResponseDetector {
  detect(parsed: ParsedResponse, ctx: ResponseProcessingContext): IResult<DetectedItem[]>;
}

export interface IResponseProcessor {
  process(ctx: ResponseProcessingContext): Promise<IResult<ProcessedResponse>>;
}
