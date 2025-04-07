import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, from } from 'rxjs';
import { CurrencyType, Wallet } from 'src/wallet/entities/wallet.entity';
import { WalletService } from 'src/wallet/wallet.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from 'src/wallet/entities/transaction.entity';
import { ConvertCurrencyDto } from './dto/convert-currency.dto';

@Injectable()
export class ExchangeService {
  private rates: Record<CurrencyType, number>;
  private lastUpdated: Date;
  private nextUpdate: Date;

  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly walletService: WalletService,
  ) {
    this.initializeRates();
  }

  private initializeRates(): void {
    this.rates = {
      [CurrencyType.NGN]: 1,
      [CurrencyType.USD]: 0,
      [CurrencyType.EUR]: 0,
      [CurrencyType.GBP]: 0,
    };
    this.lastUpdated = new Date(0);
    this.nextUpdate = new Date();
  }

  private async fetchAndCacheRates(): Promise<void> {
    try {
      const apiUrl = this.configService.get('EXCHANGE_RATE_API');
      const response = await firstValueFrom(
        this.httpService.get(apiUrl, {
          timeout: 5000,
        }),
      );

      if (!response.data?.conversion_rates) {
        throw new Error('Invalid API response structure');
      }

      this.rates = {
        [CurrencyType.NGN]: 1,
        [CurrencyType.USD]: response.data.conversion_rates.USD,
        [CurrencyType.EUR]: response.data.conversion_rates.EUR,
        [CurrencyType.GBP]: response.data.conversion_rates.GBP,
      };

      this.lastUpdated = new Date();
      this.nextUpdate = new Date(response.data.time_next_update_utc);
    } catch (error) {
      throw new Error('Failed to fetch exchange rates');
    }
  }

  private async ensureFreshRates(): Promise<void> {
    const now = new Date();
    if (now >= this.nextUpdate || !this.lastUpdated) {
      try {
        await this.fetchAndCacheRates();
      } catch (error) {
        if (this.lastUpdated.getTime() === 0) {
          throw error;
        }
      }
    }
  }

  async getExchangeRates(): Promise<{
    rates: Record<CurrencyType, number>;
    lastUpdated: Date;
    nextUpdate: Date;
  }> {
    await this.ensureFreshRates();
    return {
      rates: this.rates,
      lastUpdated: this.lastUpdated,
      nextUpdate: this.nextUpdate,
    };
  }

  async convertCurrency({
    userId,
    amount,
    fromCurrency,
    toCurrency,
  }: {
    userId: string;
    amount: number;
    fromCurrency: CurrencyType;
    toCurrency: CurrencyType;
  }): Promise<Transaction> {
    if (fromCurrency === toCurrency) {
      throw new BadRequestException('Choose different currencies');
    }

    if (fromCurrency !== CurrencyType.NGN && toCurrency !== CurrencyType.NGN) {
      throw new BadRequestException(
        'Conversion only allowed between Naira and other currencies',
      );
    }

    await this.ensureFreshRates();

    const fromRate = this.rates[fromCurrency];
    const toRate = this.rates[toCurrency];

    if (fromRate <= 0 || toRate <= 0) {
      throw new InternalServerErrorException('Invalid exchange rate values');
    }

    const rate = toRate / fromRate;
    const convertedAmount = parseFloat((amount * rate).toFixed(2));

    const queryRunner =
      this.walletRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const fromWallet = await queryRunner.manager
        .getRepository(Wallet)
        .createQueryBuilder('wallet')
        .setLock('pessimistic_write')
        .where('wallet.userId = :userId', { userId })
        .andWhere('wallet.currency = :currency', { currency: fromCurrency })
        .getOne();

      if (!fromWallet) {
        throw new NotFoundException(`Wallet not found for ${fromCurrency}`);
      }

      if (Number(fromWallet.balance) < amount) {
        throw new BadRequestException(`Insufficient ${fromCurrency} balance`);
      }

      const toWallet = await queryRunner.manager
        .getRepository(Wallet)
        .createQueryBuilder('wallet')
        .setLock('pessimistic_write')
        .where('wallet.userId = :userId', { userId })
        .andWhere('wallet.currency = :currency', { currency: toCurrency })
        .getOne();

      if (!toWallet) {
        throw new NotFoundException(`Wallet not found for ${toCurrency}`);
      }

      fromWallet.balance = Number(fromWallet.balance) - amount;
      toWallet.balance = Number(toWallet.balance) + convertedAmount;

      await queryRunner.manager.save(fromWallet);
      await queryRunner.manager.save(toWallet);

      const referenceId = `CONV-${Date.now()}-${userId.slice(0, 8)}`;

      const debitTransaction = this.transactionRepository.create({
        userId,
        type: TransactionType.CONVERSION,
        currency: fromCurrency,
        amount: -amount,
        status: TransactionStatus.COMPLETED,
        description: `Currency conversion: ${amount} ${fromCurrency} to ${convertedAmount} ${toCurrency}`,
        reference: referenceId,
      });

      const creditTransaction = this.transactionRepository.create({
        userId,
        type: TransactionType.CONVERSION,
        currency: toCurrency,
        amount: convertedAmount,
        status: TransactionStatus.COMPLETED,
        description: `Currency conversion: ${amount} ${fromCurrency} to ${convertedAmount} ${toCurrency}`,
        reference: referenceId,
      });

      await queryRunner.manager.save(debitTransaction);
      await queryRunner.manager.save(creditTransaction);

      await queryRunner.commitTransaction();
      return creditTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Currency conversion failed');
    } finally {
      await queryRunner.release();
    }
  }
}
