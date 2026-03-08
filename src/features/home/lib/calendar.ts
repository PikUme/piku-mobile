const DAY_NAMES = ['월', '화', '수', '목', '금', '토', '일'] as const;

const MIDDAY_HOUR = 12;

export interface CalendarDayCell {
  date: Date;
  dateKey: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export function createCalendarDate(year: number, monthIndex: number, day: number) {
  return new Date(year, monthIndex, day, MIDDAY_HOUR, 0, 0, 0);
}

export function startOfCalendarMonth(date: Date) {
  return createCalendarDate(date.getFullYear(), date.getMonth(), 1);
}

export function addCalendarMonths(date: Date, amount: number) {
  return createCalendarDate(date.getFullYear(), date.getMonth() + amount, 1);
}

export function setCalendarYearMonth(date: Date, year: number, monthIndex: number) {
  return createCalendarDate(year, monthIndex, 1);
}

export function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey.trim());
  if (!match) {
    return null;
  }

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const monthIndex = Number(monthValue) - 1;
  const day = Number(dayValue);
  const parsedDate = createCalendarDate(year, monthIndex, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== monthIndex ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

export function isSameCalendarDay(left: Date, right: Date) {
  return formatDateKey(left) === formatDateKey(right);
}

export function isFutureCalendarDay(date: Date, today = new Date()) {
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const current = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();

  return target > current;
}

export function isFutureCalendarMonth(date: Date, today = new Date()) {
  return startOfCalendarMonth(date).getTime() > startOfCalendarMonth(today).getTime();
}

export function createCalendarMonthDays(date: Date, today = new Date()) {
  const currentMonthStart = startOfCalendarMonth(date);
  const firstWeekday = (currentMonthStart.getDay() + 6) % 7;
  const monthEndDay = getDaysInMonth(date.getFullYear(), date.getMonth());
  const currentMonthEnd = createCalendarDate(
    date.getFullYear(),
    date.getMonth(),
    monthEndDay,
  );
  const lastWeekday = (currentMonthEnd.getDay() + 6) % 7;
  const leadingDays = firstWeekday;
  const trailingDays = 6 - lastWeekday;
  const totalDays = leadingDays + monthEndDay + trailingDays;
  const startDate = createCalendarDate(
    date.getFullYear(),
    date.getMonth(),
    1 - leadingDays,
  );

  return Array.from({ length: totalDays }, (_, index) => {
    const cellDate = createCalendarDate(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate() + index,
    );

    return {
      date: cellDate,
      dateKey: formatDateKey(cellDate),
      isCurrentMonth: cellDate.getMonth() === date.getMonth(),
      isToday: isSameCalendarDay(cellDate, today),
      isFuture: isFutureCalendarDay(cellDate, today),
    } satisfies CalendarDayCell;
  });
}

export function formatMonthLabel(date: Date) {
  const year = String(date.getFullYear()).slice(-2);
  return `${year}년 ${date.getMonth() + 1}월`;
}

export function formatFullMonthLabel(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

export function getCalendarDayNames() {
  return DAY_NAMES;
}
