import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthedRequest, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateShopDto, NearbyQueryDto } from './shops.dto';
import { ShopsService } from './shops.service';

@Controller('shops')
export class ShopsController {
  constructor(private readonly shops: ShopsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateShopDto, @Req() req: AuthedRequest) {
    return this.shops.create(dto, req.user.id); // the owner comes from the token, never the body
  }

  @Get('nearby') // public: anyone can browse
  nearby(@Query() query: NearbyQueryDto) {
    return this.shops.nearby(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.shops.findOne(id);
  }
}
