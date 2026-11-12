import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { Shop } from './shop.entity';
import { CreateShopDto, NearbyQueryDto, NearbyShop, ShopDetail } from './shops.dto';

@Injectable()
export class ShopsService {
  constructor(
    @InjectDataSource() private readonly db: DataSource,
    private readonly audit: AuditService,
  ) {}

  /** Creates a shop owned by the signed-in user; the shop and its audit row commit together. */
  async create(dto: CreateShopDto, ownerId: string): Promise<Shop> {
    return this.db.transaction(async (manager) => {
      const shop = await manager.save(
        manager.create(Shop, {
          ownerId,
          name: dto.name.trim(),
          category: dto.category,
          location: { type: 'Point', coordinates: [dto.longitude, dto.latitude] }, // GeoJSON: lng first
        }),
      );
      await this.audit.record({ actorUserId: ownerId, action: 'create_shop', entityType: 'shops', entityId: shop.id }, manager);
      return shop;
    });
  }

  /** Shops within radius_m metres, nearest first. $1, $2, $3 keep user input out of the SQL text. */
  async nearby(q: NearbyQueryDto): Promise<NearbyShop[]> {
    const rows: Array<{ id: string; name: string; category: string; distance_m: string }> = await this.db.query(
      `SELECT id, name, category,
              ST_Distance(location, ST_MakePoint($2, $1)::geography) AS distance_m
         FROM shops
        WHERE ST_DWithin(location, ST_MakePoint($2, $1)::geography, $3)
        ORDER BY distance_m
        LIMIT 50`,
      [q.lat, q.lng, q.radius_m],
    );
    return rows.map((r) => ({ ...r, distance_m: Math.round(Number(r.distance_m)) }));
  }

  /** One shop's public details (no owner id). */
  async findOne(id: string): Promise<ShopDetail> {
    const shop = await this.db.getRepository(Shop).findOneBy({ id });
    if (!shop) throw new NotFoundException('Shop not found');
    const [longitude, latitude] = shop.location.coordinates;
    return { id: shop.id, name: shop.name, category: shop.category, latitude, longitude };
  }
}
