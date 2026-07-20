import { useMemo, useState } from 'react';
import { PANTRY, RECIPES, type Recipe } from '../data/recipes';
import { RecipeSheet } from '../components/RecipeSheet';
import { useStore } from '../state/store';
import './Recipes.css';

const AGES = ['6+', '9+', '12+'] as const;

export function Recipes() {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [ageF, setAgeF] = useState<string>('all');
  const [open, setOpen] = useState<Recipe | null>(null);
  const { showToast } = useStore();

  const toggle = (p: string) => setSel((s) => {
    const n = new Set(s);
    n.has(p) ? n.delete(p) : n.add(p);
    return n;
  });

  const list = useMemo(() =>
    RECIPES.filter((r) => ageF === 'all' || r.age === ageF)
      .map((r) => ({ r, hit: r.ing.filter((i) => sel.has(i)).length }))
      .filter((x) => sel.size === 0 || x.hit > 0)
      .sort((a, b) => b.hit / b.r.ing.length - a.hit / a.r.ing.length)
      .map((x) => x.r), [sel, ageF]);

  return (
    <>
      <div className="segs" style={{ marginBottom: 10 }}>
        <button className={`chip ${ageF === 'all' ? 'on' : ''}`} onClick={() => setAgeF('all')}>Все</button>
        {AGES.map((a) => (
          <button key={a} className={`chip ${ageF === a ? 'on' : ''}`} onClick={() => setAgeF(ageF === a ? 'all' : a)}>{a} мес</button>
        ))}
      </div>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Что есть дома? Отметьте — подберём</div>
      <div className="pantry">
        {PANTRY.map((p) => (
          <button key={p} className={`chip ${sel.has(p) ? 'on' : ''}`} onClick={() => toggle(p)}>{p}</button>
        ))}
      </div>

      {list.map((r) => (
        <button key={r.n} className="recipe" onClick={() => setOpen(r)}>
          <div className="rp" style={{ background: r.bg }}>{r.e}</div>
          <div className="grow">
            <div className="rn">{r.n}</div>
            <div className="rm">
              <span className="tag green">{r.age} мес</span><span className="tag">{r.time}</span>
              {r.ing.map((i) => <span key={i} className={`tag ${sel.has(i) ? 'green' : ''}`}>{sel.has(i) ? '✓ ' : ''}{i}</span>)}
            </div>
          </div>
        </button>
      ))}
      {list.length === 0 && <div className="sub" style={{ textAlign: 'center', padding: 10 }}>Отметьте, что есть дома — подберём рецепты.</div>}

      <div className="card" style={{ background: 'var(--accent-soft)', cursor: 'pointer', marginTop: 4 }} onClick={() => showToast('✨', 'bubka+', '150+ рецептов с фильтрами — скоро')}>
        <div className="row">
          <div className="next-e">✨</div>
          <div className="grow"><div className="h-card" style={{ margin: 0 }}>Ещё 150+ рецептов в bubka+</div><div className="sub">С фильтрами по аллергенам и списком покупок</div></div>
          <span style={{ color: 'var(--text2)' }}>›</span>
        </div>
      </div>

      {open && (
        <RecipeSheet recipe={open} onClose={() => setOpen(null)} />
      )}
    </>
  );
}
