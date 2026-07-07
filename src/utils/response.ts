import type { Response } from 'express';

export interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
}

export function sendSuccess<T>(res: Response, statusCode: number, data: T): Response {
  return res.status(statusCode).json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  } satisfies SuccessResponse<T>);
}

export function sendPaginated<T>(
  res: Response,
  statusCode: number,
  data: T[],
  total: number,
  limit: number,
  offset: number
): Response {
  return res.status(statusCode).json({
    success: true,
    data,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
    timestamp: new Date().toISOString(),
  } satisfies PaginatedResponse<T>);
}

export function sendCreated<T>(res: Response, data: T): Response {
  return sendSuccess(res, 201, data);
}

export function sendOk<T>(res: Response, data: T): Response {
  return sendSuccess(res, 200, data);
}

export function sendNoContent(res: Response): Response {
  return res.status(204).send();
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, unknown>
): Response {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    timestamp: new Date().toISOString(),
  } satisfies ErrorResponse);
}
