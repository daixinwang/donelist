import dayjs from 'dayjs';

export function formatDayKey(ms: number): string {
  return dayjs(ms).format('YYYY-MM-DD');
}

export function formatTime(ms: number): string {
  return dayjs(ms).format('HH:mm');
}

export function formatFullDateTime(ms: number): string {
  return dayjs(ms).format('YYYY-MM-DD HH:mm');
}

export function humanizeDay(dayKey: string): string {
  const today = dayjs().startOf('day');
  const that = dayjs(dayKey, 'YYYY-MM-DD').startOf('day');
  const diff = today.diff(that, 'day');
  if (diff === 0) return '今天';
  if (diff === 1) return '昨天';
  if (diff === -1) return '明天';
  const sameYear = today.year() === that.year();
  return that.format(sameYear ? 'MM月DD日 ddd' : 'YYYY年MM月DD日');
}

export function weekdayLabel(ms: number): string {
  return ['日', '一', '二', '三', '四', '五', '六'][dayjs(ms).day()];
}

export function startOfWeek(ms: number = Date.now()): number {
  // Monday as first day of week
  const d = dayjs(ms).startOf('day');
  const weekday = d.day();
  const mondayDelta = weekday === 0 ? -6 : 1 - weekday;
  return d.add(mondayDelta, 'day').valueOf();
}

export function startOfMonth(ms: number = Date.now()): number {
  return dayjs(ms).startOf('month').valueOf();
}
