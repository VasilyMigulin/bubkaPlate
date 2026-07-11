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
  'Овощи': '🥦', 'Фрукты': '🍎', 'Ягоды': '🫐', 'Каши': '🌾', 'Белок': '🥩', 'Молочное': '🥛', 'Напитки и добавки': '🥤',
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

  // Единый плоский список по алфавиту — по поиску или по выбранному фильтру.
  const listed = useMemo(() => {
    if (query) return FOODS.filter((f) => f.n.toLowerCase().includes(query)).sort(byName);
    if (filter === 'all') return [...FOODS].sort(byName);
    if (filter === 'allergens') return FOODS.filter((f) => f.allergen).sort(byName);
    return FOODS.filter((f) => f.cat === filter).sort(byName);
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

      {!query && filter !== 'all' && (
        <div className="cat-head">
          <span className="cat-emoji">{filter === 'allergens' ? '⚠️' : CAT_EMOJI[filter]}</span>
          {filter === 'allergens' ? 'Аллергены' : filter}
          <span className="cat-count">{listed.length}</span>
        </div>
      )}
      {!query && filter === 'allergens' && (
        <div className="note" style={{ marginBottom: 12 }}><span className="ne">🗓</span><span>Вводить до года по правилу 3 дней: утром, малой дозой, 3 дня подряд. Собраны из всех групп.</span></div>
      )}

      <div className="food-grid">{listed.map(renderCard)}</div>

      {listed.length === 0 && <div className="sub" style={{ textAlign: 'center', padding: 20 }}>Ничего не нашли — попробуйте другой запрос.</div>}

      {open && <ProductSheet food={open} onClose={() => setOpen(null)} />}
    </>
  );
}
