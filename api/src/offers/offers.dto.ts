import { IsInt, IsLatitude, IsLongitude, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateOfferDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(100) // the same rule as the database CHECK
  discount_percent!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  daily_limit?: number;
}

export class RedeemOfferDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  bill_amount!: number;

  // The customer's phone location: they must be at the shop
  @IsLatitude()
  latitude!: number;

  @IsLongitude()
  longitude!: number;
}

export interface OfferView {
  id: string;
  title: string;
  discount_percent: number;
  daily_limit: number;
  used_today: number;
}

export interface RedemptionReceipt {
  redemption_id: string;
  bill_amount: number;
  discount_amount: number;
  payable_amount: number;
}
