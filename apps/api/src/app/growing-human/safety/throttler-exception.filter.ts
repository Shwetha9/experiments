import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { PROVIDER_FAILURE_REPLY } from '@shwetha/growing-human-contracts';
import { ThrottlerException } from '@nestjs/throttler';

/** Rate limiting must return the reviewed safe reply, never a framework error body. */
@Catch(ThrottlerException)
export class GrowingHumanThrottlerFilter implements ExceptionFilter {
  catch(_: ThrottlerException, host: ArgumentsHost): void {
    const response = host
      .switchToHttp()
      .getResponse<{ status(code: number): { json(body: unknown): void } }>();
    response.status(429).json(PROVIDER_FAILURE_REPLY);
  }
}
