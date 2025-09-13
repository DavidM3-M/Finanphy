import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token no enviado o mal formado');
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET no está definido');
    }

    try {
      const decoded = jwt.verify(token, secret);

      if (typeof decoded !== 'object' || !('sub' in decoded)) {
        throw new UnauthorizedException('Payload inválido');
      }

      req.user = {
        id: decoded['sub'],
        email: decoded['email'],
        role: decoded['role'],
        isActive: decoded['isActive'],
      };

      return true;
    } catch (err) {
      throw new UnauthorizedException(`Token inválido: ${err.message}`);
    }
  }
}