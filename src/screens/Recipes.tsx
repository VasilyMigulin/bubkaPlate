import { useMemo, useState } from 'react';
import { PANTRY, RECIPES, type Recipe } from '../data/recipes';
import { RecipeSheet } from '../components/RecipeSheet';
import { useStore } from '../state/store';
import './Recipes.css';

const AGES = ['6+', '9+', '12+'] as const;
const KINDS: { key: string; label: string }[] = [
  { key: 'завтрак', label: '🍳 Завтраки' }, { key: 'каша', label: '🥣 Каши' }, { key: 'суп', label: '🍲 Супы' },
  { key: 'мясо', label: '🍖 Мясо и рыба' }, { key: 'овощ', label: '🥦 Овощи и закуски' },
  { key: 'выпечка', label: '🧁 Выпечка' }, { key: 'десерт', label: '🍨 Десерты' }, { key: 'заготовки', label: '🧊 Заготовки' },
];
const ALLERGENS = ['молоко', 'яйцо', 'глютен', 'рыба', 'морепродукты', 'арахис', 'орехи', 'соя', 'кунжут'];
const NOAL_KEY = 'bubka-plate-noallergens';

export function Recipes() {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [pantryOpen, setPantryOpen] = useState(false);
  const [ageF, setAgeF] = useState<string>('all');
  const [kindF, setKindF] = useState<string>('all');
  const [alOpen, setAlOpen] = useState(false);
  const [noAl, setNoAl] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(NOAL_KEY) || '[]') as string[]); } catch { return new Set(); }
  });
  const toggleAl = (a: string) => setNoAl((prev) => {
    const n = new Set(prev);
    n.has(a) ? n.delete(a) : n.add(a);
    localStorage.setItem(NOAL_KEY, JSON.stringify([...n]));
    return n;
  });
  const [open, setOpen] = useState<Recipe | null>(null);
  const { showToast } = useStore();

  const toggle = (p: string) => setSel((s) => {
    const n = new Set(s);
    n.has(p) ? n.delete(p) : n.add(p);
    return n;
  });

  const list = useMemo(() =>
    RECIPES.filter((r) => ageF === 'all' || r.age === ageF)
      .filter((r) => kindF === 'all' || r.kind === kindF)
      .filter((r) => noAl.size === 0 || !r.allergens.some((a) => noAl.has(a)))
      .map((r) => ({ r, hit: r.ing.filter((i) => sel.has(i)).length }))
      .filter((x) => sel.size === 0 || x.hit > 0)
      .sort((a, b) => b.hit / b.r.ing.length - a.hit / a.r.ing.length)
      .map((x) => x.r), [sel, ageF, kindF, noAl]);

  return (
    <>
      <div className="segs" style={{ marginBottom: 10 }}>
        <button className={`chip ${ageF === 'all' ? 'on' : ''}`} onClick={() => setAgeF('all')}>Все</button>
        {AGES.map((a) => (
          <button key={a} className={`chip ${ageF === a ? 'on' : ''}`} onClick={() => setAgeF(ageF === a ? 'all' : a)}>{a} мес</button>
        ))}
      </div>
      <div className="segs" style={{ marginBottom: 10 }}>
        <button className={`chip chip-mini ${kindF === 'all' ? 'on' : ''}`} onClick={() => setKindF('all')}>Все</button>
        {KINDS.map((k) => (
          <button key={k.key} className={`chip chip-mini ${kindF === k.key ? 'on' : ''}`} onClick={() => setKindF(kindF === k.key ? 'all' : k.key)}>{k.label}</button>
        ))}
      </div>

      <button className={`al-toggle ${noAl.size > 0 ? 'active' : ''}`} onClick={() => setAlOpen(!alOpen)}>
        ⚠️ Аллергия? Скроем рецепты {noAl.size > 0 ? `· скрыто: ${[...noAl].join(', ')}` : ''} {alOpen ? '↑' : '↓'}
      </button>
      {alOpen && (
        <div className="segs" style={{ marginBottom: 10 }}>
          {ALLERGENS.map((a) => (
            <button key={a} className={`chip chip-mini ${noAl.has(a) ? 'on warn' : ''}`} onClick={() => toggleAl(a)}>{noAl.has(a) ? '✕ ' : ''}{a}</button>
          ))}
        </div>
      )}

      <div className="eyebrow" style={{ marginBottom: 8 }}>Что есть дома? Отметьте — подберём</div>
      <div className={`pantry ${pantryOpen ? 'open' : ''}`}>
        {(pantryOpen ? PANTRY : PANTRY.slice(0, 8)).map((p) => (
          <button key={p} className={`chip ${sel.has(p) ? 'on' : ''}`} onClick={() => toggle(p)}>{p}</button>
        ))}
        {!pantryOpen && [...sel].filter((p) => !PANTRY.slice(0, 8).includes(p)).map((p) => (
          <button key={p} className="chip on" onClick={() => toggle(p)}>{p}</button>
        ))}
        <button className="chip chip-more" onClick={() => setPantryOpen(!pantryOpen)}>
          {pantryOpen ? 'свернуть ↑' : `ещё ${PANTRY.length - 8} ↓`}
        </button>
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
