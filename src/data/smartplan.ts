// Умный план недели: собирается из НАШИХ рецептов под введённый рацион малыша.
// Правила: возраст, исключения мамы, всё из введённого, железо каждый день,
// без повторов внутри недели. Стабилен в течение недели (seed = номер недели).
import { IRON_IDS, findFoodByIng } from './foods';
import { RECIPES, type Recipe } from './recipes';
import type { WeekDay, WeekPlan } from './weekplans';

function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SLOTS: { slot: string; kinds: string[] }[] = [
  { slot: 'Завтрак', kinds: ['завтрак', 'каша'] },
  { slot: 'Обед', kinds: ['суп', 'мясо'] },
  { slot: 'Полдник', kinds: ['десерт', 'выпечка'] },
  { slot: 'Ужин', kinds: ['овощ', 'мясо'] },
];
const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

export function buildSmartWeek(introduced: Set<string>, ageMonths: number | null, shift = 0): WeekPlan | null {
  const age = ageMonths ?? 6;
  const ageOk = (a: string) => a === '6+' || (a === '9+' && age >= 9) || (a === '12+' && age >= 12);

  let exc = new Set<string>();
  try { exc = new Set(JSON.parse(localStorage.getItem('bubka-plate-exclusions') || '[]') as string[]); } catch { /* пусто */ }

  const foodsOf = (r: Recipe) => r.ing.map((i) => findFoodByIng(i));
  const usable = RECIPES.filter((r) => {
    if (!ageOk(r.age)) return false;
    const foods = foodsOf(r);
    if (foods.some((f) => f && exc.has(f.id))) return false;
    // все узнаваемые ингредиенты — из введённого (вода/специи и пр. не блокируют)
    return foods.every((f) => !f || introduced.has(f.id));
  });
  if (usable.length < 8) return null;

  const week = Math.floor(Date.now() / (7 * 864e5));
  const rnd = mulberry32(week + shift * 7919);
  const used = new Set<string>();
  const hasIron = (r: Recipe) => foodsOf(r).some((f) => f && IRON_IDS.includes(f.id));

  const pick = (kinds: string[], needIron: boolean): Recipe | null => {
    let pool = usable.filter((r) => kinds.includes(r.kind ?? '') && !used.has(r.n) && (!needIron || hasIron(r)));
    if (!pool.length) pool = usable.filter((r) => !used.has(r.n) && (!needIron || hasIron(r)));
    if (!pool.length) pool = usable.filter((r) => kinds.includes(r.kind ?? ''));
    if (!pool.length) return null;
    const r = pool[Math.floor(rnd() * pool.length)];
    used.add(r.n);
    return r;
  };

  const days: WeekDay[] = DAYS.map((day) => {
    const meals: WeekDay['meals'] = [];
    let ironDone = false;
    SLOTS.forEach((s, si) => {
      const r = pick(s.kinds, si === 3 && !ironDone);
      if (r) {
        if (hasIron(r)) ironDone = true;
        meals.push({ slot: s.slot, recipe: r.n });
      }
    });
    return { day, meals };
  });

  return {
    id: 'smart',
    t: 'Мой план недели',
    e: '✨',
    age: age >= 12 ? '12+' : age >= 9 ? '9+' : '6+',
    days,
  };
}
