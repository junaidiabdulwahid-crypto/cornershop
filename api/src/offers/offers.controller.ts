import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { AuthedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOfferDto, RedeemOfferDto } from './offers.dto';
import { OffersService } from './offers.service';

@Controller() // full paths below: /shops/:id/offers and /offers/:id/redeem
export class OffersController {
  constructor(private readonly offers: OffersService) {}

  @Post('shops/:id/offers')
  @UseGuards(JwtAuthGuard)
  create(@Param('id', ParseUUIDPipe) shopId: string, @Body() dto: CreateOfferDto, @Req() req: AuthedRequest) {
    return this.offers.create(shopId, dto, req.user.id);
  }

  @Get('shops/:id/offers')
  forShop(@Param('id', ParseUUIDPipe) shopId: string) {
    return this.offers.forShop(shopId);
  }

  @Post('offers/:id/redeem')
  @UseGuards(JwtAuthGuard)
  redeem(@Param('id', ParseUUIDPipe) offerId: string, @Body() dto: RedeemOfferDto, @Req() req: AuthedRequest) {
    return this.offers.redeem(offerId, dto, req.user.id);
  }
}
