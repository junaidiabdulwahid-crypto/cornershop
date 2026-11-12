import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Shop } from '../shops/shop.entity';
import { Offer } from './offer.entity';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { Redemption } from './redemption.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Offer, Redemption, Shop]), AuthModule],
  controllers: [OffersController],
  providers: [OffersService],
})
export class OffersModule {}
