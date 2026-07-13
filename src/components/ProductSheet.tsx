import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Food, Reaction } from '../types';
import { BIG_ALLERGENS, CHOOSE, FOODS, RELATED } from '../data/foods';
import { MAIN_PHOTOS } from '../data/mainPhotos';
import { SERVE_PHOTOS } from '../data/servePhotos';
import { RECIPES, type Recipe } from '../data/recipes';
import { useStore } from '../state/store';
import { FoodIcon } from './FoodIcon';
import { RecipeSheet } from './RecipeSheet';
import { ServeShape } from './ServeShape';
import './ProductSheet.css';

const AGE_LABEL: Record<string, string> = {
  '6': '6–7 мес',
  '8': '8–9 мес',
  '10': '10–11 мес',
  '12': '12+ мес',
  '18': '18+ мес',
  '48': 'после 4 лет',
};

// Пояснение навыка малыша по возрасту — доступно по тапу на значок «?». Хранится один раз.
const SKILL_INFO: Record<string, string> = {
  '6': 'В этом возрасте малыш берёт еду всей ладошкой и грызёт дёснами. Поэтому кусок делают длинным, «с палец» — чтобы торчал из кулачка.',
  '8': 'Появляется пинцетный захват — малыш берёт мелкие кусочки двумя пальчиками. Поэтому подходят кубики около 1 см.',
  '12': 'Малыш уверенно жуёт и откусывает — можно кусочки с общего стола.',
  '18': 'Малыш осваивает ложку и вилку, ест самостоятельно.',
};

// Если у ступени своя подпись возраста — пояснение подбирается по ней (а не по внутреннему ключу).
const SKILL_BY_LABEL: Record<string, string> = {
  '6–8 мес': '6',
  '9–12 мес': '8',
  '12–24 мес': '12',
};

const RX_OPTS: { rx: Reaction; e: string; label: string }[] = [
  { rx: 'ok', e: '💚', label: 'Всё хорошо' },
  { rx: 'wait', e: '👀', label: 'Наблюдаю' },
  { rx: 'skin', e: '🌡', label: 'Кожа' },
  { rx: 'tummy', e: '💩', label: 'Живот' },
];

const isDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

// Сжатие фото момента перед сохранением в localStorage.
function compressImage(file: File, max = 380, q = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL('image/jpeg', q));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function ProductSheet({ food, onClose }: { food: Food; onClose: () => void }) {
  const { logFood, startAllergen, showToast, ageMonths } = useStore();
  const [rxOpen, setRxOpen] = useState(false);
  const [selRx, setSelRx] = useState<Reaction | null>(null);
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<string | undefined>();
  const [skillInfo, setSkillInfo] = useState<string | null>(null);
  const [recipeOpen, setRecipeOpen] = useState<Recipe | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [related, setRelated] = useState<Food>(food);
  const f = related;
  const bg = isDark() ? f.dbg : f.bg;
  const ages = Object.keys(f.serve);
  const canAllergen = f.allergen && f.allergen !== 'глютен';
  const choose = f.choose ?? CHOOSE[f.id];
  const relatedIds = (RELATED[f.id] || []).map((id) => FOODS.find((x) => x.id === id)).filter(Boolean) as Food[];
  const productRecipes = RECIPES.filter((r) => r.ing.includes(f.n.toLowerCase()));
  // возраст ребёнка → какую ступень подсветить
  const currentStep = (() => {
    const keys = ages.map(Number).sort((a, b) => a - b);
    if (ageMonths == null) return null;
    const fit = keys.filter((k) => k <= ageMonths);
    return String(fit.length ? fit[fit.length - 1] : keys[0]);
  })();

  const openRelated = (r: Food) => { setRelated(r); document.querySelector('.prod-sheet')?.scrollTo({ top: 0 }); };

  const openRx = () => { setSelRx(null); setNote(''); setPhoto(undefined); setRxOpen(true); };

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPhoto(await compressImage(file));
  };

  const saveEntry = () => {
    if (!selRx) return;
    logFood(f.id, selRx, note, photo);
    setRxOpen(false);
    if (selRx === 'skin' || selRx === 'tummy') showToast('👀', 'Реакция записана', 'Отметили — покажите аллергологу');
    else showToast('✓', 'Записано в дневник', `${f.n}${photo ? ' · с фото 📷' : ''}`);
    onClose();
  };

  return createPortal(
    <div className="product-view">
        <button className="ps-back" onClick={onClose} aria-label="Назад">‹</button>
        <div className="ps-hero" style={{ background: MAIN_PHOTOS[f.id] ? undefined : `radial-gradient(circle at 30% 25%, ${bg[0]}, ${bg[1]})` }}>
          {MAIN_PHOTOS[f.id] ? <img className="ps-photo-cover" src={MAIN_PHOTOS[f.id]} alt={f.n} /> : <FoodIcon food={f} size={130} />}
        </div>
        <div className="ps-body">
          <h2>{f.n}</h2>
          <span className="pill-note">
            👶 с {f.fromMonth} мес · частый аллерген: {f.allergen || 'нет'} · риск удушья: {f.choke}
            {f.iron && ' · 🥩 железо'}
          </span>
          {f.allergen && BIG_ALLERGENS.has(f.allergen) && (
            <span className="intro-pill" onClick={() => setSkillInfo('Современная рекомендация: основные аллергены не избегать, а своевременно знакомить с ними малыша — раннее введение снижает риск аллергии. Вводите по правилу 3 дней: утром, с малой дозы.')}>
              🟠 Важно ввести до года <span className="skill-i" style={{ display: 'inline-flex' }}>?</span>
            </span>
          )}

          <div className="section-t">Подача по возрасту</div>
          <div className="serve-list">
            {ages.map((a) => {
              const [shape, text, ageOverride] = f.serve[a];
              const isNow = !ageOverride && a === currentStep;
              const ageText = ageOverride ?? AGE_LABEL[a];
              const skillKey = ageOverride ? SKILL_BY_LABEL[ageOverride] : a;
              const skill = skillKey ? SKILL_INFO[skillKey] : undefined;
              const photo = SERVE_PHOTOS[f.id]?.[a];
              return (
                <div key={a} className={`serve-row ${isNow ? 'now' : ''}`}>
                  {photo
                    ? <img className="serve-photo" src={photo} alt={`${f.n}, ${ageText}`} loading="lazy" />
                    : <ServeShape shape={shape} color={bg} size={124} />}
                  <div className="serve-info">
                    <div className="serve-age">
                      {ageText}
                      {skill && <button className="skill-i" onClick={() => setSkillInfo(skill)} aria-label="Что это значит">?</button>}
                      {isNow && <span className="serve-now-tag">сейчас</span>}
                    </div>
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

          {f.tips && f.tips.length > 0 && (
            <>
              <div className="section-t">Способы подачи</div>
              <ul className="tips-list">
                {f.tips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </>
          )}

          {f.warnings && f.warnings.length > 0 && (
            <>
              <div className="section-t">⚠️ Важно</div>
              <ul className="warn-list">
                {f.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </>
          )}

          <div className="section-t">О продукте</div>
          <div className="note"><span className="ne">💚</span><span><b>Польза:</b> {f.benefit}</span></div>
          {!f.tips?.length && <div className="note"><span className="ne">👩‍🍳</span><span><b>Как приготовить:</b> {f.cook}</span></div>}
          {f.store && f.store !== '—' && <div className="note"><span className="ne">🧊</span><span><b>Как хранить:</b> {f.store}</span></div>}
          {!f.warnings?.length && <div className="note alert"><span className="ne">⚠️</span><span><b>Когда нельзя:</b> {f.caution}</span></div>}
          {f.cat !== 'Напитки и добавки' && <div className="note"><span className="ne">🔁</span><span><b>Если не понравилось:</b> предлагайте снова через 3–4 дня, до 10–15 раз, без давления.</span></div>}

          {productRecipes.length > 0 && (
            <>
              <div className="section-t">🍲 Приготовить с этим продуктом</div>
              {productRecipes.map((r) => (
                <button key={r.n} className="recipe" onClick={() => setRecipeOpen(r)}>
                  <div className="rp" style={{ background: r.bg }}>{r.e}</div>
                  <div className="grow">
                    <div className="rn">{r.n}</div>
                    <div className="rm"><span className="tag green">{r.age} мес</span><span className="tag">{r.time}</span></div>
                  </div>
                </button>
              ))}
            </>
          )}

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

          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={openRx}>✓ Дали сегодня — в дневник</button>
          {canAllergen && (
            <button className="btn btn-soft" style={{ marginTop: 8 }} onClick={() => { startAllergen(f.id); showToast('🗓', `Ввод начат: ${f.n}`, 'Давайте утром 3 дня подряд'); onClose(); }}>
              🗓 Начать ввод по правилу 3 дней
            </button>
          )}
        </div>

        {recipeOpen && <RecipeSheet recipe={recipeOpen} onClose={() => setRecipeOpen(null)} />}

        {skillInfo && createPortal(
          <div className="skill-pop-scrim" onClick={() => setSkillInfo(null)}>
            <div className="skill-pop" onClick={(e) => e.stopPropagation()}>
              <div className="skill-pop-text">{skillInfo}</div>
              <button className="btn btn-soft" onClick={() => setSkillInfo(null)}>Понятно</button>
            </div>
          </div>,
          document.body,
        )}

        {rxOpen && createPortal(
          <div className="rx-screen">
            <div className="rx-top">
              <button className="rx-back" onClick={() => setRxOpen(false)} aria-label="Закрыть">‹</button>
              <div className="rx-top-title">Запись в дневник</div>
            </div>
            <div className="rx-scroll">
              <div className="rx-hero">
                <div className="rx-hero-pic" style={{ background: MAIN_PHOTOS[f.id] ? undefined : `radial-gradient(circle at 30% 25%, ${bg[0]}, ${bg[1]})` }}>
                  {MAIN_PHOTOS[f.id] ? <img src={MAIN_PHOTOS[f.id]} alt={f.n} /> : <FoodIcon food={f} size={54} />}
                </div>
                <div>
                  <div className="rx-hero-n">{f.n}</div>
                  <div className="rx-hero-s">Как прошла проба?</div>
                </div>
              </div>

              <div className="rx-label">Впечатление малыша</div>
              <div className="rx-chips">
                {RX_OPTS.map((o) => (
                  <button key={o.rx} className={`rx-chip ${selRx === o.rx ? 'on' : ''}`} onClick={() => setSelRx(o.rx)}>
                    <span className="rxe">{o.e}</span>{o.label}
                  </button>
                ))}
              </div>

              <div className="rx-label">Заметка для себя <span className="rx-opt-tag">необязательно</span></div>
              <textarea className="rx-note" placeholder="Сколько съел, как реагировал, понравилось ли…" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />

              <div className="rx-label">Фото момента <span className="rx-opt-tag">необязательно</span></div>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={onPhoto} />
              {photo ? (
                <div className="rx-photo-wrap">
                  <img className="rx-photo" src={photo} alt="момент" />
                  <button className="rx-photo-del" onClick={() => setPhoto(undefined)} aria-label="Удалить фото">✕</button>
                </div>
              ) : (
                <button className="rx-photo-add" onClick={() => fileRef.current?.click()}>📷 Сфотографировать первую пробу</button>
              )}

              <div className="rx-hint">Заметка и фото — только для вас. Реакция попадёт в дневник и PDF для аллерголога.</div>
            </div>
            <div className="rx-foot">
              <button className="btn btn-primary" disabled={!selRx} onClick={saveEntry}>
                {selRx ? 'Сохранить в дневник' : 'Выберите впечатление ↑'}
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>,
    document.body,
  );
}
