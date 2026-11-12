import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewDto {
  @IsInt() // no 4.5 stars
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  comment!: string;
}

export interface ReviewView {
  id: string;
  rating: number;
  comment: string;
  created_at: Date;
}

export interface ShopReviews {
  average_rating: number | null; // null when there are no reviews yet
  count: number;
  reviews: ReviewView[]; // no user_id goes out
}
