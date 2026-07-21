import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../state/store';

const PREMIUM_KEY = 'bubka-plate-premium';

export function isPremium(): boolean {
  try { return localStorage.getItem(PREMIUM_KEY) === '1'; } catch { return false; }
}

/** Экран подписки bubka+. Оплата пока мок — реальный биллинг подключим при упаковке в сторы. */
export function Paywall({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess?: () => void }) {
  const { showToast } = useStore();
  const [tariff, setTariff] = useState<'year' | 'month'>('year');
  if (!open) return null;

  const buy = () => {
    localStorage.setItem(PREMIUM_KEY, '1');
    showToast('💛', 'Добро пожаловать в bubka+', '7 дней бесплатно, отменить можно в любой момент');
    onSuccess?.();
    onClose();
  };

  return createPortal(
    <div className="sheet-scrim" style={{ zIndex: 80 }} onClick={onClose}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <div className="pw-hero">✨</div>
        <div className="pw-title">bubka+</div>
        <div className="sub" style={{ textAlign: 'center', marginBottom: 14 }}>Всё для спокойного прикорма — в одной подписке</div>

        <ul className="pw-list">
          <li>🍲 Все 220+ проверенных рецептов и новые каждую неделю</li>
          <li>🍽 Готовые планы дня и конструктор своего меню</li>
          <li>🛒 Умный список покупок с шарингом</li>
          <li>🥜 Чек-листы введения аллергенов и дневник для врача</li>
          <li>📚 Полная база знаний и новые статьи</li>
        </ul>

        <div className="pw-tariffs">
          <button className={`pw-tariff ${tariff === 'year' ? 'on' : ''}`} onClick={() => setTariff('year')}>
            <span className="pw-badge">выгода 45%</span>
            <b>Год</b>
            <span className="pw-price">1 990 ₽</span>
            <span className="pw-sub">166 ₽/мес</span>
          </button>
          <button className={`pw-tariff ${tariff === 'month' ? 'on' : ''}`} onClick={() => setTariff('month')}>
            <b>Месяц</b>
            <span className="pw-price">299 ₽</span>
            <span className="pw-sub">отмена в любой момент</span>
          </button>
        </div>

        <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={buy}>Попробовать 7 дней бесплатно</button>
        <div className="pw-fine">Затем {tariff === 'year' ? '1 990 ₽ в год' : '299 ₽ в месяц'}. Отменить можно в любой момент.</div>
        <button className="pw-restore" onClick={() => showToast('🔄', 'Покупки восстановлены')}>Восстановить покупки</button>

        <style>{`
          .pw-hero { font-size:44px; text-align:center; }
          .pw-title { font-size:24px; font-weight:800; text-align:center; letter-spacing:-.02em; }
          .pw-list { list-style:none; display:flex; flex-direction:column; gap:9px; margin:4px 0 16px; }
          .pw-list li { font-size:13.5px; line-height:1.45; }
          .pw-tariffs { display:flex; gap:10px; }
          .pw-tariff { position:relative; flex:1; border:2px solid var(--hairline); border-radius:16px; background:var(--card);
            font-family:inherit; padding:14px 10px 12px; display:flex; flex-direction:column; gap:2px; align-items:center; cursor:pointer; }
          .pw-tariff.on { border-color:var(--accent); background:var(--accent-soft); }
          .pw-tariff b { font-size:14px; }
          .pw-price { font-size:17px; font-weight:800; }
          .pw-sub { font-size:10.5px; color:var(--text2); }
          .pw-badge { position:absolute; top:-9px; left:50%; transform:translateX(-50%); background:var(--terra); color:#fff;
            font-size:9.5px; font-weight:800; padding:2px 9px; border-radius:999px; white-space:nowrap; }
          .pw-fine { font-size:11px; color:var(--text2); text-align:center; margin-top:8px; }
          .pw-restore { display:block; margin:10px auto 0; border:none; background:none; font-family:inherit; font-size:12px;
            color:var(--text2); text-decoration:underline dotted; cursor:pointer; }
        `}</style>
      </div>
    </div>,
    document.body,
  );
}
