import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST'),
      port: this.configService.get('MAIL_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASSWORD'),
      },
    });
  }

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM'),
      to,
      subject: 'Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Thank you for registering with our platform. To verify your email address, please use the following OTP:</p>
          <div style="background-color: #f4f4f4; padding: 10px 15px; border-radius: 4px; font-size: 24px; font-weight: bold; letter-spacing: 2px; text-align: center;">
            ${otp}
          </div>
          <p>This OTP will expire in 5 minutes.</p>
          <p>If you did not request this verification, please ignore this email.</p>
          <p>Best regards,<br>Multi-Cred FX Team</p>
        </div>
      `,
    });
  }
}
