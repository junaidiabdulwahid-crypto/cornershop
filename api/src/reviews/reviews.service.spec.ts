import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import type { AuditService } from '../audit/audit.service';
import { ReviewsService } from './reviews.service';

function fakeDb(manager: Record<string, unknown>): DataSource {
  return { transaction: jest.fn((work: (m: unknown) => unknown) => work(manager)) } as unknown as DataSource;
}

/** A query builder whose insert…execute() returns the given raw rows. */
function fakeInsert(raw: unknown[]) {
  const qb = { insert: () => qb, into: () => qb, values: () => qb, orIgnore: () => qb, returning: () => qb, execute: async () => ({ raw }) };
  return jest.fn(() => qb);
}

describe('ReviewsService.create', () => {
  let audit: AuditService;
  beforeEach(() => {
    audit = { record: jest.fn() } as unknown as AuditService;
  });

  it('refuses a shop that does not exist', async () => {
    const service = new ReviewsService(fakeDb({ findOne: jest.fn().mockResolvedValue(null) }), audit);
    await expect(service.create('s1', { rating: 5, comment: 'Nice' }, 'u1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuses the owner reviewing their own shop', async () => {
    const service = new ReviewsService(fakeDb({ findOne: jest.fn().mockResolvedValue({ id: 's1', ownerId: 'u1' }) }), audit);
    await expect(service.create('s1', { rating: 5, comment: 'Best shop ever' }, 'u1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('answers 409 when the same person reviews twice', async () => {
    const manager = {
      findOne: jest.fn().mockResolvedValue({ id: 's1', ownerId: 'owner' }),
      createQueryBuilder: fakeInsert([]), // ON CONFLICT DO NOTHING → no row back
    };
    const service = new ReviewsService(fakeDb(manager), audit);
    await expect(service.create('s1', { rating: 4, comment: 'Again' }, 'u2')).rejects.toBeInstanceOf(ConflictException);
    expect(audit.record).not.toHaveBeenCalled();
  });
});
