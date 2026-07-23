import { useState } from 'react';
import { createPortal } from 'react-dom';
import { RECIPES, type Recipe } from '../data/recipes';
import type { WeekPlan } from '../data/weekplans';
import { RecipeSheet } from './RecipeSheet';
import { Paywall, isPremium } from './Paywall';
import { useStore } from '../state/store';

const SHOP_KEY = 'bubka-plate-shoplist';

/** Недельный план: понедельник открыт всем, остальные дни — bubka+. */
export function WeekPlanSheet({ plan, onClose }: { plan: WeekPlan; onClose: () => void }) {
  const { showToast } = useStore();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [prem, setPrem] = useState(isPremium());
  const [pwOpen, setPwOpen] = useState(false);
  const [openDay, setOpenDay] = useState<string>(plan.days[0].day);

  const byName = (n: string) => RECIPES.find((r) => r.n === n);

  const weekToShop = () => {
    if (!prem) { setPwOpen(true); return; }
    const items: string[] = [];
    plan.days.forEach((d) => d.meals.forEach((m) => { const r = byName(m.recipe); if (r?.items) items.push(...r.items); }));
    try {
      const cur = JSON.parse(localStorage.getItem(SHOP_KEY) || '[]') as string[];
      const added = [...new Set(items)].filter((it) => !cur.includes(it));
      localStorage.setItem(SHOP_KEY, JSON.stringify([...cur, ...added]));
      showToast('🛒', `+${added.length} в список покупок`, 'Все продукты недели — в списке');
    } catch { /* ignore */ }
  };

  return createPortal(
    <>
    <div className="article-view">
      <button className="ps-back" onClick={onClose} aria-label="Назад">‹</button>
      <div className="wp-head">
        <h2>{plan.e} {plan.t}</h2>
        <div className="sub" style={{ marginTop: 4 }}>7 дней · 28 блюд · {plan.age} мес. Меняйте блюда местами смело — план служит вам, а не наоборот.</div>
      </div>
      <div className="wp-body">
        {plan.days.map((d, di) => {
          const locked = !prem && di > 0;
          const opened = openDay === d.day && !locked;
          return (
            <div key={d.day}>
              <button className={`wp-day ${opened ? 'open' : ''} ${locked ? 'locked' : ''}`}
                onClick={() => (locked ? setPwOpen(true) : setOpenDay(opened ? '' : d.day))}>
                <b>{d.day}</b>
                <span className="wp-day-meta">{locked ? '✨ bubka+' : opened ? '−' : `${d.meals.length} блюда ›`}</span>
              </button>
              {opened && d.meals.map((m) => {
                const r = byName(m.recipe);
                return r ? (
                  <button key={m.slot} className="wp-meal" onClick={() => setRecipe(r)}>
                    <span className="wp-slot">{m.slot}</span>
                    <span className="wp-meal-e">{r.e}</span>
                    <span className="grow">{r.n}</span>
                    <span className="wp-time">{r.time}</span>
                  </button>
                ) : null;
              })}
            </div>
          );
        })}

        <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={weekToShop}>
          🛒 Продукты на всю неделю — в список{!prem ? ' · bubka+' : ''}
        </button>
      </div>

      <style>{`
        .wp-head { padding:64px 20px 4px; }
        .wp-head h2 { font-size:24px; font-weight:750; letter-spacing:-.02em; }
        .wp-body { padding:10px 18px calc(30px + env(safe-area-inset-bottom)); }
        .wp-day { display:flex; justify-content:space-between; align-items:center; width:100%; text-align:left; border:none;
          font-family:inherit; background:var(--card); border-radius:14px; padding:13px 15px; box-shadow:var(--shadow);
          margin-bottom:8px; cursor:pointer; }
        .wp-day b { font-size:14.5px; }
        .wp-day.locked b { color:var(--text2); }
        .wp-day-meta { font-size:12px; font-weight:700; color:var(--accent); }
        .wp-day.locked .wp-day-meta { color:var(--terra); }
        .wp-meal { display:flex; align-items:center; gap:9px; width:100%; text-align:left; border:none; font-family:inherit;
          background:var(--elev); border-radius:12px; padding:10px 12px; margin:0 0 6px; font-size:13px; font-weight:600;
          color:var(--text); cursor:pointer; }
        .wp-slot { flex:none; font-size:10px; font-weight:800; letter-spacing:.05em; text-transform:uppercase; color:var(--text2); width:64px; }
        .wp-meal-e { font-size:16px; }
        .wp-time { flex:none; font-size:11px; color:var(--text2); }
      `}</style>
    </div>
    {recipe && <RecipeSheet recipe={recipe} onClose={() => setRecipe(null)} />}
    <Paywall open={pwOpen} onClose={() => setPwOpen(false)} onSuccess={() => setPrem(true)} />
    </>,
    document.body,
  );
}
