// src/mail/mail.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.MAIL_PORT) || 587,
      secure: false, // true para 465
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendPasswordReset(email: string, token: string) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${email}`;
  await this.transporter.sendMail({
    from: `"Soporte Finanphy" <${process.env.MAIL_USER}>`,
    to: email,
    subject: 'Recuperación de contraseña',
    html: `
      <h3>Recuperación de contraseña</h3>
      <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
      <a href="${resetUrl}" style="color:#1a73e8;text-decoration:none;">Restablecer contraseña</a>
      <p>Si no funciona, copia y pega esta URL en tu navegador:</p>
      <p>${resetUrl}</p>
    `,
  });
}
}