import { useState } from 'react';
import { useAuth } from '../lib/auth';

/** Секция аккаунта в настройках: вход/регистрация/выход + статус синхронизации. */
export function AccountSection() {
  const { enabled, user, syncing, signUp, signIn, signOut } = useAuth();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  if (!enabled) {
    return (
      <>
        <div className="bs-label">Аккаунт</div>
        <div className="set-about">
          <p style={{ color: 'var(--text2)' }}>Облачная синхронизация подключается. Пока данные живут на устройстве — переносите их резервной копией ниже.</p>
        </div>
      </>
    );
  }

  if (user) {
    return (
      <>
        <div className="bs-label">Аккаунт</div>
        <div className="set-row" style={{ cursor: 'default' }}>
          <span className="set-e">☁️</span>
          <span className="grow">
            <b>{user.email}</b>
            <span className="set-s">{syncing ? 'Синхронизация…' : 'Данные сохраняются в облаке 💛'}</span>
          </span>
        </div>
        <button className="set-danger" style={{ margin: '10px auto 0' }} onClick={() => { if (confirm('Выйти из аккаунта? Данные останутся на устройстве.')) signOut(); }}>
          Выйти из аккаунта
        </button>
      </>
    );
  }

  const submit = async () => {
    setMsg(null); setOk(null);
    if (!email.trim() || pass.length < 6) { setMsg('Введите почту и пароль от 6 символов'); return; }
    setBusy(true);
    const err = mode === 'up' ? await signUp(email.trim(), pass) : await signIn(email.trim(), pass);
    setBusy(false);
    if (err) { setMsg(err.includes('already registered') ? 'Эта почта уже зарегистрирована — войдите' : err); return; }
    if (mode === 'up') setOk('Готово! Проверьте почту и подтвердите адрес, затем войдите.');
  };

  return (
    <>
      <div className="bs-label">Аккаунт · синхронизация</div>
      <div className="acc-card">
        <div className="acc-lead">{mode === 'in' ? 'Войдите, чтобы данные хранились в облаке и открывались на любом устройстве.' : 'Создайте аккаунт — дневник малыша будет в безопасности и на всех устройствах.'}</div>
        <input className="em-input" style={{ width: '100%', marginBottom: 8 }} type="email" inputMode="email" autoCapitalize="none"
          placeholder="Почта" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="em-input" style={{ width: '100%' }} type="password"
          placeholder="Пароль (от 6 символов)" value={pass} onChange={(e) => setPass(e.target.value)} />
        {msg && <div className="acc-msg err">{msg}</div>}
        {ok && <div className="acc-msg ok">{ok}</div>}
        <button className="btn btn-primary" style={{ marginTop: 10 }} disabled={busy} onClick={submit}>
          {busy ? '…' : mode === 'in' ? 'Войти' : 'Создать аккаунт'}
        </button>
        <button className="acc-switch" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setMsg(null); setOk(null); }}>
          {mode === 'in' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </button>
      </div>

      <style>{`
        .acc-card { background:var(--card); border-radius:18px; padding:15px; box-shadow:var(--shadow); }
        .acc-lead { font-size:12.5px; color:var(--text2); line-height:1.5; margin-bottom:12px; }
        .acc-msg { font-size:12px; margin-top:8px; padding:8px 10px; border-radius:10px; line-height:1.4; }
        .acc-msg.err { background:color-mix(in srgb, var(--danger) 10%, transparent); color:var(--danger); }
        .acc-msg.ok { background:var(--accent-soft); color:var(--accent); }
        .acc-switch { display:block; margin:10px auto 0; border:none; background:none; font-family:inherit;
          font-size:12.5px; font-weight:700; color:var(--accent); cursor:pointer; }
      `}</style>
    </>
  );
}
