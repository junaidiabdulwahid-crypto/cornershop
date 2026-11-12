import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { startOfIndiaDay } from '../common/india-day';
import { paiseToRupees, percentOfPaise, rupeesToPaise } from '../common/money';
import { Shop } from '../shops/shop.entity';
import { Offer } from './offer.entity';
import { CreateOfferDto, OfferView, RedeemOfferDto, RedemptionReceipt } from './offers.dto';
import { Redemption } from './redemption.entity';

/** The customer must be standing at the shop to redeem. */
export const SHOP_RADIUS_METRES = 100;

@Injectable()
export class OffersService {
  constructor(
    @InjectDataSource() private readonly db: DataSource,
    private readonly audit: AuditService,
  ) {}

  /** Only the shop's owner may add offers to it. */
  async create(shopId: string, dto: CreateOfferDto, userId: string): Promise<Offer> {
    return this.db.transaction(async (manager) => {
      const shop = await manager.findOne(Shop, { where: { id: shopId } });
      if (!shop) throw new NotFoundException('Shop not found');
      if (shop.ownerId !== userId) throw new ForbiddenException('Only the shop owner can add offers'); // 403: signed in, not allowed

      const offer = await manager.save(
        manager.create(Offer, {
          shopId,
          title: dto.title.trim(),
          discountPercent: dto.discount_percent.toFixed(2), // 10 → "10.00" for NUMERIC
          dailyLimit: dto.daily_limit ?? 20,
        }),
      );
      await this.audit.record({ actorUserId: userId, action: 'create_offer', entityType: 'offers', entityId: offer.id }, manager);
      return offer;
    });
  }

  /** A shop's offers, newest first, with how many slots are used today. */
  async forShop(shopId: string): Promise<OfferView[]> {
    const rows: Array<{ id: string; title: string; discount_percent: string; daily_limit: number; used_today: number }> =
      await this.db.query(
        `SELECT o.id, o.title, o.discount_percent, o.daily_limit,
                (SELECT count(*)::int FROM redemptions r WHERE r.offer_id = o.id AND r.created_at >= $2) AS used_today
           FROM offers o
          WHERE o.shop_id = $1
          ORDER BY o.created_at DESC
          LIMIT 50`,
        [shopId, startOfIndiaDay()],
      );
    return rows.map((r) => ({ ...r, discount_percent: Number(r.discount_percent) }));
  }

  /**
   * Uses an offer: at the shop (100 m), within today's limit, exact paise maths.
   * The offer row is locked, so two customers at the same moment cannot both
   * take the last slot of the day.
   */
  async redeem(offerId: string, dto: RedeemOfferDto, userId: string): Promise<RedemptionReceipt> {
    return this.db.transaction(async (manager) => {
      const offer = await manager.findOne(Offer, {
        where: { id: offerId },
        lock: { mode: 'pessimistic_write' }, // SELECT … FOR UPDATE: others wait here
      });
      if (!offer) throw new NotFoundException('Offer not found'); // rule 1

      const [{ near }]: Array<{ near: boolean }> = await manager.query(
        `SELECT ST_DWithin(location, ST_MakePoint($2, $3)::geography, $4) AS near FROM shops WHERE id = $1`,
        [offer.shopId, dto.longitude, dto.latitude, SHOP_RADIUS_METRES],
      );
      if (!near) throw new BadRequestException(`You need to be within ${SHOP_RADIUS_METRES} m of the shop`); // rule 2

      const usedToday = await manager
        .createQueryBuilder(Redemption, 'r')
        .where('r.offer_id = :offerId', { offerId })
        .andWhere('r.created_at >= :since', { since: startOfIndiaDay() }) // today = since midnight IST
        .getCount();
      if (usedToday >= offer.dailyLimit) throw new BadRequestException('This offer is fully used for today'); // rule 3

      const billPaise = rupeesToPaise(dto.bill_amount); // rule 4: maths in paise
      const discountPaise = percentOfPaise(billPaise, Number(offer.discountPercent));
      const payablePaise = billPaise - discountPaise;

      const saved = await manager.save(
        manager.create(Redemption, {
          offerId,
          userId,
          billAmount: paiseToRupees(billPaise).toFixed(2),
          discountAmount: paiseToRupees(discountPaise).toFixed(2),
          payableAmount: paiseToRupees(payablePaise).toFixed(2),
        }),
      );
      await this.audit.record({ actorUserId: userId, action: 'redeem_offer', entityType: 'redemptions', entityId: saved.id }, manager);

      return {
        redemption_id: saved.id,
        bill_amount: paiseToRupees(billPaise),
        discount_amount: paiseToRupees(discountPaise),
        payable_amount: paiseToRupees(payablePaise),
      };
    });
  }
}
