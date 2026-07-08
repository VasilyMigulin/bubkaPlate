import { useState } from 'react';
import type { Food, Reaction } from '../types';
import { CHOOSE, FOODS, RELATED } from '../data/foods';
import { FOOD_PHOTOS } from '../data/photos';
import { useStore } from '../state/store';
import { ServeShape, serveLabel } from './ServeShape';
import './ProductSheet.css';

const AGE_LABEL: Record<string, string> = { '6': '6–7 мес', '8': '8–9 мес', '10': '10–11 мес', '12': '12+ мес' };

const RX_OPTS: { rx: Reaction; e: string; label: string }[] = [
  { rx: 'ok', e: '💚', label: 'Всё хорошо — реакции нет' },
  { rx: 'wait', e: '👀', label: 'Пока наблюдаю' },
  { rx: 'skin', e: '🌡', label: 'Кожа: сыпь, покраснение' },
  { rx: 'tummy', e: '💩', label: 'Живот: стул, газики' },
];

const isDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

export function ProductSheet({ food, onClose }: { food: Food; onClose: () => void }) {
  const { logFood, startAllergen, showToast, ageMonths } = useStore();
  const [rxOpen, setRxOpen] = useState(false);
  const [related, setRelated] = useState<Food>(food);
  const f = related;
  const bg = isDark() ? f.dbg : f.bg;
  const ages = Object.keys(f.serve);
  const canAllergen = f.allergen && f.allergen !== 'глютен';
  const choose = CHOOSE[f.id];
  const relatedIds = (RELATED[f.id] || []).map((id) => FOODS.find((x) => x.id === id)).filter(Boolean) as Food[];
  // возраст ребёнка → какую ступень подсветить
  const currentStep = (() => {
    const keys = ages.map(Number).sort((a, b) => a - b);
    if (ageMonths == null) return null;
    const fit = keys.filter((k) => k <= ageMonths);
    return String(fit.length ? fit[fit.length - 1] : keys[0]);
  })();

  const openRelated = (r: Food) => { setRelated(r); document.querySelector('.prod-sheet')?.scrollTo({ top: 0 }); };

  const pickReaction = (rx: Reaction) => {
    logFood(f.id, rx);
    setRxOpen(false);
    if (rx === 'skin' || rx === 'tummy') showToast('👀', 'Реакция записана', 'Отметили — покажите аллергологу');
    else showToast('✓', 'Записано в дневник', `${f.n} · ${rx === 'ok' ? 'без реакции' : 'наблюдаем'}`);
    onClose();
  };

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="prod-sheet" onClick={(e) => e.stopPropagation()}>
        <button className="ps-back" onClick={onClose} aria-label="Назад">‹</button>
        <div className="ps-hero" style={{ background: FOOD_PHOTOS[f.id] ? '#F6F2EB' : `radial-gradient(circle at 30% 25%, ${bg[0]}, ${bg[1]})` }}>
          {FOOD_PHOTOS[f.id] ? <img className="ps-photo" src={FOOD_PHOTOS[f.id]} alt={f.n} /> : <span>{f.e}</span>}
        </div>
        <div className="ps-body">
          <h2>{f.n}</h2>
          <span className="pill-note">
            👶 с {f.fromMonth} мес · аллерген: {f.allergen || 'нет'} · подавиться: {f.choke}
            {f.iron && ' · 🥩 железо'}
          </span>

          <div className="section-t">Подача по возрасту</div>
          <div className="serve-list">
            {ages.map((a) => {
              const [shape, text] = f.serve[a];
              const isNow = a === currentStep;
              return (
                <div key={a} className={`serve-row ${isNow ? 'now' : ''}`}>
                  <ServeShape shape={shape} color={bg} size={104} />
                  <div className="serve-info">
                    <div className="serve-age">{AGE_LABEL[a]}{isNow && <span className="serve-now-tag">сейчас</span>}</div>
                    <div className="serve-shape-label">{serveLabel(shape)}</div>
                    <div className="serve-text">{text}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {choose && (
            <>
              <div className="section-t">Как выбрать</div>
              <div className="note"><span className="ne">🛒</span><span>{choose}</span></div>
            </>
          )}

          <div className="section-t">О продукте</div>
          <div className="note"><span className="ne">💚</span><span><b>Польза:</b> {f.benefit}</span></div>
          <div className="note"><span className="ne">👩‍🍳</span><span><b>Как приготовить:</b> {f.cook}</span></div>
          <div className="note"><span className="ne">🧊</span><span><b>Как хранить:</b> {f.store}</span></div>
          <div className="note alert"><span className="ne">⚠️</span><span><b>Когда нельзя:</b> {f.caution}</span></div>
          <div className="note"><span className="ne">🔁</span><span><b>Если не понравилось:</b> предлагайте снова через 3–4 дня, до 10–15 раз, без давления.</span></div>

          {relatedIds.length > 0 && (
            <>
              <div className="section-t">Смотрите также</div>
              <div className="related-row">
                {relatedIds.map((r) => (
                  <button key={r.id} className="related-chip" onClick={() => openRelated(r)}>
                    <span className="related-e">{r.e}</span>{r.n}
                  </button>
                ))}
              </div>
            </>
          )}

          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setRxOpen(true)}>✓ Дали сегодня — в дневник</button>
          {canAllergen && (
            <button className="btn btn-soft" style={{ marginTop: 8 }} onClick={() => { startAllergen(f.id); showToast('🗓', `Ввод начат: ${f.n}`, 'Давайте утром 3 дня подряд'); onClose(); }}>
              🗓 Начать ввод по правилу 3 дней
            </button>
          )}
        </div>

        {rxOpen && (
          <div className="rx-scrim" onClick={() => setRxOpen(false)}>
            <div className="rx-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="grab" />
              <h3>{f.n}: как малыш перенёс?</h3>
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
