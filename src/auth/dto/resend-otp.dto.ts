import { IS_EMAIL, isEmail, IsEmail } from 'class-validator';

export class ResendOtpDto {
  @IsEmail()
  email: string;
}
