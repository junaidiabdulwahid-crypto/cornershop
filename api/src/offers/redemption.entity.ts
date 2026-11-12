import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('redemptions')
export class Redemption {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'offer_id' })
  offerId!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column('numeric', { name: 'bill_amount', precision: 12, scale: 2 })
  billAmount!: string;

  @Column('numeric', { name: 'discount_amount', precision: 12, scale: 2 })
  discountAmount!: string;

  @Column('numeric', { name: 'payable_amount', precision: 12, scale: 2 })
  payableAmount!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
