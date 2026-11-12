import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('offers')
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'shop_id' })
  shopId!: string;

  @Column('text')
  title!: string;

  // NUMERIC comes back from PostgreSQL as a string ("10.00") to keep every digit exact
  @Column('numeric', { name: 'discount_percent', precision: 5, scale: 2 })
  discountPercent!: string;

  @Column('int', { name: 'daily_limit', default: 20 })
  dailyLimit!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
