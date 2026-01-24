import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

const windows = new Map<string, { count: number; reset: number }>();
const WINDOW_MS = 60_000;
const MAX = parseInt(process.env.OPENAI_MAX_REQUESTS_PER_MINUTE || '10', 10);

@Injectable()
export class RateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    const entry = windows.get(userId) || { count: 0, reset: now + WINDOW_MS };
    if (now > entry.reset) {
      entry.count = 0;
      entry.reset = now + WINDOW_MS;
    }
    entry.count++;
    windows.set(userId, entry);
    if (entry.count > MAX) {
      throw new HttpException(
        'rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
