import { useState } from 'react';
import { useStore } from '../state/store';
import type { FeedingApproach } from '../types';
import './Onboarding.css';

const APPROACHES: { key: FeedingApproach; e: string; title: string; sub: string }[] = [
  { key: 'puree', e: '🥣', title: 'Пюре с ложки', sub: 'Классический педиатрический прикорм' },
  { key: 'blw', e: '✋', title: 'Кусочки (BLW)', sub: 'Педагогический — малыш ест сам' },
  { key: 'both', e: '🥣✋', title: 'Совмещаю', sub: 'И пюре, и кусочки' },
];

export function Onboarding() {
  const { setProfile } = useStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [birth, setBirth] = useState('');
  const [approach, setApproach] = useState<FeedingApproach>('both');

  const next = () => {
    if (step === 0) {
      if (!name.trim()) return;
      setStep(1);
    } else if (step === 1) {
      if (!birth) return;
      setStep(2);
    } else {
      setProfile({ name: name.trim(), birthDate: birth, approach, started: true });
    }
  };

  return (
    <div className="onb">
      <div className="onb-top">
        <div className="onb-logo">🍽️</div>
        <div className="onb-brand">bubka plate</div>
      </div>

      <div className="onb-body">
        {step === 0 && (
          <div className="onb-step">
            <h1>Как зовут малыша?</h1>
            <p>Познакомимся — и настроим прикорм под ваш возраст.</p>
            <input className="onb-input" autoFocus placeholder="Имя малыша" value={name}
              onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && next()} />
          </div>
        )}
        {step === 1 && (
          <div className="onb-step">
            <h1>Когда {name.trim()} родился?</h1>
            <p>Возраст — главный фильтр: покажем только то, что подходит сейчас.</p>
            <input className="onb-input" type="date" value={birth} onChange={(e) => setBirth(e.target.value)} />
          </div>
        )}
        {step === 2 && (
          <div className="onb-step">
            <h1>Как вы кормите?</h1>
            <p>От этого зависят советы по подаче. Можно поменять позже.</p>
            <div className="onb-opts">
              {APPROACHES.map((a) => (
                <button key={a.key} className={`onb-opt ${approach === a.key ? 'on' : ''}`} onClick={() => setApproach(a.key)}>
                  <span className="onb-opt-e">{a.e}</span>
                  <span className="grow"><b>{a.title}</b><span className="onb-opt-s">{a.sub}</span></span>
                  <span className="onb-radio">{approach === a.key ? '●' : '○'}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="onb-foot">
        <div className="onb-dots">{[0, 1, 2].map((i) => <span key={i} className={i === step ? 'on' : ''} />)}</div>
        <button className="btn btn-primary" onClick={next}>{step === 2 ? 'Начать 🎉' : 'Дальше'}</button>
        {step > 0 && <button className="onb-back" onClick={() => setStep((s) => s - 1)}>Назад</button>}
      </div>
    </div>
  );
}
