import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtModule } from '@nestjs/jwt';
import { Wallet } from 'src/wallet/entities/wallet.entity';
import { Transaction } from 'src/wallet/entities/transaction.entity';
import { AuthModule } from 'src/auth/auth.module';
import { ExchangeService } from './exchange.service';
import { ExchangeController } from './exchange.controller';
import { HttpModule } from '@nestjs/axios';
import { WalletModule } from 'src/wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, Transaction]),
    AuthModule,
    JwtModule,
    HttpModule,
    WalletModule
  ],
  providers: [ExchangeService],
  controllers: [ExchangeController],
  exports: [ExchangeService],
})
export class ExchangeModule {}
