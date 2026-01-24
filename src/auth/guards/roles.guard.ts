import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      console.log('→ Ruta sin restricción de roles');
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      console.warn('→ Usuario sin rol definido');
      throw new ForbiddenException('Acceso denegado: sin rol');
    }

    const userRole = String(user.role).trim();
    console.log('→ Rol del usuario:', userRole);
    console.log('→ Roles requeridos:', requiredRoles);

    const match = requiredRoles.some(
      (role) => role.toLowerCase() === userRole.toLowerCase(),
    );

    if (!match) {
      console.warn(`→ Rol "${userRole}" no autorizado`);
      throw new ForbiddenException('Acceso denegado: rol no permitido');
    }

    return true;
  }
}
