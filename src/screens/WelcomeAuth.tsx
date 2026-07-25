import { useState } from 'react';
import { useAuth } from '../lib/auth';
import './Onboarding.css';

/** Стартовый экран: регистрация/вход сразу, либо «без аккаунта». Показывается до онбординга. */
export function WelcomeAuth({ onSkip }: { onSkip: () => void }) {
  const { signUp, signIn, signInWith } = useAuth();
  const [emailMode, setEmailMode] = useState(false);
  const [mode, setMode] = useState<'in' | 'up'>('up');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const submit = async () => {
    setMsg(null); setOk(null);
    if (!email.trim() || pass.length < 6) { setMsg('Введите почту и пароль от 6 символов'); return; }
    setBusy(true);
    const err = mode === 'up' ? await signUp(email.trim(), pass) : await signIn(email.trim(), pass);
    setBusy(false);
    if (err) { setMsg(err.includes('already registered') ? 'Эта почта уже занята — войдите' : err); return; }
    if (mode === 'up') setOk('Аккаунт создан! Если попросят — подтвердите почту, затем войдите.');
    // при успешном входе AuthProvider сам подтянет данные и перезагрузит
  };

  return (
    <div className="onb wa">
      <div className="wa-top">
        <div className="onb-logo">🍽️</div>
        <div className="onb-brand">bubka plate</div>
        <div className="wa-tagline">Прикорм без тревог — безопасная подача, рецепты и дневник малыша</div>
      </div>

      <div className="wa-body">
        {!emailMode ? (
          <>
            <button className="acc-oauth google" onClick={() => signInWith('google')}>
              <span className="acc-oauth-g">G</span> Продолжить с Google
            </button>
            <button className="acc-oauth apple" onClick={() => signInWith('apple')}>
               Продолжить с Apple
            </button>
            <button className="acc-oauth" onClick={() => { setEmailMode(true); setMode('up'); }}>
              ✉️ Зарегистрироваться по почте
            </button>
            <div className="acc-or"><span>первый раз?</span></div>
            <div className="wa-why">Аккаунт нужен, чтобы дневник хранился в облаке и открывался на телефоне мамы и папы. Данные под защитой — их видите только вы.</div>
          </>
        ) : (
          <>
            <input className="em-input" style={{ width: '100%', marginBottom: 8 }} type="email" inputMode="email" autoCapitalize="none"
              placeholder="Почта" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="em-input" style={{ width: '100%' }} type="password"
              placeholder="Пароль (от 6 символов)" value={pass} onChange={(e) => setPass(e.target.value)} />
            {msg && <div className="acc-msg err">{msg}</div>}
            {ok && <div className="acc-msg ok">{ok}</div>}
            <button className="btn btn-primary" style={{ marginTop: 10, width: '100%' }} disabled={busy} onClick={submit}>
              {busy ? '…' : mode === 'up' ? 'Создать аккаунт' : 'Войти'}
            </button>
            <button className="acc-switch" onClick={() => { setMode(mode === 'up' ? 'in' : 'up'); setMsg(null); setOk(null); }}>
              {mode === 'up' ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
            </button>
            <button className="acc-switch" onClick={() => setEmailMode(false)}>‹ Назад к вариантам входа</button>
          </>
        )}
      </div>

      <div className="wa-foot">
        <button className="wa-skip" onClick={() => {
          if (confirm('Без аккаунта дневник хранится только на этом устройстве:\n\n• не синхронизируется с другими устройствами\n• может пропасть, если очистить браузер или удалить приложение\n• не восстановится при потере телефона\n\nПродолжить без аккаунта?')) onSkip();
        }}>Попробовать без аккаунта →</button>
        <div className="wa-skip-note">Данные останутся только на этом устройстве. Аккаунт можно создать позже в настройках.</div>
      </div>

      <style>{`
        .wa { justify-content:flex-start; }
        .wa-top { text-align:center; padding:8vh 24px 0; }
        .wa-tagline { font-size:14px; color:var(--text2); line-height:1.5; margin-top:12px; max-width:320px; margin-left:auto; margin-right:auto; }
        .wa-body { padding:32px 24px 0; max-width:400px; margin:0 auto; width:100%; }
        .acc-oauth { display:flex; align-items:center; justify-content:center; gap:9px; width:100%; border:1.5px solid var(--hairline);
          background:var(--card); border-radius:14px; padding:14px; font-family:inherit; font-size:15px; font-weight:700; color:var(--text);
          cursor:pointer; margin-bottom:10px; box-shadow:var(--shadow); }
        .acc-oauth.apple { background:#000; color:#fff; border-color:#000; }
        .acc-oauth-g { font-weight:900; color:#4285F4; }
        .acc-or { display:flex; align-items:center; gap:10px; margin:8px 0 12px; color:var(--text2); font-size:12px; }
        .acc-or::before, .acc-or::after { content:''; flex:1; height:1px; background:var(--hairline); }
        .wa-why { font-size:12.5px; color:var(--text2); line-height:1.5; text-align:center; }
        .acc-switch { display:block; margin:12px auto 0; border:none; background:none; font-family:inherit; font-size:13px; font-weight:700; color:var(--accent); cursor:pointer; }
        .acc-msg { font-size:12px; margin-top:8px; padding:8px 10px; border-radius:10px; line-height:1.4; }
        .acc-msg.err { background:color-mix(in srgb, var(--danger) 10%, transparent); color:var(--danger); }
        .acc-msg.ok { background:var(--accent-soft); color:var(--accent); }
        .wa-foot { margin-top:auto; padding:24px; text-align:center; }
        .wa-skip { border:none; background:none; font-family:inherit; font-size:15px; font-weight:750; color:var(--text); cursor:pointer; }
        .wa-skip-note { font-size:11.5px; color:var(--text2); line-height:1.45; margin-top:8px; max-width:300px; margin-left:auto; margin-right:auto; }
      `}</style>
    </div>
  );
}
