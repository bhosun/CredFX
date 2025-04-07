import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet, CurrencyType } from './entities/wallet.entity';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from './entities/transaction.entity';
import { FundWalletDto } from './dto/fund-wallet.dto';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async getUserWallets(userId: string): Promise<Wallet[]> {
    return this.walletRepository.find({
      where: { userId },
      select: ['userId', 'currency', 'balance'],
    });
  }

  async getWalletBalance(
    userId: string,
    currency: CurrencyType,
  ): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({
      where: { userId, currency },
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet with currency ${currency} not found`);
    }

    return wallet;
  }

  async fundWallet(
    userId: string,
    fundWalletDto: FundWalletDto,
  ): Promise<Transaction> {
    const { currency, amount, reference } = fundWalletDto;

    if (currency !== CurrencyType.NGN) {
      throw new BadRequestException(
        'You can only fund your wallet in Naira (NGN), and convert to other currencies.',
      );
    }

    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const existing = await this.transactionRepository.findOne({
      where: { reference },
    });
    if (existing) {
      throw new ConflictException(
        'Transaction with this reference already exists',
      );
    }

    const queryRunner =
      this.walletRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager
        .getRepository(Wallet)
        .createQueryBuilder('wallet')
        .setLock('pessimistic_write')
        .where('wallet.userId = :userId', { userId })
        .andWhere('wallet.currency = :currency', { currency })
        .getOne();

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      const transaction = this.transactionRepository.create({
        userId,
        type: TransactionType.FUNDING,
        currency,
        amount,
        reference,
        status: TransactionStatus.COMPLETED,
        description: `Wallet funding - ${currency}`,
      });
      await queryRunner.manager.save(transaction);

      wallet.balance = Number(wallet.balance) + amount;
      await queryRunner.manager.save(wallet);

      await queryRunner.commitTransaction();
      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getTransactionHistory(userId: string): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
