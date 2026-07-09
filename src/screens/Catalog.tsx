import { useMemo, useState } from 'react';
import { CATEGORIES, FOODS } from '../data/foods';
import { MAIN_PHOTOS } from '../data/mainPhotos';
import { FoodIcon } from '../components/FoodIcon';
import { ProductSheet } from '../components/ProductSheet';
import { ServeShape, serveLabel } from '../components/ServeShape';
import { useStore } from '../state/store';
import type { Food, FoodCategory } from '../types';
import './Catalog.css';

const isDarkMode = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

const CAT_EMOJI: Record<FoodCategory, string> = {
  'Овощи': '🥦', 'Фрукты': '🍎', 'Ягоды': '🫐', 'Каши': '🌾', 'Белок': '🥩', 'Молочное': '🥛',
};

type Filter = 'all' | FoodCategory | 'allergens';

function serveForAge(f: Food, ageMonths: number | null) {
  const keys = Object.keys(f.serve).map(Number).sort((a, b) => a - b);
  const target = ageMonths == null ? keys[0] : (keys.filter((k) => k <= ageMonths).pop() ?? keys[0]);
  return f.serve[String(target)];
}

const byName = (a: Food, b: Food) => a.n.localeCompare(b.n, 'ru');

export function Catalog() {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<Food | null>(null);
  const { introduced, ageMonths } = useStore();

  const query = q.toLowerCase().trim();

  // При поиске — плоский список по алфавиту. Иначе — по фильтру.
  const searchResults = useMemo(
    () => (query ? FOODS.filter((f) => f.n.toLowerCase().includes(query)).sort(byName) : []),
    [query],
  );

  // Секции для отображения без поиска: [заголовок, эмодзи, продукты по алфавиту]
  const sections = useMemo<{ title: string; emoji: string; note?: string; foods: Food[] }[]>(() => {
    if (query) return [];
    if (filter === 'allergens') {
      const foods = FOODS.filter((f) => f.allergen).sort(byName);
      return [{ title: 'Аллергены', emoji: '⚠️', note: 'Вводить до года по правилу 3 дней: утром, малой дозой, 3 дня подряд. Собраны из всех групп.', foods }];
    }
    const cats = filter === 'all' ? CATEGORIES : [filter];
    return cats
      .map((c) => ({ title: c, emoji: CAT_EMOJI[c], foods: FOODS.filter((f) => f.cat === c).sort(byName) }))
      .filter((s) => s.foods.length > 0);
  }, [query, filter]);

  const renderCard = (f: Food) => {
    const bg = isDarkMode() ? f.dbg : f.bg;
    const done = introduced.has(f.id);
    const tooEarly = ageMonths != null && f.fromMonth > ageMonths;
    const [shape] = serveForAge(f, ageMonths);
    return (
      <button key={f.id} className={`food ${tooEarly ? 'early' : ''}`} onClick={() => setOpen(f)}>
        <div className="food-pic" style={{ background: MAIN_PHOTOS[f.id] ? undefined : `radial-gradient(circle at 32% 28%, ${bg[0]}, ${bg[1]})` }}>
          {MAIN_PHOTOS[f.id] ? <img className="food-photo-cover" src={MAIN_PHOTOS[f.id]} alt={f.n} loading="lazy" /> : <FoodIcon food={f} size={60} />}
          <span className="food-from">с {f.fromMonth}</span>
          {done && <span className="food-done">✓</span>}
        </div>
        <div className="food-meta">
          <div className="food-name">
            {f.n}
            {f.iron && <span className="food-iron">железо</span>}
            {f.allergen && f.allergen !== 'глютен' && <span className="food-al">аллерген</span>}
          </div>
          {tooEarly
            ? <div className="food-age"><span className="food-soon">рано · с {f.fromMonth} мес</span></div>
            : <div className="food-serve"><ServeShape shape={shape} color={bg} size={26} /><span>{serveLabel(shape)}</span></div>}
        </div>
      </button>
    );
  };

  return (
    <>
      <input className="search" placeholder="Найти продукт: банан, яйцо, брокколи…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="segs">
        <button className={`chip ${filter === 'all' ? 'on' : ''}`} onClick={() => setFilter('all')}>Все</button>
        {CATEGORIES.map((c) => (
          <button key={c} className={`chip ${filter === c ? 'on' : ''}`} onClick={() => setFilter(c)}>{CAT_EMOJI[c]} {c}</button>
        ))}
        <button className={`chip chip-warn ${filter === 'allergens' ? 'on' : ''}`} onClick={() => setFilter('allergens')}>⚠️ Аллергены</button>
      </div>

      {query ? (
        <div className="food-grid">{searchResults.map(renderCard)}</div>
      ) : (
        sections.map((s) => (
          <div key={s.title}>
            <div className="cat-head"><span className="cat-emoji">{s.emoji}</span>{s.title}<span className="cat-count">{s.foods.length}</span></div>
            {s.note && <div className="note" style={{ marginBottom: 12 }}><span className="ne">🗓</span><span>{s.note}</span></div>}
            <div className="food-grid">{s.foods.map(renderCard)}</div>
          </div>
        ))
      )}

      {query && searchResults.length === 0 && <div className="sub" style={{ textAlign: 'center', padding: 20 }}>Ничего не нашли — попробуйте другой запрос.</div>}

      {open && <ProductSheet food={open} onClose={() => setOpen(null)} />}
    </>
  );
}
