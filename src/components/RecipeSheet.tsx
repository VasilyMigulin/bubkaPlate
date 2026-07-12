import { createPortal } from 'react-dom';
import type { Recipe } from '../data/recipes';
import { useStore } from '../state/store';

/** Полноэкранная карточка рецепта (портал — работает из каталога и из карточки продукта). */
export function RecipeSheet({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const { showToast } = useStore();
  return createPortal(
    <div className="recipe-view">
      <button className="ps-back" onClick={onClose} aria-label="Назад">‹</button>
      <div className="recipe-hero" style={{ background: recipe.bg }}>{recipe.e}</div>
      <div className="recipe-body">
        <h2>{recipe.n}</h2>
        <div className="rm" style={{ marginTop: 8 }}>
          <span className="tag green">{recipe.age} мес</span>
          <span className="tag">{recipe.time}</span>
          {recipe.ing.map((i) => <span key={i} className="tag">{i}</span>)}
        </div>
        <div className="section-t">Шаги</div>
        {recipe.steps.map((s, i) => (
          <div key={i} className="step"><div className="step-n">{i + 1}</div><div className="step-t">{s}</div></div>
        ))}
        <div className="note" style={{ marginTop: 10 }}><span className="ne">💡</span><span>{recipe.note}</span></div>
        <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => { onClose(); showToast('🥣', 'Приготовили!', 'Записано в дневник прикорма'); }}>
          Приготовили ✓
        </button>
      </div>
    </div>,
    document.body,
  );
}
