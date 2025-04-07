import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { CurrencyType } from '../wallet/entities/wallet.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
  ) {}

  async create(userData: any): Promise<any> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async findById(id: string): Promise<any> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<any> {
    return this.userRepository.findOne({ where: { email } });
  }

  async verifyUser(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      isVerified: true,
      otp: "",
    });
  }

  async updateOtp(userId: string, otp: string, otpExpires: Date): Promise<void> {
    await this.userRepository.update(userId, { otp, otpExpires });
  }

  async createUserWallets(userId: string): Promise<void> {
    const currencies = Object.values(CurrencyType);
    
    for (const currency of currencies) {
      const wallet = this.walletRepository.create({
        userId,
        currency,
        balance: 0,
      });
      await this.walletRepository.save(wallet);
    }
  }
}
