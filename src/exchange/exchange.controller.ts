import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { ExchangeService } from "./exchange.service";
import { ConvertCurrencyDto } from "./dto/convert-currency.dto";

@Controller("exchange")
@UseGuards(JwtAuthGuard)
export class ExchangeController {
  constructor(private readonly exchangeService: ExchangeService) {}

  @Get("current-rates")
  async getExchangeRates() {
    return this.exchangeService.getExchangeRates();
  }

  @Post("convert")
  async convertCurrency(@Req() req, @Body() currencyData: ConvertCurrencyDto) {
    const data = {
      ...currencyData,
      userId: req.user.sub,
    };
    return this.exchangeService.convertCurrency(data);
  }
}