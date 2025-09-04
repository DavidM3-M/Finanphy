import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers.authorization;

    if (!authHeader) throw new UnauthorizedException('Missing token');

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    try {
      const decoded = jwt.verify(token, secret);

      if (typeof decoded === 'object' && 'sub' in decoded) {
        req.user = {
          id: decoded.sub,
          email: decoded.email,
          role: decoded.role,
          isActive: decoded.isActive,
        };
        return true;
      }

      throw new UnauthorizedException('Invalid token payload');
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}