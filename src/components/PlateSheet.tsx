import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FOODS } from '../data/foods';
import { CARB_IDS, type Plate } from '../data/plates';
import { MAIN_PHOTOS } from '../data/mainPhotos';
import { ProductSheet } from './ProductSheet';
import { useStore } from '../state/store';
import type { Food } from '../types';

const SHOP_KEY = 'bubka-plate-shoplist';

// подсказка нарезки по возрасту — из лестницы подачи продукта
function serveHint(f: Food, ageMonths: number | null): string {
  const keys = Object.keys(f.serve).map(Number).sort((a, b) => a - b);
  const fit = ageMonths == null ? keys[0] : (keys.filter((k) => k <= ageMonths).pop() ?? keys[0]);
  const text = f.serve[String(fit)]?.[1] ?? '';
  const first = text.split(/[.!]/)[0];
  return first.length > 72 ? first.slice(0, 70) + '…' : first;
}

/** Тарелочка: готовая (plate) или конструктор из введённого (plate === null). */
export function PlateSheet({ plate, onClose }: { plate: Plate | null; onClose: () => void }) {
  const { introduced, ageMonths, showToast } = useStore();
  const [foodOpen, setFoodOpen] = useState<Food | null>(null);
  const isBuilder = plate === null;

  // группы конструктора — только из введённых продуктов
  const groups = useMemo(() => {
    const inSet = (f: Food) => introduced.has(f.id);
    const carb = FOODS.filter((f) => CARB_IDS.includes(f.id) && inSet(f));
    const protein = FOODS.filter((f) => (f.cat === 'Белок' || f.cat === 'Молочное') && inSet(f));
    const veg = FOODS.filter((f) => f.cat === 'Овощи' && !CARB_IDS.includes(f.id) && inSet(f));
    const fruit = FOODS.filter((f) => (f.cat === 'Фрукты' || f.cat === 'Ягоды') && inSet(f));
    return { protein, veg, carb, fruit };
  }, [introduced]);

  const [seed, setSeed] = useState<Record<string, number>>({ protein: 0, veg: 0, carb: 0, fruit: 0 });
  const pickFrom = (arr: Food[], n: number) => (arr.length ? arr[n % arr.length] : undefined);

  const builderSlots: { label: string; key: keyof typeof groups; f?: Food }[] = [
    { label: 'Белок', key: 'protein', f: pickFrom(groups.protein, seed.protein) },
    { label: 'Овощ', key: 'veg', f: pickFrom(groups.veg, seed.veg) },
    { label: 'Углевод', key: 'carb', f: pickFrom(groups.carb, seed.carb) },
    { label: 'Фрукт-бонус', key: 'fruit', f: pickFrom(groups.fruit, seed.fruit) },
  ];

  const reroll = (key: string) => setSeed((s) => ({ ...s, [key]: (s[key] ?? 0) + 1 }));
  const rerollAll = () => setSeed((s) => {
    const n: Record<string, number> = {};
    Object.keys(groups).forEach((k, i) => { n[k] = (s[k] ?? 0) + 1 + i; });
    return n;
  });

  const partsToShop = () => {
    const items = isBuilder
      ? builderSlots.filter((sl) => sl.f).map((sl) => sl.f!.n)
      : plate!.parts.map((p) => FOODS.find((f) => f.id === p.pid)?.n).filter(Boolean) as string[];
    if (!items.length) return;
    try {
      const cur = JSON.parse(localStorage.getItem(SHOP_KEY) || '[]') as string[];
      const added = items.filter((it) => !cur.includes(it));
      localStorage.setItem(SHOP_KEY, JSON.stringify([...cur, ...added]));
      showToast('🛒', `+${added.length} в список покупок`);
    } catch { /* ignore */ }
  };

  const row = (f: Food, note: string, extra?: React.ReactNode) => (
    <button key={f.id + note} className="plate-part" onClick={() => setFoodOpen(f)}>
      <div className="plate-pic">
        {MAIN_PHOTOS[f.id] ? <img src={MAIN_PHOTOS[f.id]} alt={f.n} /> : <span>{f.e}</span>}
      </div>
      <div className="grow">
        <div className="plate-n">{f.n}</div>
        <div className="plate-note">{note}</div>
      </div>
      {extra}
    </button>
  );

  return createPortal(
    <div className="sheet-scrim" onClick={onClose}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <div className="bs-title">{isBuilder ? '✨ Тарелочка из введённого' : `${plate!.e} ${plate!.t}`}</div>
        <div className="sub" style={{ marginBottom: 12 }}>
          {isBuilder
            ? 'Собрали из продуктов, которые малыш уже пробовал. Не нравится компонент — крутите 🔀'
            : `Сбалансированный приём · ${plate!.age} мес · тап по компоненту — правила подачи`}
        </div>

        {isBuilder
          ? builderSlots.map((sl) => (
            <div key={sl.label} className="plate-slot">
              <div className="plan-slot-name">{sl.label}</div>
              {sl.f ? row(sl.f, serveHint(sl.f, ageMonths), (
                <span className="plate-roll" onClick={(e) => { e.stopPropagation(); reroll(sl.key); }}>🔀</span>
              )) : (
                <div className="plate-empty">Пока нет введённых продуктов этой группы — загляните в каталог</div>
              )}
            </div>
          ))
          : plate!.parts.map((p) => {
            const f = FOODS.find((x) => x.id === p.pid);
            return f ? row(f, p.note) : null;
          })}

        {isBuilder && <button className="btn btn-soft" style={{ marginTop: 6 }} onClick={rerollAll}>🔀 Перемешать всё</button>}
        <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={partsToShop}>🛒 Компоненты — в список покупок</button>
        <button className="btn btn-soft" style={{ marginTop: 8 }} onClick={onClose}>Закрыть</button>
      </div>

      {foodOpen && <ProductSheet food={foodOpen} elevated onClose={() => setFoodOpen(null)} />}

      <style>{`
        .plate-part { display:flex; align-items:center; gap:12px; width:100%; text-align:left; border:none; font-family:inherit;
          background:var(--card); border-radius:14px; padding:10px 12px; box-shadow:var(--shadow); cursor:pointer; margin-bottom:8px; }
        .plate-pic { flex:none; width:46px; height:46px; border-radius:12px; overflow:hidden; background:var(--elev);
          display:flex; align-items:center; justify-content:center; font-size:24px; }
        .plate-pic img { width:100%; height:100%; object-fit:cover; }
        .plate-n { font-size:14px; font-weight:700; }
        .plate-note { font-size:12px; color:var(--text2); line-height:1.35; margin-top:2px; }
        .plate-roll { flex:none; font-size:18px; padding:6px; }
        .plate-slot { margin-bottom:4px; }
        .plate-empty { font-size:12.5px; color:var(--text2); background:var(--elev); border-radius:12px; padding:12px; margin-bottom:8px; }
      `}</style>
    </div>,
    document.body,
  );
}
