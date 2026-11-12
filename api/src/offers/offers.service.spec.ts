import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import type { AuditService } from '../audit/audit.service';
import { OffersService } from './offers.service';

/** A DataSource whose transaction() hands the callback a fake EntityManager. */
function fakeDb(manager: Record<string, jest.Mock>): DataSource {
  return { transaction: jest.fn((work: (m: unknown) => unknown) => work(manager)) } as unknown as DataSource;
}

describe('OffersService', () => {
  let audit: AuditService;
  beforeEach(() => {
    audit = { record: jest.fn() } as unknown as AuditService;
  });

  it('refuses a shop that does not exist', async () => {
    const service = new OffersService(fakeDb({ findOne: jest.fn().mockResolvedValue(null) }), audit);
    await expect(service.create('shop-1', { title: 'x', discount_percent: 10 }, 'u1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('refuses anyone who is not the owner, and writes no audit row', async () => {
    const manager = { findOne: jest.fn().mockResolvedValue({ id: 'shop-1', ownerId: 'owner' }) };
    const service = new OffersService(fakeDb(manager), audit);
    await expect(service.create('shop-1', { title: '10% off', discount_percent: 10 }, 'stranger')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('redeem refuses an offer that does not exist', async () => {
    const service = new OffersService(fakeDb({ findOne: jest.fn().mockResolvedValue(null) }), audit);
    await expect(service.redeem('o1', { bill_amount: 100, latitude: 23.67, longitude: 86.15 }, 'u1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
