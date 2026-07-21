import { useState } from 'react';
import { createPortal } from 'react-dom';
import { RECIPES, type Recipe } from '../data/recipes';
import { SLOTS, type DayPlan } from '../data/plans';
import { useStore } from '../state/store';

const MYPLAN_KEY = 'bubka-plate-myplan';
const SHOP_KEY = 'bubka-plate-shoplist';

// какие типы блюд предлагать в каждом слоте конструктора
const SLOT_KINDS: Record<string, string[]> = {
  'Завтрак': ['каша', 'выпечка', 'завтрак'],
  'Обед': ['суп', 'мясо'],
  'Полдник': ['десерт', 'выпечка', 'овощ'],
  'Ужин': ['мясо', 'овощ', 'каша'],
};

function readMyPlan(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(MYPLAN_KEY) || '{}') as Record<string, string>; } catch { return {}; }
}

/** Просмотр готового плана дня или конструктор своего (plan === null). */
export function PlanSheet({ plan, onClose, onOpenRecipe }: {
  plan: DayPlan | null;
  onClose: () => void;
  onOpenRecipe: (r: Recipe) => void;
}) {
  const { showToast } = useStore();
  const isCustom = plan === null;
  const [my, setMy] = useState<Record<string, string>>(readMyPlan);
  const [pickSlot, setPickSlot] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const slotRecipe = (slot: string): Recipe | undefined => {
    const name = isCustom
      ? my[slot]
      : (overrides[slot] ?? plan!.meals.find((m) => m.slot === slot)?.recipe);
    return name ? RECIPES.find((r) => r.n === name) : undefined;
  };

  const pick = (slot: string, name: string) => {
    if (isCustom) {
      const n = { ...my, [slot]: name };
      setMy(n);
      localStorage.setItem(MYPLAN_KEY, JSON.stringify(n));
    } else {
      setOverrides((o) => ({ ...o, [slot]: name }));
    }
    setPickSlot(null);
  };

  // сохранить готовый план (с заменами) как «мой»
  const saveAsMine = () => {
    const n: Record<string, string> = {};
    SLOTS.forEach((sl) => { const r = slotRecipe(sl); if (r) n[sl] = r.n; });
    setMy(n);
    localStorage.setItem(MYPLAN_KEY, JSON.stringify(n));
    showToast('✨', 'Сохранено в «Мой план»', 'Полка планов → ✨ Мой план');
  };

  const allToShop = () => {
    const items: string[] = [];
    SLOTS.forEach((s) => { const r = slotRecipe(s); if (r?.items) items.push(...r.items); });
    if (items.length === 0) { showToast('🤔', 'План пока пустой'); return; }
    try {
      const cur = JSON.parse(localStorage.getItem(SHOP_KEY) || '[]') as string[];
      const added = [...new Set(items)].filter((it) => !cur.includes(it));
      localStorage.setItem(SHOP_KEY, JSON.stringify([...cur, ...added]));
      showToast('🛒', `+${added.length} в список покупок`, 'Все ингредиенты плана — в списке');
    } catch { /* ignore */ }
  };

  return createPortal(
    <div className="sheet-scrim" onClick={onClose}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <div className="bs-title">{isCustom ? '✨ Мой план дня' : `${plan!.e} ${plan!.t}`}</div>
        <div className="sub" style={{ marginBottom: 12 }}>
          {isCustom ? 'Соберите день из любимых рецептов — план сохранится.' : `Готовое меню на день · ${plan!.age} мес`}
        </div>

        {SLOTS.map((slot) => {
          const r = slotRecipe(slot);
          return (
            <div key={slot} className="plan-slot">
              <div className="plan-slot-name">{slot}</div>
              {r ? (
                <button className="plan-meal" onClick={() => onOpenRecipe(r)}>
                  <span className="plan-meal-e">{r.e}</span>
                  <span className="grow">{r.n}</span>
                  <span className="tag green">{r.age}</span>
                </button>
              ) : (
                <button className="plan-meal empty" onClick={() => setPickSlot(slot)}>+ выбрать блюдо</button>
              )}
              {r && (
                <button className="plan-swap" onClick={() => setPickSlot(slot)}>заменить</button>
              )}
            </div>
          );
        })}

        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={allToShop}>🛒 Все ингредиенты — в список покупок</button>
        {!isCustom && Object.keys(overrides).length > 0 && (
          <button className="btn btn-soft" style={{ marginTop: 8 }} onClick={saveAsMine}>✨ Сохранить как «Мой план»</button>
        )}
        <button className="btn btn-soft" style={{ marginTop: 8 }} onClick={onClose}>Закрыть</button>

        {pickSlot && (
          <div className="plan-picker">
            <div className="bs-label">{pickSlot}: выберите блюдо</div>
            <div className="plan-pick-list">
              {RECIPES.filter((r) => SLOT_KINDS[pickSlot].includes(r.kind)).map((r) => (
                <button key={r.n} className="plan-meal" onClick={() => pick(pickSlot, r.n)}>
                  <span className="plan-meal-e">{r.e}</span>
                  <span className="grow">{r.n}</span>
                  <span className="tag green">{r.age}</span>
                </button>
              ))}
            </div>
            <button className="btn btn-soft" style={{ marginTop: 8 }} onClick={() => setPickSlot(null)}>Отмена</button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
