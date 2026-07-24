// Бейджи и опыт: всё вычисляется из данных дневника — честно и без лишних хранилищ.
import { BIG_ALLERGENS, FOODS, IRON_IDS } from './foods';
import { PLAN30 } from './plan30';
import type { AllergenWindow, LogEntry } from '../types';

export interface BadgeCtx {
  log: LogEntry[];
  introduced: Set<string>;
  windows: AllergenWindow[];
}

export interface Badge {
  id: string;
  e: string;
  title: string;
  hint: string;         // как получить (для ещё не открытых)
  check: (c: BadgeCtx) => boolean;
}

const hasCat = (c: BadgeCtx, cat: string) => FOODS.some((f) => f.cat === cat && c.introduced.has(f.id));
const allergensCovered = (c: BadgeCtx) => new Set(FOODS.filter((f) => f.allergen && c.introduced.has(f.id)).map((f) => f.allergen)).size;

function streakDays(c: BadgeCtx): number {
  const days = new Set(c.log.filter((l) => l.ts).map((l) => new Date(l.ts!).toDateString()));
  let n = 0;
  const d = new Date();
  // допускаем, что сегодня записи ещё нет — стрик не сгорает до конца дня
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
  while (days.has(d.toDateString())) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

function plan30Done(c: BadgeCtx): boolean {
  let manual: Set<number>;
  try { manual = new Set(JSON.parse(localStorage.getItem('bubka-plate-plan30') || '[]') as number[]); } catch { manual = new Set(); }
  return PLAN30.flatMap((w) => w.days).every((d) => manual.has(d.d) || (d.pids.length > 0 && d.pids.every((p) => c.introduced.has(p))));
}

export const BADGES: Badge[] = [
  { id: 'spoon1', e: '🥄', title: 'Первая ложка', hint: 'Запишите первую пробу', check: (c) => c.log.length > 0 },
  { id: 'veg1', e: '🥦', title: 'Овощной старт', hint: 'Введите первый овощ', check: (c) => hasCat(c, 'Овощи') },
  { id: 'fruit1', e: '🍎', title: 'Сладкая жизнь', hint: 'Введите первый фрукт', check: (c) => hasCat(c, 'Фрукты') },
  { id: 'iron1', e: '🥩', title: 'Железный человек', hint: 'Введите первый источник железа', check: (c) => IRON_IDS.some((id) => c.introduced.has(id)) },
  { id: 'fish1', e: '🐟', title: 'Первая рыбка', hint: 'Введите рыбу', check: (c) => ['cod', 'salmon'].some((id) => c.introduced.has(id)) },
  { id: 'egg1', e: '🥚', title: 'Яйцо покорено', hint: 'Введите яйцо', check: (c) => c.introduced.has('egg') },
  { id: 'nut1', e: '🥜', title: 'Крепкий орешек', hint: 'Введите арахис или орехи', check: (c) => c.introduced.has('peanut') || c.introduced.has('nuts') },
  { id: 'allerg1', e: '🛡', title: 'Первый аллерген позади', hint: 'Пройдите 3 дня с любым аллергеном', check: (c) => c.windows.some((w) => w.day >= 3 && w.reaction !== 'bad') || allergensCovered(c) > 0 },
  { id: 'nine', e: '👑', title: 'Вся девятка', hint: 'Введите все 9 главных аллергенов', check: (c) => allergensCovered(c) >= BIG_ALLERGENS.size },
  { id: 'p10', e: '🌱', title: 'Первая десятка', hint: '10 продуктов в рационе', check: (c) => c.introduced.size >= 10 },
  { id: 'p30', e: '🌿', title: 'Тридцать вкусов', hint: '30 продуктов в рационе', check: (c) => c.introduced.size >= 30 },
  { id: 'p50', e: '🌳', title: 'Полсотни!', hint: '50 продуктов в рационе', check: (c) => c.introduced.size >= 50 },
  { id: 'pall', e: '🏆', title: 'Весь каталог', hint: `Все ${FOODS.length} продуктов`, check: (c) => c.introduced.size >= FOODS.length },
  { id: 'photo1', e: '📸', title: 'Первый кадр', hint: 'Добавьте фото к записи', check: (c) => c.log.some((l) => l.photo) },
  { id: 'calm10', e: '💚', title: 'Десять спокойных', hint: '10 проб без реакции', check: (c) => c.log.filter((l) => l.rx === 'ok').length >= 10 },
  { id: 'streak7', e: '🔥', title: 'Неделя без пропусков', hint: '7 дней записей подряд', check: (c) => streakDays(c) >= 7 },
  { id: 'plan30', e: '🗓', title: 'Месяц новичка пройден', hint: 'Завершите план 30 дней', check: plan30Done },
];

export function earnedBadges(c: BadgeCtx): Badge[] {
  return BADGES.filter((b) => { try { return b.check(c); } catch { return false; } });
}

// ── Опыт и уровни ──
export const LEVELS: { xp: number; title: string; e: string }[] = [
  { xp: 0, title: 'Первая ложка', e: '🥄' },
  { xp: 120, title: 'Смелый дегустатор', e: '😋' },
  { xp: 320, title: 'Исследователь вкусов', e: '🧭' },
  { xp: 650, title: 'Знаток текстур', e: '🥣' },
  { xp: 1100, title: 'Гурман-путешественник', e: '🌍' },
  { xp: 1700, title: 'Шеф маленькой кухни', e: '👩‍🍳' },
];

export function computeXP(c: BadgeCtx): number {
  return c.log.length * 8 + c.introduced.size * 20 + earnedBadges(c).length * 40;
}

export function levelOf(xp: number) {
  const idx = LEVELS.reduce((acc, l, i) => (xp >= l.xp ? i : acc), 0);
  const cur = LEVELS[idx];
  const next = LEVELS[idx + 1] ?? null;
  const pct = next ? Math.min(100, Math.round(((xp - cur.xp) / (next.xp - cur.xp)) * 100)) : 100;
  return { idx, cur, next, pct };
}
