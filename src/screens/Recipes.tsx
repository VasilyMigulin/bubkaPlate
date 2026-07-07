import { useMemo, useState } from 'react';
import { PANTRY, RECIPES, type Recipe } from '../data/recipes';
import { useStore } from '../state/store';
import './Recipes.css';

export function Recipes() {
  const [sel, setSel] = useState<Set<string>>(new Set(['банан', 'овсянка', 'яйцо']));
  const [open, setOpen] = useState<Recipe | null>(null);
  const { showToast } = useStore();

  const toggle = (p: string) => setSel((s) => {
    const n = new Set(s);
    n.has(p) ? n.delete(p) : n.add(p);
    return n;
  });

  const list = useMemo(() =>
    RECIPES.map((r) => ({ r, hit: r.ing.filter((i) => sel.has(i)).length }))
      .filter((x) => sel.size === 0 || x.hit > 0)
      .sort((a, b) => b.hit / b.r.ing.length - a.hit / a.r.ing.length)
      .map((x) => x.r), [sel]);

  return (
    <>
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
        <div className="sheet-scrim" onClick={() => setOpen(null)}>
          <div className="recipe-sheet" onClick={(e) => e.stopPropagation()}>
            <button className="ps-back" onClick={() => setOpen(null)} aria-label="Назад">‹</button>
            <div className="recipe-hero" style={{ background: open.bg }}>{open.e}</div>
            <div className="recipe-body">
              <h2>{open.n}</h2>
              <div className="rm" style={{ marginTop: 8 }}><span className="tag green">{open.age} мес</span><span className="tag">{open.time}</span></div>
              <div className="section-t">Шаги</div>
              {open.steps.map((s, i) => (
                <div key={i} className="step"><div className="step-n">{i + 1}</div><div className="step-t">{s}</div></div>
              ))}
              <div className="note" style={{ marginTop: 10 }}><span className="ne">💡</span><span>{open.note}</span></div>
              <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => { setOpen(null); showToast('🥣', 'Приготовили!', 'Записано в дневник прикорма'); }}>Приготовили ✓</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
