import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { AuthedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateReviewDto } from './reviews.dto';
import { ReviewsService } from './reviews.service';

@Controller('shops/:id/reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Param('id', ParseUUIDPipe) shopId: string, @Body() dto: CreateReviewDto, @Req() req: AuthedRequest) {
    return this.reviews.create(shopId, dto, req.user.id);
  }

  @Get()
  forShop(@Param('id', ParseUUIDPipe) shopId: string) {
    return this.reviews.forShop(shopId);
  }
}
