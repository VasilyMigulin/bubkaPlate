// Модель данных прикорм-приложения bubka plate

export type Reaction = 'ok' | 'wait' | 'skin' | 'tummy';
export type FoodStatus = 'loved' | 'liked' | 'trying' | 'disliked' | null;

/** Ключ векторной формы подачи (см. ServeShape). */
export type ShapeKey =
  | 'puree' | 'porridge' | 'stick' | 'halfmoon' | 'wedge' | 'floret'
  | 'cubes' | 'dice' | 'grated' | 'spread' | 'flakes' | 'ball'
  | 'coin' | 'scramble' | 'whole' | 'wait' | 'drink' | 'oil';

/** Подача: ключ — ступень (6/8/10/12), значение — [форма, текст, необязательная подпись возраста].
 *  Подпись возраста нужна там, где по документу способ доступен раньше/с условием (напр. у яблока все способы с 6 мес). */
export type ServeMap = Record<string, [ShapeKey, string] | [ShapeKey, string, string]>;

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
  choose?: string;      // как выбрать / признак спелости
  tips?: string[];      // исчерпывающие способы подачи (мять, резать, макать, в блюда)
  serve: ServeMap;
}

export type FoodCategory = 'Овощи' | 'Фрукты' | 'Ягоды' | 'Каши' | 'Белок' | 'Молочное' | 'Напитки и добавки';

export interface LogEntry {
  id: string;       // id продукта
  date: string;     // человекочитаемая дата
  rx: Reaction;
  note?: string;    // заметка мамы для себя
  photo?: string;   // фото момента (сжатый data URL)
  ts?: number;      // метка времени для группировки по месяцам («фильм месяца»)
}

export interface AllergenWindow {
  id: string;        // id продукта
  day: number;       // 1..3
  reaction: 'bad' | null;
}

export type FeedingApproach = 'puree' | 'blw' | 'both';

export interface Profile {
  name: string;
  birthDate: string;        // ISO yyyy-mm-dd
  approach: FeedingApproach;
  started: boolean;         // начали ли прикорм
}

export interface PersistedState {
  profile: Profile | null;
  introduced: string[];
  log: LogEntry[];
  windows: AllergenWindow[];
  readiness: string[];      // отмеченные признаки готовности
}
