import { HttpException } from '@nestjs/common';

export interface NovaErrorDetails {
  message: string;
  solarisStatus?: number;
  solarisMessage?: string;
  solarisError?: string;
  requestUrl?: string;
  requestPayload?: unknown;
  raw?: unknown;
}

export function extractNovaErrorDetails(error: unknown): NovaErrorDetails {
  if (error instanceof HttpException) {
    const response = error.getResponse();

    if (typeof response === 'object' && response !== null) {
      const details = response as Record<string, unknown>;

      return {
        message:
          typeof details.message === 'string'
            ? details.message
            : error.message,
        solarisStatus:
          typeof details.solarisStatus === 'number'
            ? details.solarisStatus
            : undefined,
        solarisMessage:
          typeof details.solarisMessage === 'string'
            ? details.solarisMessage
            : undefined,
        solarisError:
          typeof details.solarisError === 'string'
            ? details.solarisError
            : undefined,
        requestUrl:
          typeof details.requestUrl === 'string' ? details.requestUrl : undefined,
        requestPayload: details.requestPayload,
        raw: response,
      };
    }
  }

  return {
    message: error instanceof Error ? error.message : String(error),
  };
}
