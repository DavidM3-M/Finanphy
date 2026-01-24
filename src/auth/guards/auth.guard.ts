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
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      console.log('→ Ruta pública detectada');
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers['authorization'];
    console.log('→ Header recibido:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('→ Token ausente o mal formado');
      throw new UnauthorizedException('Token no enviado o mal formado');
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const secret = process.env.JWT_SECRET;
    console.log('→ JWT_SECRET cargado:', secret);

    if (!secret) {
      console.error('→ JWT_SECRET no está definido');
      throw new InternalServerErrorException('JWT_SECRET no está definido');
    }

    try {
      const decoded = jwt.verify(token, secret);
      console.log('→ Token decodificado:', decoded);

      if (typeof decoded !== 'object' || !('sub' in decoded)) {
        console.warn('→ Payload inválido:', decoded);
        throw new UnauthorizedException('Payload inválido');
      }

      req.user = {
        id: decoded['sub'],
        email: decoded['email'],
        role: decoded['role'],
        isActive: decoded['isActive'],
      };

      console.log('→ Usuario inyectado en req.user:', req.user);
      return true;
    } catch (err) {
      console.error('→ Error al verificar token:', err.message);
      throw new UnauthorizedException(`Token inválido: ${err.message}`);
    }
  }
}
