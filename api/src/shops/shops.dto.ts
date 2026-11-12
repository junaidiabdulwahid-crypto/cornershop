import { Type } from 'class-transformer';
import { IsIn, IsInt, IsLatitude, IsLongitude, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const CATEGORIES = ['Cafe', 'Salon', 'Grocery', 'Repair', 'Pharmacy'] as const;

export class CreateShopDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsIn(CATEGORIES)
  category!: (typeof CATEGORIES)[number];

  @IsLatitude()
  latitude!: number;

  @IsLongitude()
  longitude!: number;
}

/** Query strings arrive as text; @Type turns "23.66" into 23.66. */
export class NearbyQueryDto {
  @Type(() => Number)
  @IsLatitude()
  lat!: number;

  @Type(() => Number)
  @IsLongitude()
  lng!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(10000)
  radius_m: number = 2000; // 2 km if not sent
}

export interface NearbyShop {
  id: string;
  name: string;
  category: string;
  distance_m: number;
}

export interface ShopDetail {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
}
