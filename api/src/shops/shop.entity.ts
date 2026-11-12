import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('shops')
export class Shop {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'owner_id' })
  ownerId!: string;

  @Column('text')
  name!: string;

  @Column('text')
  category!: string;

  // PostGIS point, read and written as GeoJSON: { type: 'Point', coordinates: [lng, lat] }
  @Column('geography', { spatialFeatureType: 'Point', srid: 4326 })
  location!: { type: 'Point'; coordinates: [number, number] };

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
