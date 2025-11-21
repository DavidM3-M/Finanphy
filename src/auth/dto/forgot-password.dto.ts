import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

// dto/forgot-password.dto.ts
export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}


// dto/reset-password.dto.ts
export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  newPassword: string;

}