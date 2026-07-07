import { useMemo, useState } from 'react';
import { AGE_LABEL, AGE_STEPS, FOODS } from '../data/foods';
import { ProductSheet } from '../components/ProductSheet';
import { useStore } from '../state/store';
import type { Food } from '../types';
import './Catalog.css';

const isDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

export function Catalog() {
  const [q, setQ] = useState('');
  const [ageFilter, setAgeFilter] = useState<number | null>(null);
  const [open, setOpen] = useState<Food | null>(null);
  const { introduced, ageMonths } = useStore();

  const filtered = useMemo(() => {
    const query = q.toLowerCase().trim();
    return FOODS.filter((f) => (!query || f.n.toLowerCase().includes(query)) && (ageFilter == null || f.fromMonth === ageFilter));
  }, [q, ageFilter]);

  // Группировка по месяцу введения — «информация по месяцам»
  const groups = useMemo(() => {
    const map = new Map<number, Food[]>();
    for (const f of filtered) {
      if (!map.has(f.fromMonth)) map.set(f.fromMonth, []);
      map.get(f.fromMonth)!.push(f);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [filtered]);

  return (
    <>
      <input className="search" placeholder="Найти продукт: банан, яйцо, брокколи…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="segs">
        <button className={`chip ${ageFilter == null ? 'on' : ''}`} onClick={() => setAgeFilter(null)}>Все возрасты</button>
        {AGE_STEPS.map((m) => (
          <button key={m} className={`chip ${ageFilter === m ? 'on' : ''}`} onClick={() => setAgeFilter(m)}>{AGE_LABEL[m]}</button>
        ))}
      </div>

      {groups.map(([month, foods]) => (
        <div key={month}>
          <div className="cat-month">{AGE_LABEL[month]}</div>
          <div className="food-grid">
            {foods.map((f) => {
              const bg = isDark() ? f.dbg : f.bg;
              const done = introduced.has(f.id);
              return (
                <button key={f.id} className="food" onClick={() => setOpen(f)}>
                  <div className="food-pic" style={{ background: `radial-gradient(circle at 32% 28%, ${bg[0]}, ${bg[1]})` }}>
                    {f.e}
                    {done && <span className="food-done">✓</span>}
                  </div>
                  <div className="food-meta">
                    <div className="food-name">
                      {f.n}
                      {f.iron && <span className="food-iron">железо</span>}
                      {f.allergen && f.allergen !== 'глютен' && <span className="food-al">аллерген</span>}
                    </div>
                    <div className="food-age">
                      {ageMonths != null && f.fromMonth > ageMonths
                        ? <span className="food-soon">рано · с {f.fromMonth} мес</span>
                        : f.cat.toLowerCase()}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && <div className="sub" style={{ textAlign: 'center', padding: 20 }}>Ничего не нашли — попробуйте другой запрос.</div>}

      {open && <ProductSheet food={open} onClose={() => setOpen(null)} />}
    </>
  );
}
