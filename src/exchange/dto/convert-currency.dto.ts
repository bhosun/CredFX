import { IsEnum, IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { CurrencyType } from 'src/wallet/entities/wallet.entity';

export class ConvertCurrencyDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(CurrencyType)
  fromCurrency: CurrencyType

  @IsEnum(CurrencyType)
  toCurrency: CurrencyType
}
