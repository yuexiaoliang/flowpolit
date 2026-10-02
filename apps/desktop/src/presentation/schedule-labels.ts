import type { ScheduleRule } from '@flowpilot/contracts';
import { localDate, localTime } from '@flowpilot/domain';

const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

export function scheduleLabel(schedule: ScheduleRule | null | undefined): string {
  if (!schedule) return '添加定时';
  const base =
    schedule.repeat === 'daily'
      ? '每天'
      : schedule.repeat === 'weekly'
        ? `每周${weekdays[Number(schedule.day)]}`
        : schedule.repeat === 'workdays'
          ? '工作日'
          : schedule.date?.slice(5).replace('-', '月') + '日';
  return `${base} ${schedule.time}${schedule.enabled ? '' : ' · 已停用'}`;
}

export function nextLabel(schedule: ScheduleRule | null | undefined, now = new Date()): string {
  if (!schedule?.enabled) return '后续定时已停用';
  if (!schedule.nextAt) return '暂无下一次运行';
  const date = new Date(schedule.nextAt),
    tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const day =
    localDate(date) === localDate(now)
      ? '今天'
      : localDate(date) === localDate(tomorrow)
        ? '明天'
        : `${date.getMonth() + 1}月${date.getDate()}日`;
  return `下次${day} ${localTime(date)}`;
}
