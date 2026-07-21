import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FOODS, findFoodByIng } from '../data/foods';
import { PANTRY, RECIPES, type Recipe } from '../data/recipes';
import { RecipeSheet } from '../components/RecipeSheet';
import { PlanSheet } from '../components/PlanSheet';
import { DAYPLANS, type DayPlan } from '../data/plans';
import { ShopSheet } from '../components/ShopSheet';
import { Paywall, isPremium } from '../components/Paywall';
import { useStore } from '../state/store';
import './Recipes.css';

const AGES = ['6+', '9+', '12+'] as const;
const KINDS: { key: string; label: string }[] = [
  { key: 'завтрак', label: '🍳 Завтраки' }, { key: 'каша', label: '🥣 Каши' }, { key: 'суп', label: '🍲 Супы' },
  { key: 'мясо', label: '🍖 Мясо и рыба' }, { key: 'овощ', label: '🥦 Овощи и закуски' },
  { key: 'выпечка', label: '🧁 Выпечка' }, { key: 'десерт', label: '🍨 Десерты' }, { key: 'заготовки', label: '🧊 Заготовки' },
];
const EXC_KEY = 'bubka-plate-exclusions';
// служебные карточки, которые бессмысленно «исключать» из рецептов
const NOT_EXCLUDABLE = new Set(['water', 'juice', 'compote', 'spices', 'oil', 'honey', 'canned']);
const SHOP_KEY = 'bubka-plate-shoplist';
const FAV_KEY = 'bubka-plate-favs';

export function Recipes() {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [pantryOpen, setPantryOpen] = useState(false);
  const [ageF, setAgeF] = useState<string>('all');
  const [kindF, setKindF] = useState<string>('all');
  const [filtOpen, setFiltOpen] = useState(false);
  const [excOpen, setExcOpen] = useState(false);
  const [excQ, setExcQ] = useState('');
  const [exc, setExc] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(EXC_KEY) || '[]') as string[]); } catch { return new Set(); }
  });
  const toggleExc = (name: string) => setExc((prev) => {
    const n = new Set(prev);
    n.has(name) ? n.delete(name) : n.add(name);
    localStorage.setItem(EXC_KEY, JSON.stringify([...n]));
    return n;
  });
  // аллергены исключённых продуктов: исключили «молоко (коровье)» → прячем и всё с аллергеном «молоко»
  const excAllergens = useMemo(() => {
    const set = new Set<string>();
    exc.forEach((n) => { const f = findFoodByIng(n); if (f?.allergen) set.add(f.allergen); });
    return set;
  }, [exc]);
  const isExcluded = (r: Recipe) =>
    [...exc].some((x) => r.ing.some((i) => i.includes(x) || x.includes(i))) ||
    r.allergens.some((a) => excAllergens.has(a));

  const [shopOpen, setShopOpen] = useState(false);
  const openShop = () => setShopOpen(true);
  const [planOpen, setPlanOpen] = useState<DayPlan | null | 'custom'>(undefined as unknown as null);
  const [planShown, setPlanShown] = useState(false);
  const [fav, setFav] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]') as string[]); } catch { return new Set(); }
  });
  const [favF, setFavF] = useState(false);
  const toggleFav = (n: string) => setFav((prev) => {
    const s2 = new Set(prev);
    s2.has(n) ? s2.delete(n) : s2.add(n);
    localStorage.setItem(FAV_KEY, JSON.stringify([...s2]));
    return s2;
  });
  const [open, setOpen] = useState<Recipe | null>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [prem, setPrem] = useState(isPremium());
  const FREE_COUNT = 30;
  const isLocked = (r: Recipe) => !prem && RECIPES.indexOf(r) >= FREE_COUNT;
  const { ageMonths } = useStore();
  // возраст малыша → его возрастная корзина планов
  const myAge = ageMonths == null ? null : ageMonths >= 12 ? '12+' : ageMonths >= 9 ? '9+' : '6+';
  const plansSorted = useMemo(() =>
    [...DAYPLANS].sort((a, b) => (a.age === myAge ? -1 : 0) - (b.age === myAge ? -1 : 0)), [myAge]);

  const toggle = (p: string) => setSel((s) => {
    const n = new Set(s);
    n.has(p) ? n.delete(p) : n.add(p);
    return n;
  });

  const list = useMemo(() =>
    RECIPES.filter((r) => ageF === 'all' || r.age === ageF)
      .filter((r) => kindF === 'all' || r.kind === kindF)
      .filter((r) => exc.size === 0 || !isExcluded(r))
      .filter((r) => !favF || fav.has(r.n))
      .map((r) => ({ r, hit: r.ing.filter((i) => sel.has(i)).length }))
      .filter((x) => sel.size === 0 || x.hit > 0)
      .sort((a, b) => b.hit / b.r.ing.length - a.hit / a.r.ing.length)
      .map((x) => x.r), [sel, ageF, kindF, exc, excAllergens, favF, fav]);

  const activeFilters = (ageF !== 'all' ? 1 : 0) + (kindF !== 'all' ? 1 : 0) + (sel.size > 0 ? 1 : 0) + (exc.size > 0 ? 1 : 0) + (favF ? 1 : 0);

  // пагинация: рендерим порциями, чтобы список не грузился «портянкой»
  const [shown, setShown] = useState(20);
  useEffect(() => { setShown(20); }, [ageF, kindF, sel, exc]);

  const resetFilters = () => {
    setAgeF('all'); setKindF('all'); setSel(new Set());
  };

  return (
    <>
      <div className="plans-row">
        {plansSorted.map((pl) => (
          <button key={pl.id} className="plan-card" onClick={() => { setPlanOpen(pl); setPlanShown(true); }}>
            <span className="plan-e">{pl.e}</span>
            <span className="plan-t">{pl.t}</span>
            <span className="plan-a">{pl.age === myAge ? '⭐ ваш возраст' : `${pl.age} мес`} · 4 блюда</span>
          </button>
        ))}
        <button className="plan-card custom" onClick={() => { setPlanOpen(null); setPlanShown(true); }}>
          <span className="plan-e">✨</span>
          <span className="plan-t">Мой план</span>
          <span className="plan-a">соберите сами</span>
        </button>
      </div>

      <div className="exc-row">
        <button className={`exc-btn ${activeFilters > 0 ? 'active-f' : ''}`} onClick={() => setFiltOpen(true)}>
          ⚙️ Фильтры{activeFilters > 0 ? ` · ${activeFilters}` : ''}
        </button>
        <button className="exc-btn shop" onClick={openShop}>
          🛒{(() => { try { const n = (JSON.parse(localStorage.getItem(SHOP_KEY) || '[]') as string[]).length; return n > 0 ? <span className="shop-badge">{n}</span> : null; } catch { return null; } })()}
        </button>
      </div>
      {activeFilters > 0 && (
        <div className="filter-line">
          {ageF !== 'all' && <span className="tag green">{ageF} мес</span>}
          {kindF !== 'all' && <span className="tag">{KINDS.find((k) => k.key === kindF)?.label}</span>}
          {[...sel].map((p) => <span key={p} className="tag green">✓ {p}</span>)}
          {favF && <span className="tag green">♥ избранное</span>}
          {exc.size > 0 && <span className="tag warn-tag">🚫 {[...exc].join(', ')}</span>}
          <button className="term-link" onClick={() => { resetFilters(); }}>сбросить</button>
        </div>
      )}

      {list.slice(0, shown).map((r) => (
        <button key={r.n} className="recipe" onClick={() => (isLocked(r) ? setPwOpen(true) : setOpen(r))}>
          <span className={`fav-b ${fav.has(r.n) ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); toggleFav(r.n); }}>{fav.has(r.n) ? '♥' : '♡'}</span>
          <div className="rp" style={{ background: r.bg }}>{isLocked(r) ? '✨' : r.e}</div>
          <div className="grow">
            <div className="rn">{r.n}</div>
            <div className="rm">
              {isLocked(r) && <span className="tag" style={{ color: 'var(--terra)' }}>bubka+</span>}
              <span className="tag green">{r.age} мес</span><span className="tag">{r.time}</span>
              {r.ing.map((i) => <span key={i} className={`tag ${sel.has(i) ? 'green' : ''}`}>{sel.has(i) ? '✓ ' : ''}{i}</span>)}
            </div>
          </div>
        </button>
      ))}
      {list.length > shown && (
        <button className="btn btn-soft" style={{ marginTop: 4 }} onClick={() => setShown(shown + 20)}>
          Показать ещё
        </button>
      )}

      {list.length === 0 && <div className="sub" style={{ textAlign: 'center', padding: 10 }}>Ничего не нашлось — ослабьте фильтры.</div>}

      {!prem && (
      <div className="card" style={{ background: 'var(--accent-soft)', cursor: 'pointer', marginTop: 4 }} onClick={() => setPwOpen(true)}>
        <div className="row">
          <div className="next-e">✨</div>
          <div className="grow"><div className="h-card" style={{ margin: 0 }}>Ещё 190+ рецептов в bubka+</div><div className="sub">Планы дня, конструктор меню и новые рецепты каждую неделю</div></div>
          <span style={{ color: 'var(--text2)' }}>›</span>
        </div>
      </div>
      )}

      <Paywall open={pwOpen} onClose={() => setPwOpen(false)} onSuccess={() => setPrem(true)} />

      {open && (
        <RecipeSheet recipe={open} onClose={() => setOpen(null)} />
      )}

      {filtOpen && createPortal(
        <div className="sheet-scrim" onClick={() => setFiltOpen(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="grab" />
            <div className="bs-title">Фильтры</div>

            <div className="bs-label">Возраст</div>
            <div className="exc-grid">
              <button className={`chip ${ageF === 'all' ? 'on' : ''}`} onClick={() => setAgeF('all')}>Все</button>
              {AGES.map((a) => (
                <button key={a} className={`chip ${ageF === a ? 'on' : ''}`} onClick={() => setAgeF(ageF === a ? 'all' : a)}>{a} мес</button>
              ))}
            </div>

            <div className="bs-label">Избранное</div>
            <div className="exc-grid">
              <button className={`chip ${favF ? 'on' : ''}`} onClick={() => setFavF(!favF)}>{favF ? '✕ ' : ''}♥ Только избранные</button>
            </div>

            <div className="bs-label">Тип блюда</div>
            <div className="exc-grid">
              {KINDS.map((k) => (
                <button key={k.key} className={`chip ${kindF === k.key ? 'on' : ''}`} onClick={() => setKindF(kindF === k.key ? 'all' : k.key)}>{k.label}</button>
              ))}
            </div>

            <div className="bs-label">Что есть дома — подберём рецепты</div>
            <div className="exc-grid">
              {(pantryOpen ? PANTRY : PANTRY.slice(0, 10)).map((p) => (
                <button key={p} className={`chip ${sel.has(p) ? 'on' : ''}`} onClick={() => toggle(p)}>{p}</button>
              ))}
              {!pantryOpen && [...sel].filter((p) => !PANTRY.slice(0, 10).includes(p)).map((p) => (
                <button key={p} className="chip on" onClick={() => toggle(p)}>{p}</button>
              ))}
              <button className="chip chip-more" onClick={() => setPantryOpen(!pantryOpen)}>
                {pantryOpen ? 'свернуть ↑' : `ещё ${PANTRY.length - 10} ↓`}
              </button>
            </div>

            <div className="bs-label">Исключения</div>
            <button className={`exc-btn ${exc.size > 0 ? 'active' : ''}`} style={{ width: '100%' }} onClick={() => { setExcQ(''); setExcOpen(true); }}>
              🚫 {exc.size > 0 ? <>Исключено: <b>{[...exc].join(', ')}</b></> : 'Исключить продукты — аллергия или не любит'}
            </button>

            <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => setFiltOpen(false)}>
              Показать рецепты{activeFilters > 0 ? ` · фильтров: ${activeFilters}` : ''}
            </button>
            {activeFilters > 0 && <button className="btn btn-soft" style={{ marginTop: 8 }} onClick={resetFilters}>Сбросить всё</button>}
          </div>
        </div>,
        document.body,
      )}

      {excOpen && createPortal(
        <div className="sheet-scrim" onClick={() => setExcOpen(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="grab" />
            <div className="bs-title">Не показывать рецепты с:</div>
            <div className="sub" style={{ marginBottom: 10 }}>Аллергия, «пока не вводим», не любит, не едите по убеждениям — любая причина.</div>
            <input className="search" placeholder="Найти продукт…" value={excQ} onChange={(e) => setExcQ(e.target.value)} />
            <div className="exc-grid">
              {[...FOODS].filter((f) => !NOT_EXCLUDABLE.has(f.id)).sort((a, b) => (exc.has(a.n.toLowerCase()) === exc.has(b.n.toLowerCase()) ? a.n.localeCompare(b.n, 'ru') : exc.has(a.n.toLowerCase()) ? -1 : 1))
                .filter((f) => !excQ || f.n.toLowerCase().includes(excQ.toLowerCase()))
                .map((f) => {
                  const key = f.n.toLowerCase();
                  return (
                    <button key={f.id} className={`chip ${exc.has(key) ? 'on warn' : ''}`} onClick={() => toggleExc(key)}>
                      {exc.has(key) ? '✕ ' : ''}{f.e} {f.n}
                    </button>
                  );
                })}
            </div>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setExcOpen(false)}>Готово{exc.size > 0 ? ` · скрыто из ${exc.size}` : ''}</button>
          </div>
        </div>,
        document.body,
      )}

      <ShopSheet open={shopOpen} onClose={() => setShopOpen(false)} />
      {planShown && (
        <PlanSheet
          plan={planOpen === 'custom' ? null : (planOpen as DayPlan | null)}
          onClose={() => setPlanShown(false)}
          onOpenRecipe={(r) => setOpen(r)}
        />
      )}
    </>
  );
}
