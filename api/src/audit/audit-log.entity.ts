import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'actor_user_id' })
  actorUserId!: string;

  @Column('text')
  action!: string;

  @Column('text', { name: 'entity_type' })
  entityType!: string;

  @Column('uuid', { name: 'entity_id', nullable: true })
  entityId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
