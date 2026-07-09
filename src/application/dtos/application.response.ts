/**
 * Standard API Response DTO
 * Every endpoint returns this structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ResponseMetadata;
  pagination?: PaginationMetadata;
  traceId: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  validationErrors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ResponseMetadata {
  version: string;
  requestId: string;
  duration?: number;
  [key: string]: unknown;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  totalPages: number;
}

/**
 * Response builder for consistent API responses
 */
export class ResponseBuilder {
  static success<T>(
    data: T,
    traceId: string,
    pagination?: PaginationMetadata,
    metadata?: ResponseMetadata
  ): ApiResponse<T> {
    return {
      success: true,
      data,
      traceId,
      pagination,
      metadata: metadata || { version: '1.0', requestId: traceId },
      timestamp: new Date().toISOString(),
    };
  }

  static error(
    code: string,
    message: string,
    traceId: string,
    details?: Record<string, unknown>,
    validationErrors?: ValidationError[]
  ): ApiResponse {
    return {
      success: false,
      error: {
        code,
        message,
        details,
        validationErrors,
      },
      traceId,
      timestamp: new Date().toISOString(),
    };
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    traceId: string
  ): ApiResponse<T[]> {
    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        hasMore: page * limit < total,
        totalPages: Math.ceil(total / limit),
      },
      traceId,
      metadata: { version: '1.0', requestId: traceId },
      timestamp: new Date().toISOString(),
    };
  }
}
