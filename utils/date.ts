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

/** Humanize a duration in ms → "30分" / "1h 30分" / "2h" / "瞬时"(<1min). */
export function formatDuration(ms: number): string {
  if (ms <= 60_000) return '瞬时';
  const totalMin = Math.round(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}分`;
}

/** Format a time range: "09:00–09:30" or "09:30" if zero duration. */
export function formatTimeRange(startedAt: number, completedAt: number): string {
  if (completedAt - startedAt <= 60_000) return formatTime(completedAt);
  return `${formatTime(startedAt)}–${formatTime(completedAt)}`;
}
