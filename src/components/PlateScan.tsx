import { useState } from 'react';
import { createPortal } from 'react-dom';
import './PlateScan.css';

type Phase = 'start' | 'scanning' | 'result';

const CHECKS = [
  { e: '✅', t: 'Брокколи — соцветие «за ножку»', s: 'Отличная форма для 6 мес: удобно держать, легко откусывать.' },
  { e: '⚠️', t: 'Курица нарезана крупным кубиком', s: 'Для 6 мес безопаснее паштет или крупная полоска в кулаке. Кубик — риск подавиться.' },
  { e: '✅', t: 'Рис — липкий комок, не рассыпается', s: 'Ок. Рассыпчатые зёрна давайте ближе к 9 мес.' },
  { e: '💚', t: 'Овощ + белок с железом — хорошо', s: 'Добавьте пару капель масла к брокколи — витамины усвоятся лучше.' },
];

export function PlateScan({ onClose, goSafety }: { onClose: () => void; goSafety: () => void }) {
  const [phase, setPhase] = useState<Phase>('start');

  const scan = () => {
    setPhase('scanning');
    setTimeout(() => setPhase('result'), 1200);
  };

  return createPortal(
    <div className="sheet-scrim" onClick={onClose}>
      <div className="plate-sheet" onClick={(e) => e.stopPropagation()}>
        <button className="ps-back" onClick={onClose} aria-label="Назад">‹</button>
        <div className="plate-head">
          <div className="plate-emoji">📸</div>
          <h2>Проверка тарелки</h2>
          <p>Сфотографируйте тарелку — ИИ проверит нарезку, возраст и баланс.</p>
        </div>

        {phase === 'start' && (
          <div className="plate-inner">
            <div className="plate-photo">🍽️</div>
            <button className="btn btn-primary" onClick={scan}>📷 Сфотографировать тарелку</button>
            <button className="btn btn-soft" style={{ marginTop: 8 }} onClick={scan}>🖼 Выбрать из галереи</button>
            <div className="plate-note">ИИ не заменяет врача. Проверка — помощь, а не гарантия: рядом с едой всегда взрослый.</div>
          </div>
        )}

        {phase === 'scanning' && (
          <div className="plate-inner">
            <div className="plate-photo">🍽️<span className="scan-badge">анализ…</span></div>
            <div className="sub" style={{ textAlign: 'center', padding: '16px 0' }}>✦ ИИ распознаёт продукты…</div>
          </div>
        )}

        {phase === 'result' && (
          <div className="plate-inner rise">
            <div className="plate-photo">🥦🍗🍚</div>
            <div className="plate-pill">✦ Распознано: брокколи, курица, рис · возраст 6–7 мес</div>
            <div className="section-t" style={{ marginTop: 0 }}>Проверка безопасности и баланса</div>
            {CHECKS.map((c, i) => (
              <div key={i} className="plate-check">
                <span className="pce">{c.e}</span>
                <div><div className="pct">{c.t}</div><div className="pcs">{c.s}</div></div>
              </div>
            ))}
            <button className="btn btn-primary" style={{ marginTop: 6 }} onClick={() => { onClose(); goSafety(); }}>Как безопасно резать курицу ›</button>
            <button className="btn btn-soft" style={{ marginTop: 8 }} onClick={() => setPhase('start')}>📷 Проверить другую тарелку</button>
            <div className="plate-note">Демо-распознавание. ИИ помогает, но не заменяет ваш присмотр и врача.</div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
