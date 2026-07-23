import { BadGatewayException } from '@nestjs/common';
import { extractNovaErrorDetails } from './nova-error.util';

describe('extractNovaErrorDetails', () => {
  it('extracts Solaris API fields from BadGatewayException', () => {
    const error = new BadGatewayException({
      message: 'Error al llamar a Solaris API.',
      solarisStatus: 400,
      solarisMessage: 'Category is required',
      requestUrl: 'https://api.example.com/api/v1/products',
      requestPayload: { name: 'Test' },
    });

    expect(extractNovaErrorDetails(error)).toEqual({
      message: 'Error al llamar a Solaris API.',
      solarisStatus: 400,
      solarisMessage: 'Category is required',
      solarisError: undefined,
      requestUrl: 'https://api.example.com/api/v1/products',
      requestPayload: { name: 'Test' },
      raw: expect.objectContaining({
        solarisStatus: 400,
      }),
    });
  });

  it('falls back to Error message for generic errors', () => {
    expect(extractNovaErrorDetails(new Error('network timeout'))).toEqual({
      message: 'network timeout',
    });
  });
});
