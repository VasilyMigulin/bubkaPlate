import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CATEGORIES, FOODS, IRON_IDS } from '../data/foods';
import { ProductSheet } from './ProductSheet';
import { useStore } from '../state/store';
import type { Food } from '../types';

/** Быстрая запись пробы: поиск/подсказки → карточка продукта (запись делается из неё). */
export function LogPicker({ onClose }: { onClose: () => void }) {
  const { introduced, log, ageMonths } = useStore();
  const [q, setQ] = useState('');
  const [food, setFood] = useState<Food | null>(null);

  const age = Math.max(ageMonths ?? 6, 6);

  // Подсказки: сначала железо, потом всё age-подходящее ещё не введённое
  const suggestions = useMemo(() => {
    const fits = (f: Food) => !introduced.has(f.id) && f.fromMonth <= age;
    const iron = FOODS.filter((f) => fits(f) && IRON_IDS.includes(f.id));
    const rest = FOODS.filter((f) => fits(f) && !IRON_IDS.includes(f.id));
    return [...iron.slice(0, 3), ...rest].slice(0, 6);
  }, [introduced, age]);

  const recent = useMemo(() => {
    const seen = new Set<string>();
    const out: Food[] = [];
    for (const l of log) {
      const id = l.id.split(':')[0];
      if (seen.has(id)) continue;
      seen.add(id);
      const f = FOODS.find((x) => x.id === id);
      if (f) out.push(f);
      if (out.length >= 6) break;
    }
    return out;
  }, [log]);

  const query = q.toLowerCase().trim();
  const results = query ? FOODS.filter((f) => f.n.toLowerCase().includes(query)) : [];

  const Row = ({ f }: { f: Food }) => (
    <button className="lp-row" onClick={() => setFood(f)}>
      <span className="lp-e">{f.e}</span>
      <span className="grow">{f.n}</span>
      {introduced.has(f.id)
        ? <span className="lp-in">✓ введён</span>
        : <span className="lp-age">с {f.fromMonth} мес</span>}
    </button>
  );

  return createPortal(
    <>
    <div className="sheet-scrim" onClick={onClose}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <div className="bs-title">🥄 Что попробовали?</div>
        <input
          className="em-input lp-search" placeholder="Найти продукт: кабачок, яйцо…"
          value={q} onChange={(e) => setQ(e.target.value)}
        />

        {query ? (
          <>
            {results.length === 0 && <div className="sub" style={{ padding: '10px 2px' }}>Не нашли. Попробуйте короче: «капу», «ябл»…</div>}
            {results.map((f) => <Row key={f.id} f={f} />)}
          </>
        ) : (
          <>
            {suggestions.length > 0 && (
              <>
                <div className="bs-label">Идеи на сегодня — ещё не пробовали</div>
                {suggestions.map((f) => <Row key={f.id} f={f} />)}
              </>
            )}
            {recent.length > 0 && (
              <>
                <div className="bs-label">Недавние — отметить повтор</div>
                {recent.map((f) => <Row key={f.id} f={f} />)}
              </>
            )}
            <div className="bs-label">Все продукты</div>
            {CATEGORIES.map((cat) => {
              const items = FOODS.filter((f) => f.cat === cat);
              return (
                <details key={cat} className="lp-group">
                  <summary>{cat} <span className="lp-cnt">{items.filter((f) => introduced.has(f.id)).length}/{items.length}</span></summary>
                  {items.map((f) => <Row key={f.id} f={f} />)}
                </details>
              );
            })}
          </>
        )}

        <style>{`
          .lp-search { width:100%; margin-bottom:10px; }
          .lp-row { display:flex; align-items:center; gap:10px; width:100%; text-align:left; border:none; font-family:inherit;
            background:var(--card); border-radius:12px; padding:11px 12px; margin-bottom:6px; font-size:13.5px; font-weight:650;
            color:var(--text); box-shadow:var(--shadow); cursor:pointer; }
          .lp-e { font-size:19px; }
          .lp-in { font-size:11px; font-weight:800; color:var(--accent); }
          .lp-age { font-size:11px; font-weight:700; color:var(--text2); }
          .lp-group { margin-bottom:6px; }
          .lp-group summary { font-size:13px; font-weight:750; padding:9px 2px; cursor:pointer; list-style:none; }
          .lp-group summary::-webkit-details-marker { display:none; }
          .lp-cnt { font-size:11px; font-weight:700; color:var(--text2); margin-left:6px; }
        `}</style>
      </div>
    </div>
    {food && <ProductSheet food={food} openLog onClose={() => setFood(null)} />}
    </>,
    document.body,
  );
}
