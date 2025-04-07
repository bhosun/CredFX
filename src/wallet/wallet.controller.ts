import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { CurrencyType } from './entities/wallet.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  async getUserWallets(@Req() req) {
    return this.walletService.getUserWallets(req.user.sub);
  }

  @Get('balance')
  async getWalletBalance(@Req() req, @Body('currency') currency: CurrencyType) {
    return this.walletService.getWalletBalance(req.user.sub, currency);
  }

  @Post('fund')
  async fundWallet(@Req() req, @Body() fundWalletData: FundWalletDto) {
    return this.walletService.fundWallet(req.user.sub, fundWalletData);
  }

  @Get('transactions')
  async getTransactionHistory(@Req() req) {
    return this.walletService.getTransactionHistory(req.user.id);
  }
}
