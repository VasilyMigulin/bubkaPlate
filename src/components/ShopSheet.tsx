import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../state/store';

const SHOP_KEY = 'bubka-plate-shoplist';

export function readShop(): string[] {
  try { return JSON.parse(localStorage.getItem(SHOP_KEY) || '[]') as string[]; } catch { return []; }
}

/** Рисуем список покупок красивой карточкой — для «поделиться» (мужу, бабушке…). */
async function shareAsImage(items: string[], showToast: (e: string, t: string, s?: string) => void) {
  const W = 1080;
  const pad = 90;
  const lineH = 66;
  const headH = 300;
  const footH = 320;
  const H = headH + items.length * lineH + footH;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d')!;
  // фон
  x.fillStyle = '#FBF6EE'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#F1E7D8'; x.fillRect(0, 0, W, 12); x.fillRect(0, H - 12, W, 12);
  // заголовок
  x.fillStyle = '#2E2A24';
  x.font = '700 64px -apple-system, "SF Pro Display", Segoe UI, sans-serif';
  x.fillText('🛒 Список покупок', pad, 150);
  x.font = '400 34px -apple-system, sans-serif';
  x.fillStyle = '#8A8072';
  x.fillText('для маленького гурмана', pad, 210);
  // позиции
  x.font = '400 40px -apple-system, sans-serif';
  items.forEach((it, i) => {
    const y = headH + i * lineH;
    x.fillStyle = '#7A9B5E';
    x.beginPath(); x.arc(pad + 12, y - 12, 10, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#2E2A24';
    x.fillText(it.length > 46 ? it.slice(0, 45) + '…' : it, pad + 48, y);
  });
  // подпись
  const fy = headH + items.length * lineH + 90;
  x.fillStyle = '#5E5546';
  x.font = 'italic 400 36px -apple-system, sans-serif';
  x.fillText('Хочу приготовить малышу вкусненькое 💛', pad, fy);
  x.fillText('Купи, пожалуйста, всё по списку!', pad, fy + 56);
  x.fillStyle = '#B99B6B';
  x.font = '700 34px -apple-system, sans-serif';
  x.fillText('bubka plate · прикорм с любовью', pad, fy + 150);

  const blob: Blob | null = await new Promise((res) => c.toBlob(res, 'image/png'));
  const text = `🛒 Список покупок:\n${items.map((i) => `• ${i}`).join('\n')}\n\nХочу приготовить малышу вкусненькое из bubka plate 💛 Купи, пожалуйста, всё по списку!`;
  try {
    if (blob) {
      const file = new File([blob], 'bubka-список-покупок.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
        return;
      }
    }
    if (navigator.share) { await navigator.share({ text }); return; }
    await navigator.clipboard.writeText(text);
    showToast('📋', 'Список скопирован', 'Вставьте в любой мессенджер');
  } catch { /* пользователь закрыл шаринг — это ок */ }
}

export function ShopSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { showToast } = useStore();
  const [items, setItems] = useState<string[]>([]);
  useEffect(() => { if (open) setItems(readShop()); }, [open]);
  if (!open) return null;

  const rm = (it: string) => {
    const n = items.filter((x) => x !== it);
    setItems(n); localStorage.setItem(SHOP_KEY, JSON.stringify(n));
  };

  return createPortal(
    <div className="sheet-scrim" style={{ zIndex: 75 }} onClick={onClose}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <div className="bs-title">🛒 Список покупок</div>
        {items.length === 0 && <div className="sub" style={{ padding: '10px 0 16px' }}>Пока пусто. Откройте рецепт и нажмите «В список покупок».</div>}
        <ul className="shop-list">
          {items.map((it) => (
            <li key={it}>
              <span>{it}</span>
              <button onClick={() => rm(it)} aria-label="Убрать">✕</button>
            </li>
          ))}
        </ul>
        {items.length > 0 && (
          <>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => shareAsImage(items, showToast)}>
              📤 Поделиться списком
            </button>
            <button className="btn btn-soft" style={{ marginTop: 8 }} onClick={() => { setItems([]); localStorage.setItem(SHOP_KEY, '[]'); }}>Очистить список</button>
          </>
        )}
        <button className="btn btn-soft" style={{ marginTop: 8 }} onClick={onClose}>Закрыть</button>
      </div>
    </div>,
    document.body,
  );
}
