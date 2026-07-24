import { useState } from 'react';
import { useStore } from '../state/store';
import { DateWheel } from '../components/DateWheel';
import { BIG_ALLERGENS } from '../data/foods';
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
  const [early, setEarly] = useState(0);
  const [fam, setFam] = useState<string[]>([]);
  const toggleFam = (a: string) => setFam((f) => (f.includes(a) ? f.filter((x) => x !== a) : [...f, a]));
  const extras = { earlyWeeks: early || undefined, famAllergens: fam.length ? fam : undefined };

  const next = () => {
    if (step === 4) {
      setProfile({ name: name.trim(), birthDate: birth, approach, started: true, ...extras });
      return;
    }
    if (step === 0 && !name.trim()) return;
    if (step === 1 && !birth) return;
    setStep(step + 1);
  };

  const startWithBase = () => {
    localStorage.setItem('bubka-plate-start-tab', 'safety');
    localStorage.setItem('bubka-plate-guided', '1');
    setProfile({ name: name.trim(), birthDate: birth, approach, started: true, ...extras });
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
            <DateWheel value={birth} onChange={setBirth} />
            <div className="onb-early">
              <div className="onb-early-l">Родился раньше срока?</div>
              <select className="onb-select" value={early} onChange={(e) => setEarly(Number(e.target.value))}>
                <option value={0}>Нет, в срок (или до 3 недель раньше)</option>
                <option value={4}>Раньше на 4–5 недель</option>
                <option value={7}>Раньше на 6–8 недель</option>
                <option value={10}>Раньше на 9–12 недель</option>
                <option value={14}>Раньше более чем на 12 недель</option>
              </select>
              {early >= 4 && <p className="onb-early-note">Все советы пойдут по скорректированному возрасту — так правильно для торопыжек 💛</p>}
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="onb-step">
            <h1>Прежде чем начнём 🎓</h1>
            <p>Мы собрали самое важное к старту прикорма: 11 коротких статей — признаки готовности, безопасность, аллергены и «сколько он должен есть».</p>
            <div className="onb-base-card">
              <span className="onb-base-e">📚</span>
              <span className="grow"><b>Основы прикорма</b><span className="onb-opt-s">~15 минут чтения · прогресс сохраняется, можно по одной</span></span>
            </div>
            <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={startWithBase}>Читать основы 🎓</button>
          </div>
        )}
        {step === 3 && (
          <div className="onb-step">
            <h1>Аллергии у близких?</h1>
            <p>Если у мамы, папы, братьев или сестёр есть аллергия на что-то из «большой девятки» — эти продукты введём с двойной осторожностью.</p>
            <div className="onb-fam">
              {[...BIG_ALLERGENS].map((a) => (
                <button key={a} className={`chip ${fam.includes(a) ? 'on' : ''}`} onClick={() => toggleFam(a)}>{a}</button>
              ))}
            </div>
            <p className="onb-early-note">{fam.length === 0 ? 'Нет аллергий — просто нажмите «Дальше».' : 'Отметили — в карточках этих продуктов будет усиленное предупреждение.'}</p>
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
        <div className="onb-dots">{[0, 1, 2, 3, 4].map((i) => <span key={i} className={i === step ? 'on' : ''} />)}</div>
        <button className="btn btn-primary" onClick={next}>{step === 4 ? 'Пропустить — начать 🎉' : 'Дальше'}</button>
        {step > 0 && <button className="onb-back" onClick={() => setStep((s) => s - 1)}>Назад</button>}
      </div>
    </div>
  );
}
