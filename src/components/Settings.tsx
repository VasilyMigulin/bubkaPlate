import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../state/store';
import { Paywall, isPremium } from './Paywall';
import type { FeedingApproach } from '../types';

const APPROACHES: { key: FeedingApproach; label: string }[] = [
  { key: 'puree', label: '🥄 Пюре' },
  { key: 'blw', label: '✋ Кусочки' },
  { key: 'both', label: '🤝 И то и то' },
];

/** Настройки: профиль малыша, подписка, о приложении. */
export function Settings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, setProfile, resetAll, showToast } = useStore();
  const [pwOpen, setPwOpen] = useState(false);
  const [prem, setPrem] = useState(isPremium());
  const [name, setName] = useState(profile?.name ?? '');
  const [birth, setBirth] = useState(profile?.birthDate ?? '');
  const [approach, setApproach] = useState<FeedingApproach>(profile?.approach ?? 'both');

  if (!open || !profile) return null;

  const save = () => {
    if (!name.trim() || !birth) return;
    setProfile({ ...profile, name: name.trim(), birthDate: birth, approach });
    showToast('✓', 'Сохранено', 'Профиль обновлён');
    onClose();
  };

  return createPortal(
    <div className="sheet-scrim" style={{ zIndex: 72 }} onClick={onClose}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <div className="bs-title">⚙️ Настройки</div>

        <div className="bs-label">Малыш</div>
        <div className="set-ava">👶</div>
        <input className="em-input" style={{ width: '100%', marginBottom: 8 }} placeholder="Имя малыша"
          value={name} onChange={(e) => setName(e.target.value)} />
        <input className="em-input" style={{ width: '100%', marginBottom: 8 }} type="date"
          value={birth} onChange={(e) => setBirth(e.target.value)} />
        <div className="exc-grid" style={{ marginTop: 2 }}>
          {APPROACHES.map((a) => (
            <button key={a.key} className={`chip ${approach === a.key ? 'on' : ''}`} onClick={() => setApproach(a.key)}>{a.label}</button>
          ))}
        </div>
        <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={save}>Сохранить</button>

        <div className="bs-label">Подписка</div>
        <button className="set-row" onClick={() => setPwOpen(true)}>
          <span className="set-e">✨</span>
          <span className="grow">
            <b>bubka+</b>
            <span className="set-s">{prem ? 'Активна · спасибо, что вы с нами 💛' : 'Все рецепты, планы и обновления'}</span>
          </span>
          <span className="set-chev">›</span>
        </button>

        <div className="bs-label">О приложении</div>
        <div className="set-about">
          <p><b>bubka plate</b> · прикорм с любовью · v1.0</p>
          <p>Правила подачи — по справочнику «Азбука безопасной подачи» (спасибо @kat.atlashova за разрешение использовать материалы) и рекомендациям ВОЗ, AAP, NHS, Solid Starts.</p>
          <p>Приложение носит ознакомительный характер и не заменяет консультацию врача.</p>
        </div>

        <button className="set-danger" onClick={() => {
          if (confirm('Точно сбросить все данные? Дневник, введённые продукты и настройки будут удалены.')) { resetAll(); onClose(); }
        }}>Сбросить все данные</button>

        <Paywall open={pwOpen} onClose={() => setPwOpen(false)} onSuccess={() => setPrem(true)} />

        <style>{`
          .set-ava { width:64px; height:64px; border-radius:50%; background:var(--accent-soft); display:flex; align-items:center;
            justify-content:center; font-size:30px; margin:0 auto 10px; }
          .set-row { display:flex; align-items:center; gap:12px; width:100%; text-align:left; border:none; font-family:inherit;
            background:var(--card); border-radius:16px; padding:13px 14px; box-shadow:var(--shadow); cursor:pointer; }
          .set-e { font-size:22px; }
          .set-row b { font-size:14px; display:block; }
          .set-s { font-size:12px; color:var(--text2); display:block; margin-top:2px; }
          .set-chev { color:var(--text2); font-size:17px; }
          .set-about { background:var(--card); border-radius:16px; padding:13px 14px; box-shadow:var(--shadow); }
          .set-about p { font-size:12.5px; line-height:1.5; color:var(--text2); margin-bottom:6px; }
          .set-about p:first-child { color:var(--text); }
          .set-danger { display:block; margin:16px auto 4px; border:none; background:none; font-family:inherit; font-size:12.5px;
            color:var(--danger); text-decoration:underline dotted; cursor:pointer; }
        `}</style>
      </div>
    </div>,
    document.body,
  );
}
