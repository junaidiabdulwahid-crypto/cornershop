import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'shop_id' })
  shopId!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column('smallint')
  rating!: number; // SMALLINT comes back as a number (unlike NUMERIC)

  @Column('text')
  comment!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
