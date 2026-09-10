// lib/cron-utils.ts
import { addHours, setSeconds, setMinutes } from 'date-fns';

/**
 * Hitung next run dari cron schedule (format standar 5-field).
 * Format: "minute hour day month dayOfWeek"
 *
 * Yang didukung:
 * - "0 * * * *"        → setiap jam
 * - "0 <star>/N * * *" → setiap N jam (aligned ke grid, mis. 6 → 00,06,12,18)
 * - "0 0 * * *"        → setiap hari jam 00:00
 * - "M H * * *"        → setiap hari jam H:M
 * - "M H * * D"        → setiap minggu di hari D jam H:M
 */
export function calculateNextRun(schedule: string): Date {
  const now = new Date();
  const parts = schedule.trim().split(/\s+/);

  if (parts.length !== 5) {
    // Fallback: 6 jam dari sekarang
    return setSeconds(setMinutes(addHours(now, 6), 0), 0);
  }

  const [minuteStr, hourStr, dayStr, monthStr, dowStr] = parts;

  // ====== SETIAP JAM: "0 * * * *" ======
  if (minuteStr === '0' && hourStr === '*' && dayStr === '*' && monthStr === '*' && dowStr === '*') {
    const next = addHours(now, 1);
    return setSeconds(setMinutes(next, 0), 0);
  }

  // ====== SETIAP N JAM: "0 */N * * *" ======
  // PENTING: aligned ke grid (bukan addHours(now, N)).
  // Contoh: */6 pada 13:00 → next = 18:00 (bukan 19:00).
  if (minuteStr === '0' && hourStr.startsWith('*/') && dayStr === '*' && monthStr === '*' && dowStr === '*') {
    const interval = parseInt(hourStr.slice(2), 10);
    if (!isNaN(interval) && interval > 0 && interval <= 24 && 24 % interval === 0) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Cari jam berikutnya yang kelipatan interval
      let nextHour = Math.ceil((currentHour + 1) / interval) * interval;
      let dayOffset = 0;

      // Kalau currentHour tepat di grid DAN menit > 0, berarti masih harus ke grid berikutnya
      // Contoh: 12:05 dengan */6 → next = 18:00 (bukan 12:00)
      if (currentMinute === 0 && currentHour % interval === 0) {
        // tepat di grid, next = currentHour + interval
        nextHour = currentHour + interval;
      }

      if (nextHour >= 24) {
        nextHour = 0;
        dayOffset = 1;
      }

      const next = new Date(now);
      next.setDate(now.getDate() + dayOffset);
      next.setHours(nextHour, 0, 0, 0);
      return next;
    }
  }

  // ====== HARIAN: "M H * * *" ======
  if (dayStr === '*' && monthStr === '*' && dowStr === '*') {
    const m = parseInt(minuteStr, 10);
    const h = parseInt(hourStr, 10);
    if (!isNaN(m) && !isNaN(h) && h >= 0 && h < 24 && m >= 0 && m < 60) {
      const next = new Date(now);
      next.setHours(h, m, 0, 0);
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      return next;
    }
  }

  // ====== MINGGUAN: "M H * * D" ======
  if (dayStr === '*' && monthStr === '*' && dowStr !== '*') {
    const m = parseInt(minuteStr, 10);
    const h = parseInt(hourStr, 10);
    const targetDow = parseInt(dowStr, 10);
    if (!isNaN(m) && !isNaN(h) && !isNaN(targetDow)) {
      const next = new Date(now);
      next.setHours(h, m, 0, 0);
      const currentDow = next.getDay();
      let daysAhead = (targetDow - currentDow + 7) % 7;
      if (daysAhead === 0 && next <= now) {
        daysAhead = 7;
      }
      next.setDate(next.getDate() + daysAhead);
      return next;
    }
  }

  // ====== FALLBACK: 6 jam dari sekarang ======
  return setSeconds(setMinutes(addHours(now, 6), 0), 0);
}

/**
 * Format schedule jadi label human-readable.
 * "0 *\/6 * * *" → "Setiap 6 jam (00:00, 06:00, 12:00, 18:00)"
 */
export function describeSchedule(schedule: string): string {
  const parts = schedule.trim().split(/\s+/);
  if (parts.length !== 5) return schedule;

  const [minuteStr, hourStr, dayStr, monthStr, dowStr] = parts;

  if (minuteStr === '0' && hourStr === '*' && dayStr === '*' && monthStr === '*' && dowStr === '*') {
    return 'Setiap jam';
  }

  if (minuteStr === '0' && hourStr.startsWith('*/') && dayStr === '*' && monthStr === '*' && dowStr === '*') {
    const interval = parseInt(hourStr.slice(2), 10);
    if (!isNaN(interval) && interval > 0 && 24 % interval === 0) {
      const hours: string[] = [];
      for (let h = 0; h < 24; h += interval) {
        hours.push(`${String(h).padStart(2, '0')}:00`);
      }
      return `Setiap ${interval} jam (${hours.join(', ')})`;
    }
  }

  if (dayStr === '*' && monthStr === '*' && dowStr === '*') {
    const m = parseInt(minuteStr, 10);
    const h = parseInt(hourStr, 10);
    if (!isNaN(m) && !isNaN(h)) {
      return `Setiap hari jam ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }

  return schedule;
}