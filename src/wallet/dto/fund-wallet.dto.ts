import { IsEnum, IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { CurrencyType } from '../entities/wallet.entity';

export class FundWalletDto {
  @IsEnum(CurrencyType)
  currency: CurrencyType;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsOptional()
  reference?: string;
}
