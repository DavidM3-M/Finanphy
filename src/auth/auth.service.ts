// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CompaniesService } from '../companies/companies.service';
import * as bcrypt from 'bcrypt';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly companiesService: CompaniesService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new UnauthorizedException('Email ya registrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: hashedPassword,
    });

    await this.companiesService.create(dto.company, user.id);

    console.log('Usuario completo:', user);
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    try {
      const token = await this.jwtService.signAsync(payload);
      return { access_token: token };
    } catch (err) {
      throw new InternalServerErrorException('Error al generar el token');
    }
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      can_view_product_details: true,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    try {
      const token = await this.jwtService.signAsync(payload);
      return { access_token: token };
    } catch (err) {
      throw new InternalServerErrorException('Error al generar el token');
    }
  }
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    const resetToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email },
      { expiresIn: '15m' },
    );

    await this.mailService.sendPasswordReset(user.email, resetToken);

    return { message: 'Correo de recuperación enviado' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    try {
      const payload = await this.jwtService.verifyAsync(dto.token);
      const user = await this.usersService.findByEmail(dto.email);

      if (!user || user.id !== payload.sub) {
        throw new UnauthorizedException('Token inválido');
      }

      const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
      await this.usersService.updatePassword(user.id, hashedPassword);

      return { message: 'Contraseña actualizada correctamente' };
    } catch (err) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
