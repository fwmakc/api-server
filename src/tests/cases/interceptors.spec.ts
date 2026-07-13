import { ExecutionContext, CallHandler } from '@nestjs/common';
import { AddClientIpInterceptor } from '@src/common/interceptor/add-client-ip.interceptor';
import { RemovePrivateFieldsInterceptor } from '@src/common/interceptor/remove-private.interceptor';

describe('interceptors — unit', () => {
  const mockRequest = (extras: any = {}) =>
    ({
      body: {},
      headers: {},
      socket: { remoteAddress: '127.0.0.1' },
      connection: { remoteAddress: '127.0.0.1' },
      ...extras,
    } as any);

  const mockContext = (request: any) =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
    } as any);

  const mockHandler = () =>
    ({
      handle: () => ({
        pipe: (fn: any) => fn,
      }),
    } as any);

  describe('AddClientIpInterceptor', () => {
    it('IP1: sets ip in body', () => {
      const interceptor = new AddClientIpInterceptor();
      const req = mockRequest();
      interceptor.intercept(
        mockContext(req) as ExecutionContext,
        mockHandler() as CallHandler,
      );
      expect(req.body.ip).toBeDefined();
    });

    it('IP2: supports custom key', () => {
      const interceptor = new AddClientIpInterceptor('authorIp');
      const req = mockRequest();
      interceptor.intercept(
        mockContext(req) as ExecutionContext,
        mockHandler() as CallHandler,
      );
      expect(req.body.authorIp).toBeDefined();
    });
  });

  describe('RemovePrivateFieldsInterceptor', () => {
    it('RP1: builds bind from request.user', () => {
      const interceptor = new RemovePrivateFieldsInterceptor();
      const req = mockRequest({
        user: { id: 1, isSuperuser: false },
      });

      const result = interceptor.intercept(
        mockContext(req) as ExecutionContext,
        {
          handle: () => ({
            pipe: (fn: any) => fn,
          }),
        } as any,
      );

      expect(typeof result).toBe('function');
    });
  });
});
