import {
  createCalendarMonthDays,
  formatDateKey,
  isFutureCalendarMonth,
  parseDateKey,
} from '@/features/home/lib/calendar';

describe('calendar utils', () => {
  it('parses a valid date key and rejects invalid dates', () => {
    expect(parseDateKey('2026-03-08')).toEqual(new Date(2026, 2, 8, 12, 0, 0, 0));
    expect(parseDateKey('2026-02-30')).toBeNull();
    expect(parseDateKey('invalid')).toBeNull();
  });

  it('builds month cells including adjacent dates and future flags', () => {
    const today = new Date(2026, 2, 8, 12, 0, 0, 0);
    const days = createCalendarMonthDays(new Date(2026, 2, 1, 12, 0, 0, 0), today);

    expect(days[0]?.isCurrentMonth).toBe(false);
    expect(days.some((day) => day.isCurrentMonth && day.isToday)).toBe(true);
    expect(days.some((day) => day.isCurrentMonth && day.isFuture)).toBe(true);
  });

  it('compares future months by month granularity', () => {
    const today = new Date(2026, 2, 8, 12, 0, 0, 0);

    expect(isFutureCalendarMonth(new Date(2026, 2, 31, 12, 0, 0, 0), today)).toBe(false);
    expect(isFutureCalendarMonth(new Date(2026, 3, 1, 12, 0, 0, 0), today)).toBe(true);
    expect(formatDateKey(new Date(2026, 2, 8, 12, 0, 0, 0))).toBe('2026-03-08');
  });
});
