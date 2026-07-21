import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ARTICLES, POSTS, type Article } from '../data/basics';
import { FOODS } from '../data/foods';
import { RECIPES, type Recipe } from '../data/recipes';
import { TOPICS } from '../data/searchIndex';
import { MAIN_PHOTOS } from '../data/mainPhotos';
import { ArticleView } from './ArticleView';
import { ProductSheet } from './ProductSheet';
import { RecipeSheet } from './RecipeSheet';
import type { Food } from '../types';

const QUICK = ['давится', 'мало ест', 'запор', 'аллергия', 'с чего начать', 'железо', 'зубки'];

/** Поиск по вопросам: «давится», «запор», «мало ест» → статьи, продукты, рецепты. */
export function SearchSheet({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const [article, setArticle] = useState<Article | null>(null);
  const [food, setFood] = useState<Food | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  const res = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (query.length < 2) return null;

    const artIds = new Set<string>();
    const prodIds = new Set<string>();
    const recNames = new Set<string>();

    // 1) тематический индекс — вопросы и синонимы
    TOPICS.forEach((t) => {
      if (t.re.test(query)) {
        t.articles?.forEach((a) => artIds.add(a));
        t.products?.forEach((p) => prodIds.add(p));
        if (t.recipeQuery) {
          RECIPES.filter((r) => r.n.toLowerCase().includes(t.recipeQuery!)).slice(0, 4).forEach((r) => recNames.add(r.n));
        }
      }
    });

    // 2) прямое совпадение по названиям и текстам
    [...ARTICLES, ...POSTS].forEach((a) => {
      if ((a.t + ' ' + a.sub + ' ' + a.lead).toLowerCase().includes(query)) artIds.add(a.id);
    });
    FOODS.forEach((f) => { if (f.n.toLowerCase().includes(query)) prodIds.add(f.id); });
    RECIPES.forEach((r) => {
      if (r.n.toLowerCase().includes(query) || r.ing.some((i) => i.includes(query))) recNames.add(r.n);
    });

    const all = [...ARTICLES, ...POSTS];
    return {
      articles: [...artIds].map((id) => all.find((a) => a.id === id)).filter(Boolean) as Article[],
      products: [...prodIds].map((id) => FOODS.find((f) => f.id === id)).filter(Boolean) as Food[],
      recipes: [...recNames].slice(0, 6).map((n) => RECIPES.find((r) => r.n === n)).filter(Boolean) as Recipe[],
    };
  }, [q]);

  const empty = res && res.articles.length === 0 && res.products.length === 0 && res.recipes.length === 0;

  return createPortal(
    <>
    <div className="article-view">
      <button className="ps-back" onClick={onClose} aria-label="Назад">‹</button>
      <div className="ss-head">
        <h2>🔍 Спросите нас</h2>
        <input className="search" style={{ marginTop: 12 }} autoFocus placeholder="Давится, запор, мало ест, с чего начать…"
          value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="ss-quick">
          {QUICK.map((w) => (
            <button key={w} className={`chip ${q === w ? 'on' : ''}`} onClick={() => setQ(w)}>{w}</button>
          ))}
        </div>
      </div>
      <div className="ss-body">
        {!res && <div className="sub" style={{ textAlign: 'center', padding: 18 }}>Опишите вопрос своими словами — найдём статью, продукт или рецепт.</div>}
        {empty && <div className="sub" style={{ textAlign: 'center', padding: 18 }}>Пока не нашли. Попробуйте иначе: «давится», «сыпь», «не ест овощи»…</div>}

        {res && res.articles.length > 0 && (
          <>
            <div className="section-t">📚 Статьи</div>
            {res.articles.map((a) => (
              <button key={a.id} className="ss-row" onClick={() => setArticle(a)}>
                <div className="ss-pic" style={{ background: `radial-gradient(circle at 30% 25%, ${a.bg[0]}, ${a.bg[1]})` }}>{a.e}</div>
                <div className="grow">
                  <div className="ss-t">{a.t}</div>
                  <div className="ss-s">{a.sub}</div>
                </div>
                <span className="ss-chev">›</span>
              </button>
            ))}
          </>
        )}

        {res && res.products.length > 0 && (
          <>
            <div className="section-t">🥦 Продукты</div>
            {res.products.slice(0, 6).map((f) => (
              <button key={f.id} className="ss-row" onClick={() => setFood(f)}>
                <div className="ss-pic">
                  {MAIN_PHOTOS[f.id] ? <img src={MAIN_PHOTOS[f.id]} alt={f.n} /> : <span>{f.e}</span>}
                </div>
                <div className="grow">
                  <div className="ss-t">{f.n}</div>
                  <div className="ss-s">с {f.fromMonth} мес{f.allergen ? ` · аллерген: ${f.allergen}` : ''}</div>
                </div>
                <span className="ss-chev">›</span>
              </button>
            ))}
          </>
        )}

        {res && res.recipes.length > 0 && (
          <>
            <div className="section-t">🍲 Рецепты</div>
            {res.recipes.map((r) => (
              <button key={r.n} className="ss-row" onClick={() => setRecipe(r)}>
                <div className="ss-pic" style={{ background: r.bg }}>{r.e}</div>
                <div className="grow">
                  <div className="ss-t">{r.n}</div>
                  <div className="ss-s">{r.age} мес · {r.time}</div>
                </div>
                <span className="ss-chev">›</span>
              </button>
            ))}
          </>
        )}
      </div>

      <style>{`
        .ss-head { padding:64px 18px 4px; }
        .ss-head h2 { font-size:24px; font-weight:750; letter-spacing:-.02em; }
        .ss-quick { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
        .ss-body { padding:10px 18px calc(30px + env(safe-area-inset-bottom)); }
        .ss-row { display:flex; align-items:center; gap:12px; width:100%; text-align:left; border:none; font-family:inherit;
          background:var(--card); border-radius:16px; padding:11px 12px; box-shadow:var(--shadow); margin-bottom:8px; cursor:pointer; }
        .ss-pic { flex:none; width:48px; height:48px; border-radius:14px; overflow:hidden; background:var(--elev);
          display:flex; align-items:center; justify-content:center; font-size:24px; }
        .ss-pic img { width:100%; height:100%; object-fit:cover; }
        .ss-t { font-size:14px; font-weight:700; }
        .ss-s { font-size:12px; color:var(--text2); margin-top:2px; }
        .ss-chev { flex:none; color:var(--text2); font-size:17px; }
      `}</style>
    </div>

    {article && <ArticleView article={article} onClose={() => setArticle(null)} />}
    {food && <ProductSheet food={food} onClose={() => setFood(null)} />}
    {recipe && <RecipeSheet recipe={recipe} onClose={() => setRecipe(null)} />}
    </>,
    document.body,
  );
}
