import { useState } from 'react';
import type { Food, Reaction } from '../types';
import { useStore } from '../state/store';
import { ServeShape, serveLabel } from './ServeShape';
import './ProductSheet.css';

const AGE_TABS: { key: string; label: string }[] = [
  { key: '6', label: '6–7 мес' }, { key: '8', label: '8–9 мес' },
  { key: '10', label: '10–11 мес' }, { key: '12', label: '12+ мес' },
];

const RX_OPTS: { rx: Reaction; e: string; label: string }[] = [
  { rx: 'ok', e: '💚', label: 'Всё хорошо — реакции нет' },
  { rx: 'wait', e: '👀', label: 'Пока наблюдаю' },
  { rx: 'skin', e: '🌡', label: 'Кожа: сыпь, покраснение' },
  { rx: 'tummy', e: '💩', label: 'Живот: стул, газики' },
];

const isDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

export function ProductSheet({ food, onClose }: { food: Food; onClose: () => void }) {
  const { logFood, startAllergen, showToast, ageMonths } = useStore();
  // открываем на возрасте ребёнка: наибольшая ступень serve, которая уже наступила
  const initialAge = (() => {
    const keys = Object.keys(food.serve).map(Number).sort((a, b) => a - b);
    if (ageMonths == null) return '6';
    const fit = keys.filter((k) => k <= ageMonths);
    return String(fit.length ? fit[fit.length - 1] : keys[0]);
  })();
  const [age, setAge] = useState(initialAge);
  const [rxOpen, setRxOpen] = useState(false);
  const bg = isDark() ? food.dbg : food.bg;
  const [shape, text] = food.serve[age];
  const ages = Object.keys(food.serve);
  const canAllergen = food.allergen && food.allergen !== 'глютен';

  const pickReaction = (rx: Reaction) => {
    logFood(food.id, rx);
    setRxOpen(false);
    if (rx === 'skin' || rx === 'tummy') showToast('👀', 'Реакция записана', 'Отметили — покажите аллергологу');
    else showToast('✓', 'Записано в дневник', `${food.n} · ${rx === 'ok' ? 'без реакции' : 'наблюдаем'}`);
    onClose();
  };

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="prod-sheet" onClick={(e) => e.stopPropagation()}>
        <button className="ps-back" onClick={onClose} aria-label="Назад">‹</button>
        <div className="ps-hero" style={{ background: `radial-gradient(circle at 30% 25%, ${bg[0]}, ${bg[1]})` }}>
          <span>{food.e}</span>
        </div>
        <div className="ps-body">
          <h2>{food.n}</h2>
          <span className="pill-note">
            👶 с {food.fromMonth} мес · аллерген: {food.allergen || 'нет'} · подавиться: {food.choke}
            {food.iron && ' · 🥩 железо'}
          </span>

          <div className="section-t">Подача по возрасту</div>
          <div className="segs age-seg">
            {ages.map((a) => (
              <button key={a} className={`chip ${a === age ? 'on' : ''}`} onClick={() => setAge(a)}>
                {AGE_TABS.find((t) => t.key === a)?.label}
              </button>
            ))}
          </div>
          <div className="serve-card">
            <ServeShape shape={shape} color={bg} />
            <div className="serve-info">
              <div className="serve-shape-label">{serveLabel(shape)}</div>
              <div className="serve-text">{text}</div>
            </div>
          </div>

          <div className="section-t">О продукте</div>
          <div className="note"><span className="ne">💚</span><span><b>Польза:</b> {food.benefit}</span></div>
          <div className="note"><span className="ne">👩‍🍳</span><span><b>Как приготовить:</b> {food.cook}</span></div>
          <div className="note"><span className="ne">🧊</span><span><b>Как хранить:</b> {food.store}</span></div>
          <div className="note alert"><span className="ne">⚠️</span><span><b>Когда нельзя:</b> {food.caution}</span></div>
          <div className="note"><span className="ne">🔁</span><span><b>Если не понравилось:</b> предлагайте снова через 3–4 дня, до 10–15 раз, без давления.</span></div>

          <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => setRxOpen(true)}>✓ Дали сегодня — в дневник</button>
          {canAllergen && (
            <button className="btn btn-soft" style={{ marginTop: 8 }} onClick={() => { startAllergen(food.id); showToast('🗓', `Ввод начат: ${food.n}`, 'Давайте утром 3 дня подряд'); onClose(); }}>
              🗓 Начать ввод по правилу 3 дней
            </button>
          )}
        </div>

        {rxOpen && (
          <div className="rx-scrim" onClick={() => setRxOpen(false)}>
            <div className="rx-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="grab" />
              <h3>{food.n}: как малыш перенёс?</h3>
              {RX_OPTS.map((o) => (
                <button key={o.rx} className="rx-opt" onClick={() => pickReaction(o.rx)}>
                  <span className="rxe">{o.e}</span>{o.label}
                </button>
              ))}
              <div className="rx-hint">Сохранится в дневник и в PDF для аллерголога.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
