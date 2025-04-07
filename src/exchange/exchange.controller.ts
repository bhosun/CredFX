import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ExchangeService } from './exchange.service';

@Controller('fx')
@UseGuards(JwtAuthGuard)
export class ExchangeController {
  constructor(private readonly exchangeService: ExchangeService) {}

  @Get('rates')
  async getExchangeRates() {
    return this.exchangeService.getExchangeRates();
  }
}
