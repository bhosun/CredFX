import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from './entities/transaction.entity';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { ExchangeService } from 'src/exchange/exchange.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, Transaction]),
    AuthModule,
    JwtModule,
    HttpModule
  ],
  providers: [WalletService, ExchangeService],
  controllers: [WalletController],
  exports: [WalletService],
})
export class WalletModule {}
