// Модель данных прикорм-приложения bubka-food

export type Reaction = 'ok' | 'wait' | 'skin' | 'tummy';
export type FoodStatus = 'loved' | 'liked' | 'trying' | 'disliked' | null;

/** Подача по возрастам: ключ — месяц (6/8/10/12), значение — [эмодзи-иконка, текст] */
export type ServeMap = Record<string, [string, string]>;

export interface Food {
  id: string;
  e: string;            // эмодзи-заглушка (заменится фото)
  n: string;            // название
  cat: FoodCategory;    // группа продуктов
  fromMonth: number;    // с какого месяца можно вводить
  allergen: string | null; // тип аллергена или null
  choke: string;        // риск подавиться
  iron: boolean;        // источник железа
  status: FoodStatus;   // статус в рационе
  bg: [string, string]; // градиент карточки (светлая тема)
  dbg: [string, string];// градиент (тёмная тема)
  benefit: string;
  cook: string;
  store: string;
  caution: string;      // «когда нельзя»
  serve: ServeMap;
}

export type FoodCategory = 'Овощи' | 'Фрукты' | 'Каши' | 'Белок' | 'Аллергены';

export interface LogEntry {
  id: string;   // id продукта
  date: string; // человекочитаемая дата
  rx: Reaction;
}

export interface AllergenWindow {
  id: string;        // id продукта
  day: number;       // 1..3
  reaction: 'bad' | null;
}
