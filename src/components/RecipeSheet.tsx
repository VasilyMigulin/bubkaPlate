import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Recipe } from '../data/recipes';
import { findFoodByIng } from '../data/foods';
import type { Food } from '../types';
import { ProductSheet } from './ProductSheet';
import { ShopSheet } from './ShopSheet';
import { Lightbox } from './Lightbox';
import { Media } from './Media';
import { putMedia } from '../lib/idbMedia';
import { useStore } from '../state/store';

interface CookEntry { ts: number; rx?: 'loved' | 'liked' | 'meh'; note?: string; media?: string[] }
const LIKE_OPTS: { rx: 'loved' | 'liked' | 'meh'; e: string; label: string }[] = [
  { rx: 'loved', e: '😍', label: 'В восторге' },
  { rx: 'liked', e: '🙂', label: 'Неплохо' },
  { rx: 'meh', e: '😐', label: 'Не оценил' },
];

function compressImage(file: File, max = 640, q = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL('image/jpeg', q));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/** Полноэкранная карточка рецепта (портал — работает из каталога и из карточки продукта). */
export function RecipeSheet({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const { showToast, activeId } = useStore();
  const [foodOpen, setFoodOpen] = useState<Food | null>(null);
  const [inCart, setInCart] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [fav, setFav] = useState(() => { try { return (JSON.parse(localStorage.getItem('bubka-plate-favs') || '[]') as string[]).includes(recipe.n); } catch { return false; } });
  const [cookOpen, setCookOpen] = useState(false);
  const [rx, setRx] = useState<'loved' | 'liked' | 'meh' | null>(null);
  const [note, setNote] = useState('');
  const [media, setMedia] = useState<string[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const COOK_KEY = `bubka-plate-cooked-${activeId ?? ''}`;
  const [cooks, setCooks] = useState<CookEntry[]>(() => {
    try { return (JSON.parse(localStorage.getItem(COOK_KEY) || '{}') as Record<string, CookEntry[]>)[recipe.n] ?? []; } catch { return []; }
  });
  const lastRx = useMemo(() => [...cooks].reverse().find((c) => c.rx)?.rx, [cooks]);

  const toggleFav = () => {
    try {
      const cur = JSON.parse(localStorage.getItem('bubka-plate-favs') || '[]') as string[];
      const has = cur.includes(recipe.n);
      localStorage.setItem('bubka-plate-favs', JSON.stringify(has ? cur.filter((x) => x !== recipe.n) : [...cur, recipe.n]));
      setFav(!has);
    } catch { /* ignore */ }
  };

  const onMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = [...(e.target.files ?? [])];
    const out: string[] = [];
    for (const f of files) {
      if (f.type.startsWith('image/')) out.push(await compressImage(f));
      else if (f.type.startsWith('video/')) { if (f.size <= 300 * 1024 * 1024) out.push(await putMedia(f)); else showToast('🎬', 'Слишком длинное видео', 'До 300 МБ'); }
    }
    setMedia((prev) => [...prev, ...out].slice(0, 5));
    e.target.value = '';
  };

  const saveCook = () => {
    const entry: CookEntry = { ts: Date.now(), rx: rx ?? undefined, note: note.trim() || undefined, media: media.length ? media : undefined };
    const next = [...cooks, entry];
    setCooks(next);
    try {
      const all = JSON.parse(localStorage.getItem(COOK_KEY) || '{}') as Record<string, CookEntry[]>;
      all[recipe.n] = next;
      localStorage.setItem(COOK_KEY, JSON.stringify(all));
    } catch { /* quota */ }
    setCookOpen(false); setRx(null); setNote(''); setMedia([]);
    showToast('🥣', 'Записано: приготовили!', next.length > 1 ? `Уже ${next.length} раз для малыша 💛` : 'Первый раз — в вашей кулинарной истории');
  };

  return createPortal(
    <>
    <div className="recipe-view">
      <button className="ps-back" onClick={onClose} aria-label="Назад">‹</button>
      <div className="recipe-hero" style={{ background: recipe.bg }}>{recipe.e}</div>
      <div className="recipe-body">
        <h2>
          {recipe.n}
          <button className={`fav-big ${fav ? 'on' : ''}`} onClick={toggleFav}>{fav ? '♥' : '♡'}</button>
        </h2>
        {cooks.length > 0 && (
          <div className="cook-badge">✓ Готовили {cooks.length} {cooks.length === 1 ? 'раз' : cooks.length < 5 ? 'раза' : 'раз'}{lastRx && ` · малышу ${LIKE_OPTS.find((o) => o.rx === lastRx)!.e}`}</div>
        )}
        <div className="rm" style={{ marginTop: 8 }}>
          <span className="tag green">{recipe.age} мес</span>
          <span className="tag">{recipe.time}</span>
          {recipe.ing.map((i) => {
            const food = findFoodByIng(i);
            return food
              ? <button key={i} className="tag tag-link" onClick={() => setFoodOpen(food)}>{food.e} {i}</button>
              : <span key={i} className="tag">{i}</span>;
          })}
        </div>
        {recipe.allergens.length > 0 ? (
          <div className="note alert" style={{ marginTop: 12 }}><span className="ne">⚠️</span><span><b>Аллергены в составе:</b> {recipe.allergens.join(', ')}. Каждый должен быть уже введён по отдельности — новые аллергены в составе блюд не вводим.</span></div>
        ) : (
          <div className="note" style={{ marginTop: 12 }}><span className="ne">✅</span><span>Частых аллергенов в составе нет.</span></div>
        )}

        {recipe.items && recipe.items.length > 0 && (
          <>
            <div className="section-t">Ингредиенты</div>
            <ul className="tips-list">
              {recipe.items.map((it, i) => <li key={i}>{it}</li>)}
            </ul>
            {!inCart ? (
              <button className="btn btn-soft" style={{ marginTop: 8 }} onClick={() => {
                try {
                  const cur = JSON.parse(localStorage.getItem('bubka-plate-shoplist') || '[]') as string[];
                  const added = recipe.items!.filter((it) => !cur.includes(it));
                  localStorage.setItem('bubka-plate-shoplist', JSON.stringify([...cur, ...added]));
                  setInCart(true);
                  showToast('🛒', `+${added.length} в список покупок`);
                } catch { /* ignore */ }
              }}>🛒 В список покупок</button>
            ) : (
              <button className="btn btn-done" style={{ marginTop: 8 }} onClick={() => setShopOpen(true)}>
                ✓ Добавлено · Открыть список →
              </button>
            )}
          </>
        )}

        {recipe.out && <div className="note" style={{ marginTop: 10 }}><span className="ne">🍽</span><span><b>Выход:</b> {recipe.out}</span></div>}

        <div className="section-t">Шаги</div>
        {recipe.steps.map((s, i) => (
          <div key={i} className="step"><div className="step-n">{i + 1}</div><div className="step-t">{s}</div></div>
        ))}
        <div className="note" style={{ marginTop: 10 }}><span className="ne">💡</span><span>{recipe.note}</span></div>
        <div className="note"><span className="ne">🧊</span><span><b>Хранение:</b> {recipe.storage}</span></div>
        {recipe.gear && recipe.gear.length > 0 && (
          <>
            <div className="section-t">🛒 Полезные покупки</div>
            <ul className="tips-list">
              {recipe.gear.map((g, i) => <li key={i}>{g}</li>)}
            </ul>
          </>
        )}

        {cooks.some((c) => c.media?.length) && (
          <>
            <div className="section-t">Как получалось у вас</div>
            <div className="cook-gallery">
              {cooks.flatMap((c) => c.media ?? []).map((m, i) => (
                <Media key={i} src={m} className="tappable" onClick={() => setLightbox(m)} />
              ))}
            </div>
          </>
        )}

        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => setCookOpen(true)}>
          🍽 Приготовили — отметить
        </button>
      </div>

      {cookOpen && (
        <div className="skill-pop-scrim" onClick={() => setCookOpen(false)}>
          <div className="cook-form" onClick={(e) => e.stopPropagation()}>
            <div className="grab" />
            <div className="bs-title">🍽 Приготовили «{recipe.n}»</div>

            <div className="rx-label">Как малышу? <span className="rx-opt-tag">необязательно</span></div>
            <div className="cook-chips">
              {LIKE_OPTS.map((o) => (
                <button key={o.rx} className={`cook-chip ${rx === o.rx ? 'on' : ''}`} onClick={() => setRx(rx === o.rx ? null : o.rx)}>
                  <span>{o.e}</span>{o.label}
                </button>
              ))}
            </div>

            <div className="rx-label">Заметка <span className="rx-opt-tag">необязательно</span></div>
            <textarea className="rx-note" rows={2} placeholder="Что изменили, с чем подавали, съел ли…" value={note} onChange={(e) => setNote(e.target.value)} />

            <div className="rx-label">Фото и видео блюда <span className="rx-opt-tag">до 5</span></div>
            <input ref={fileRef} type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={onMedia} />
            {media.length > 0 && (
              <div className="cook-media-grid">
                {media.map((m, i) => (
                  <div key={i} className="cook-media-wrap">
                    <Media src={m} />
                    <button className="rx-photo-del" onClick={() => setMedia((arr) => arr.filter((_, j) => j !== i))} aria-label="Удалить">✕</button>
                  </div>
                ))}
              </div>
            )}
            {media.length < 5 && <button className="btn btn-soft" onClick={() => fileRef.current?.click()}>📷 Добавить фото/видео</button>}

            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={saveCook}>Сохранить</button>
          </div>
        </div>
      )}

      {foodOpen && <ProductSheet food={foodOpen} elevated onClose={() => setFoodOpen(null)} />}
      <ShopSheet open={shopOpen} onClose={() => setShopOpen(false)} />
    </div>
    {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </>,
    document.body,
  );
}
