import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { Shop } from '../shops/shop.entity';
import { Review } from './review.entity';
import { CreateReviewDto, ReviewView, ShopReviews } from './reviews.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectDataSource() private readonly db: DataSource,
    private readonly audit: AuditService,
  ) {}

  /** One review per person per shop; owners cannot review their own shop. */
  async create(shopId: string, dto: CreateReviewDto, userId: string): Promise<ReviewView> {
    return this.db.transaction(async (manager) => {
      const shop = await manager.findOne(Shop, { where: { id: shopId } });
      if (!shop) throw new NotFoundException('Shop not found');
      if (shop.ownerId === userId) throw new ForbiddenException('You cannot review your own shop');

      // ON CONFLICT DO NOTHING: UNIQUE (shop_id, user_id) makes a second review insert no row, even in a race
      const result = await manager
        .createQueryBuilder()
        .insert()
        .into(Review)
        .values({ shopId, userId, rating: dto.rating, comment: dto.comment.trim() })
        .orIgnore()
        .returning(['id'])
        .execute();
      const id: string | undefined = result.raw[0]?.id;
      if (!id) throw new ConflictException('You have already reviewed this shop');

      await this.audit.record({ actorUserId: userId, action: 'create_review', entityType: 'reviews', entityId: id }, manager);
      const r = await manager.findOneOrFail(Review, { where: { id } });
      return { id: r.id, rating: r.rating, comment: r.comment, created_at: r.createdAt }; // no user_id goes out
    });
  }

  /** Newest first, with the average worked out by the database. */
  async forShop(shopId: string): Promise<ShopReviews> {
    const [summary]: Array<{ average: string | null; count: string }> = await this.db.query(
      `SELECT ROUND(AVG(rating), 1) AS average, COUNT(*) AS count FROM reviews WHERE shop_id = $1`,
      [shopId],
    );
    const reviews = await this.db.getRepository(Review).find({ where: { shopId }, order: { createdAt: 'DESC' }, take: 50 });
    return {
      average_rating: summary.average === null ? null : Number(summary.average),
      count: Number(summary.count),
      reviews: reviews.map((r) => ({ id: r.id, rating: r.rating, comment: r.comment, created_at: r.createdAt })),
    };
  }
}
