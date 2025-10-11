import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from 'src/users/users.service';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'devSecret'),
    });
  }

  async validate(payload: any) {
  const tokenId = payload.sub ?? payload.id ?? payload.userId;
  if (tokenId == null) {
    throw new UnauthorizedException('Token missing identifier');
  }

  // Garantizar que se pasa un string a usersService.findById sin cambiar su firma
  const lookupIdStr = String(tokenId);

  const user = await this.usersService.findById(lookupIdStr);
  if (!user || !user.isActive) {
    throw new UnauthorizedException('Usuario inválido o inactivo');
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}
}