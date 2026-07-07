// Схема введения прикорма и объёмы порций (ориентир по линии ВОЗ/ESPGHAN).

export interface ReadinessSign {
  key: string;
  e: string;
  text: string;
}

export const READINESS: ReadinessSign[] = [
  { key: 'head', e: '🙂', text: 'Уверенно держит голову' },
  { key: 'sit', e: '🪑', text: 'Сидит с поддержкой' },
  { key: 'interest', e: '👀', text: 'Тянется к еде, смотрит, как едят взрослые' },
  { key: 'reflex', e: '👅', text: 'Угас рефлекс выталкивания языком' },
  { key: 'grab', e: '✋', text: 'Может взять предмет и поднести ко рту' },
];

export interface ScheduleWeek {
  week: string;
  focus: string;
  foods: string[];      // id продуктов
  note: string;
}

export const SCHEDULE: ScheduleWeek[] = [
  { week: 'Неделя 1', focus: 'Первый овощ', foods: ['zucchini', 'cauliflower'], note: 'Один продукт 3–5 дней, по 1–2 ложки утром. Смотрим на реакцию.' },
  { week: 'Неделя 2', focus: 'Ещё овощи', foods: ['broccoli', 'pumpkin'], note: 'Добавляем по одному новому раз в 3 дня. Повторяем знакомое.' },
  { week: 'Неделя 3', focus: 'Каши без глютена', foods: ['buckwheat'], note: 'Гречка — железо и энергия. Утром, следим за животиком.' },
  { week: 'Неделя 4', focus: 'Первое железо', foods: ['beef', 'turkey'], note: 'Мясо — важнейший источник железа после 6 месяцев. Паштет с овощем.' },
  { week: 'Дальше', focus: 'Фрукты и аллергены', foods: ['apple', 'pear', 'egg'], note: 'Аллергены — по правилу 3 дней, утром, малой дозой.' },
];

/** Объёмы порций-ориентиры по возрасту (граммы прикорма в сутки, плюс молоко/смесь по требованию). */
export interface PortionRow {
  months: string;
  portion: string;
  meals: string;
}

export const PORTIONS: PortionRow[] = [
  { months: '6 мес', portion: '1 ч. л. → 100–150 г', meals: '1 приём в день' },
  { months: '7 мес', portion: '150–170 г', meals: '2 приёма' },
  { months: '8 мес', portion: '170–180 г', meals: '2–3 приёма' },
  { months: '9–11 мес', portion: '180–200 г', meals: '3 приёма' },
  { months: '12 мес', portion: '200–220 г', meals: '3 приёма + перекусы' },
];
