import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Recipe } from '../data/recipes';
import { findFoodByIng } from '../data/foods';
import type { Food } from '../types';
import { ProductSheet } from './ProductSheet';
import { useStore } from '../state/store';

/** Полноэкранная карточка рецепта (портал — работает из каталога и из карточки продукта). */
export function RecipeSheet({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const { showToast } = useStore();
  const [foodOpen, setFoodOpen] = useState<Food | null>(null);
  const [inCart, setInCart] = useState(false);
  return createPortal(
    <div className="recipe-view">
      <button className="ps-back" onClick={onClose} aria-label="Назад">‹</button>
      <div className="recipe-hero" style={{ background: recipe.bg }}>{recipe.e}</div>
      <div className="recipe-body">
        <h2>{recipe.n}</h2>
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
            <button className={`btn ${inCart ? 'btn-done' : 'btn-soft'}`} style={{ marginTop: 8 }} onClick={() => {
              if (inCart) return;
              try {
                const cur = JSON.parse(localStorage.getItem('bubka-plate-shoplist') || '[]') as string[];
                const added = recipe.items!.filter((it) => !cur.includes(it));
                localStorage.setItem('bubka-plate-shoplist', JSON.stringify([...cur, ...added]));
                setInCart(true);
                showToast('🛒', `+${added.length} в список покупок`, 'Список — под значком 🛒 вверху раздела «Рецепты»');
              } catch { /* ignore */ }
            }}>{inCart ? '✓ Добавлено · список под 🛒 в «Рецептах»' : '🛒 В список покупок'}</button>
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
        <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => { onClose(); showToast('🥣', 'Приготовили!', 'Записано в дневник прикорма'); }}>
          Приготовили ✓
        </button>
      </div>

      {foodOpen && <ProductSheet food={foodOpen} elevated onClose={() => setFoodOpen(null)} />}
    </div>,
    document.body,
  );
}
