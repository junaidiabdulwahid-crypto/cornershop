import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health.controller';
import { OffersModule } from './offers/offers.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ShopsModule } from './shops/shops.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL, // from env, never in code
      autoLoadEntities: true,
      synchronize: false, // the SQL files own the schema, never TypeORM
    }),
    AuditModule,
    AuthModule,
    ShopsModule,
    OffersModule,
    ReviewsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
