import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from './decorators/roles.decorator';
import { Role } from './enums/role.enum';
import { RolesGuard } from './guards/roles.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserEntity } from 'src/users/entities/user.entity';
import { Public } from './decorators/public.decorator';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@CurrentUser() user: UserEntity) {
    return user;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin)
  @Get('admin')
  getAdminData(@CurrentUser() admin: UserEntity) {
    return `Hey ${admin.firstName}, you're an admin`;
  }

  // auth.controller.ts
  @Public()
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
