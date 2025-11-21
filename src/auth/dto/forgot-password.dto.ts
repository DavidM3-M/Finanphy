// dto/forgot-password.dto.ts
export class ForgotPasswordDto {
  email: string;
}

// dto/reset-password.dto.ts
export class ResetPasswordDto {
  token: string;
  email: string;
  newPassword: string;
}