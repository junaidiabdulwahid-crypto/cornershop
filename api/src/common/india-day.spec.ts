import { startOfIndiaDay } from './india-day';

describe('startOfIndiaDay', () => {
  it('starts the day at 00:00 IST (18:30 UTC the evening before)', () => {
    expect(startOfIndiaDay(new Date('2026-11-14T03:00:00Z')).toISOString()).toBe('2026-11-13T18:30:00.000Z');
    // 20:00 UTC on 13 Nov is already 14 Nov in India
    expect(startOfIndiaDay(new Date('2026-11-13T20:00:00Z')).toISOString()).toBe('2026-11-13T18:30:00.000Z');
  });
});
