import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../state/store';
import { isPremium } from './Paywall';
import { SubscriptionSheet } from './SubscriptionSheet';
import { DateWheel } from './DateWheel';
import type { FeedingApproach } from '../types';

const APPROACHES: { key: FeedingApproach; label: string }[] = [
  { key: 'puree', label: '🥄 Пюре' },
  { key: 'blw', label: '✋ Кусочки' },
  { key: 'both', label: '🤝 И то и то' },
];

/** Сжимаем фото малыша в маленький квадрат для аватара. */
function compressAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const side = 240;
      const c = document.createElement('canvas');
      c.width = side; c.height = side;
      const x = c.getContext('2d')!;
      const s = Math.min(img.width, img.height);
      x.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, side, side);
      resolve(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/** Настройки: малыши (фото, добавление, переключение), подписка, перенос данных, о приложении. */
export function Settings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, setProfile, children, activeId, addChild, switchChild, removeChild, resetAll, showToast } = useStore();
  const [subOpen, setSubOpen] = useState(false);
  const [prem, setPrem] = useState(isPremium());
  const [name, setName] = useState(profile?.name ?? '');
  const [birth, setBirth] = useState(profile?.birthDate ?? '');
  const [approach, setApproach] = useState<FeedingApproach>(profile?.approach ?? 'both');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBirth, setNewBirth] = useState('');
  const [newApproach, setNewApproach] = useState<FeedingApproach>('both');
  const photoRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  if (!open || !profile) return null;

  const save = () => {
    if (!name.trim() || !birth) return;
    setProfile({ ...profile, name: name.trim(), birthDate: birth, approach });
    showToast('✓', 'Сохранено', 'Профиль обновлён');
    onClose();
  };

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const photo = await compressAvatar(file);
      setProfile({ ...profile, photo });
      showToast('📸', 'Фото обновлено');
    } catch { showToast('🤔', 'Не удалось загрузить фото'); }
  };

  const doAddChild = () => {
    if (!newName.trim() || !newBirth) return;
    addChild({ name: newName.trim(), birthDate: newBirth, approach: newApproach, started: true });
    setAdding(false); setNewName(''); setNewBirth('');
    showToast('👶', `${newName.trim()} добавлен`, 'Переключились на нового малыша');
    onClose();
  };

  const switchTo = (id: string) => {
    if (id === activeId) return;
    switchChild(id);
    showToast('🔄', 'Малыш переключён');
    onClose();
  };

  const exportData = () => {
    const dump: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (k.startsWith('bubka-plate')) dump[k] = localStorage.getItem(k)!;
    }
    const blob = new Blob([JSON.stringify({ app: 'bubka-plate', exported: new Date().toISOString(), data: dump }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bubka-backup.json';
    a.click();
    showToast('💾', 'Копия скачана', 'Файл можно открыть на другом устройстве');
  };

  const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { app?: string; data?: Record<string, string> };
      if (parsed.app !== 'bubka-plate' || !parsed.data) throw new Error('bad');
      Object.entries(parsed.data).forEach(([k, v]) => localStorage.setItem(k, v));
      location.reload();
    } catch { showToast('🤔', 'Файл не похож на копию bubka plate'); }
  };

  return createPortal(
    <>
    <div className="sheet-scrim" onClick={onClose}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <div className="bs-title">⚙️ Настройки</div>

        <div className="bs-label">Малыши</div>
        <div className="kids-row">
          {children.map((c) => (
            <button key={c.id} className={`kid-chip ${c.id === activeId ? 'on' : ''}`} onClick={() => switchTo(c.id)}>
              {c.profile.photo ? <img src={c.profile.photo} alt={c.profile.name} /> : <span>👶</span>}
              {c.profile.name}
            </button>
          ))}
          <button className="kid-chip add" onClick={() => setAdding(!adding)}>+ малыш</button>
        </div>
        {adding && (
          <div className="kid-add">
            <input className="em-input" style={{ width: '100%', marginBottom: 8 }} placeholder="Имя малыша"
              value={newName} onChange={(e) => setNewName(e.target.value)} />
            <div style={{ marginBottom: 8 }}><DateWheel value={newBirth} onChange={setNewBirth} /></div>
            <div className="exc-grid">
              {APPROACHES.map((a) => (
                <button key={a.key} className={`chip ${newApproach === a.key ? 'on' : ''}`} onClick={() => setNewApproach(a.key)}>{a.label}</button>
              ))}
            </div>
            <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={doAddChild}>Добавить малыша</button>
          </div>
        )}

        <div className="bs-label">Профиль: {profile.name}</div>
        <button className="set-ava" onClick={() => photoRef.current?.click()} aria-label="Сменить фото">
          {profile.photo ? <img src={profile.photo} alt={profile.name} /> : <span>👶</span>}
          <span className="set-ava-edit">📷</span>
        </button>
        <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPhoto} />
        <input className="em-input" style={{ width: '100%', marginBottom: 8 }} placeholder="Имя малыша"
          value={name} onChange={(e) => setName(e.target.value)} />
        <div style={{ marginBottom: 8 }}><DateWheel value={birth} onChange={setBirth} /></div>
        <div className="exc-grid" style={{ marginTop: 2 }}>
          {APPROACHES.map((a) => (
            <button key={a.key} className={`chip ${approach === a.key ? 'on' : ''}`} onClick={() => setApproach(a.key)}>{a.label}</button>
          ))}
        </div>
        <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={save}>Сохранить</button>
        {children.length > 1 && (
          <button className="set-danger" style={{ margin: '10px auto 0' }} onClick={() => {
            if (confirm(`Удалить профиль «${profile.name}» со всеми записями?`)) { removeChild(activeId!); onClose(); }
          }}>Удалить этого малыша</button>
        )}

        <div className="bs-label">Подписка</div>
        <button className="set-row" onClick={() => { setPrem(isPremium()); setSubOpen(true); }}>
          <span className="set-e">✨</span>
          <span className="grow">
            <b>bubka+</b>
            <span className="set-s">{prem ? 'Активна · спасибо, что вы с нами 💛' : 'Все рецепты, планы и обновления'}</span>
          </span>
          <span className="set-chev">›</span>
        </button>

        <div className="bs-label">Данные</div>
        <button className="set-row" onClick={exportData}>
          <span className="set-e">💾</span>
          <span className="grow">
            <b>Скачать резервную копию</b>
            <span className="set-s">Дневник, малыши, настройки — одним файлом</span>
          </span>
        </button>
        <button className="set-row" style={{ marginTop: 8 }} onClick={() => importRef.current?.click()}>
          <span className="set-e">📥</span>
          <span className="grow">
            <b>Восстановить из копии</b>
            <span className="set-s">Перенос на новое устройство</span>
          </span>
        </button>
        <input ref={importRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={importData} />
        <div className="sub" style={{ margin: '8px 2px 0', lineHeight: 1.45 }}>
          Аккаунты и облачная синхронизация — в разработке. Пока данные живут на устройстве, а перенести их можно файлом копии.
        </div>

        <div className="bs-label">О приложении</div>
        <div className="set-about">
          <p><b>bubka plate</b> · прикорм с любовью · v1.0</p>
          <p>Правила подачи основаны на современных рекомендациях ВОЗ, AAP, NHS и данных исследований.</p>
          <p>Приложение носит ознакомительный характер и не заменяет консультацию врача.</p>
        </div>

        <button className="set-danger" onClick={() => {
          if (confirm('Точно сбросить все данные? Дневник, введённые продукты и настройки будут удалены.')) { resetAll(); onClose(); }
        }}>Сбросить все данные</button>

        <style>{`
          .kids-row { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:6px; }
          .kid-chip { display:flex; align-items:center; gap:7px; border:1.5px solid var(--hairline); background:var(--card);
            border-radius:999px; padding:7px 14px 7px 8px; font-family:inherit; font-size:13px; font-weight:650; color:var(--text); cursor:pointer; }
          .kid-chip.on { border-color:var(--accent); background:var(--accent-soft); }
          .kid-chip img { width:26px; height:26px; border-radius:50%; object-fit:cover; }
          .kid-chip span { font-size:17px; }
          .kid-chip.add { color:var(--accent); font-weight:700; padding:7px 14px; }
          .kid-add { background:var(--elev); border-radius:16px; padding:12px; margin-bottom:8px; }
          .set-ava { position:relative; display:flex; width:72px; height:72px; border-radius:50%; background:var(--accent-soft);
            align-items:center; justify-content:center; font-size:32px; margin:0 auto 10px; border:none; cursor:pointer; padding:0; }
          .set-ava img { width:100%; height:100%; border-radius:50%; object-fit:cover; }
          .set-ava-edit { position:absolute; right:-4px; bottom:-2px; width:26px; height:26px; border-radius:50%;
            background:var(--card); box-shadow:var(--shadow); font-size:13px; display:flex; align-items:center; justify-content:center; }
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
    </div>
    <SubscriptionSheet open={subOpen} onClose={() => { setSubOpen(false); setPrem(isPremium()); }} />
    </>,
    document.body,
  );
}
