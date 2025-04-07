import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const { email, password } = registerDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = this.generateOtp();
    const otpExpires = new Date();
    const otpExpiration = parseInt(
      this.configService.get<string>('OTP_EXPIRATION') as string,
    );
    otpExpires.setSeconds(otpExpires.getSeconds() + otpExpiration);

    await this.usersService.create({
      email,
      password: hashedPassword,
      otp,
      otpExpires,
    });

    await this.mailService.sendOtpEmail(email, otp);

    return {
      message:
        'User registered successfully. Please verify your email with the OTP sent.',
    };
  }

  async verifyOtp(
    verifyOtpDto: VerifyOtpDto,
  ): Promise<{ message: string; token: string }> {
    const { email, otp } = verifyOtpDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email already verified');
    }

    if (!user.otp || user.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (user.otpExpires < new Date()) {
      throw new BadRequestException('OTP expired');
    }

    await this.usersService.verifyUser(user.id);

    // Create wallets for the user (NGN, USD, EUR)
    await this.usersService.createUserWallets(user.id);

    const token = this.generateToken(user);

    return { message: 'Email verified successfully', token };
  }

  async login(loginDto: LoginDto): Promise<{ token: string }> {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user);

    return { token };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateToken(user: any): string {
    const payload = {
      sub: user.id,
      email: user.email,
      isVerified: user.isVerified,
    };
    return this.jwtService.sign(payload, {
      secret: this.configService?.get('JWT_SECRET'),
      expiresIn: `${this.configService.get('JWT_EXPIRATION')}`,
    });
  }
}
