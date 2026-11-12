import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { AuditLog } from './audit-log.entity';

export interface AuditEntry {
  actorUserId: string;
  action: string; // verb_object, e.g. "redeem_offer"
  entityType: string; // table name, e.g. "redemptions"
  entityId: string | null;
}

/** A record of every change. Pass the transaction's manager so the change and its audit row commit together. */
@Injectable()
export class AuditService {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  async record(entry: AuditEntry, manager: EntityManager = this.db.manager): Promise<void> {
    await manager.insert(AuditLog, entry);
  }
}
