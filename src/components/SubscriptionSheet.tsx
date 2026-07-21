import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Paywall, isPremium } from './Paywall';
import { useStore } from '../state/store';

const PREMIUM_KEY = 'bubka-plate-premium';
const PROMO_CODES = ['BUBKA', 'BUBKA2026'];

const FAQ = [
  {
    q: 'Как оплатить на территории РФ',
    a: 'Пока приложение в раннем доступе, подписка в РФ оформляется по промокоду: напишите нам в поддержку — пришлём инструкцию и код после оплаты через сайт. Позже добавим оплату картами РФ прямо в приложении. Будьте внимательны: инструкции по оплате мы отправляем только с официальной почты — предложения «оплатить переводом в чате» присылают мошенники.',
  },
  {
    q: 'Подписка не активировалась',
    a: 'Сначала нажмите «Восстановить покупки» ниже. Если статус не обновился — перезапустите приложение. Всё ещё «не активна»? Напишите в поддержку, приложите чек — активируем вручную в течение дня.',
  },
  {
    q: 'Как отменить подписку',
    a: 'Подписка отменяется в настройках вашего магазина приложений (App Store или Google Play) в разделе «Подписки» — в два тапа, без писем и звонков. Доступ сохранится до конца оплаченного периода.',
  },
  {
    q: 'Как вернуть средства',
    a: 'Возврат делает магазин приложений по своим правилам: в App Store — через reportaproblem.apple.com, в Google Play — через историю заказов. Если что-то не получается, напишите нам — подскажем по шагам.',
  },
  {
    q: 'Есть ли семейный доступ',
    a: 'Планируем: одна подписка на нескольких взрослых (мама, папа, бабушка) с общим дневником малыша. Напишите в поддержку, если ждёте эту функцию, — так мы поймём приоритет.',
  },
];

/** Экран подписки: статус, оформление, промокод, частые вопросы. */
export function SubscriptionSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { showToast } = useStore();
  const [prem, setPrem] = useState(isPremium());
  const [pwOpen, setPwOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [promo, setPromo] = useState('');
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  if (!open) return null;

  const applyPromo = () => {
    if (PROMO_CODES.includes(promo.trim().toUpperCase())) {
      localStorage.setItem(PREMIUM_KEY, '1');
      setPrem(true);
      setPromoOpen(false);
      showToast('💛', 'Промокод принят', 'bubka+ активирована');
    } else {
      showToast('🤔', 'Код не подошёл', 'Проверьте написание или напишите в поддержку');
    }
  };

  const refresh = () => {
    setPrem(isPremium());
    showToast('🔄', 'Статус обновлён', isPremium() ? 'bubka+ активна' : 'Активная подписка не найдена');
  };

  return createPortal(
    <>
    <div className="article-view">
      <button className="ps-back" onClick={onClose} aria-label="Назад">‹</button>
      <div className="sub-head">
        <div className="sub-hero">✨</div>
        <h2>Подписка bubka+</h2>
      </div>
      <div className="sub-body">
        <div className="sub-status">
          <span className="sub-status-e">✨</span>
          <b>bubka+</b>
          <span className={`sub-badge ${prem ? 'on' : ''}`}>{prem ? 'Активна' : 'Не активна'}</span>
        </div>
        <div className="sub-links">
          Уже оформили? <button className="term-link" onClick={refresh}>Обновить статус</button> или <button className="term-link" onClick={() => { showToast('🔄', 'Покупки восстановлены'); refresh(); }}>восстановить покупки</button>
        </div>

        {!prem && (
          <>
            {promoOpen ? (
              <div className="sub-promo">
                <input className="em-input" autoFocus placeholder="Промокод" value={promo} onChange={(e) => setPromo(e.target.value)} />
                <button className="btn btn-primary" style={{ width: 'auto', padding: '0 18px' }} onClick={applyPromo}>Ок</button>
              </div>
            ) : (
              <button className="sub-promo-link" onClick={() => setPromoOpen(true)}>У меня есть промокод</button>
            )}
            <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={() => setPwOpen(true)}>Оформить подписку</button>
          </>
        )}

        {prem && (
          <div className="note" style={{ marginTop: 12 }}>
            <span className="ne">💛</span>
            <span>Спасибо, что вы с нами! Вам открыты все рецепты, планы дня, конструкторы меню и тарелочек — и всё, что мы добавим дальше.</span>
          </div>
        )}

        <div className="section-t" style={{ marginTop: 20 }}>Что входит в bubka+</div>
        <ul className="tips-list">
          <li>Все 220+ проверенных рецептов и новые каждую неделю</li>
          <li>Готовые планы дня и конструктор своего меню</li>
          <li>Тарелочки-конструктор из введённых продуктов</li>
          <li>Новые статьи и материалы без ограничений</li>
        </ul>
        <div className="sub-free">Бесплатно навсегда: каталог всех продуктов с правилами подачи, основы прикорма, план первых 30 дней, дневник и вся безопасность. Это наша принципиальная позиция — безопасность не продаётся.</div>

        <div className="section-t" style={{ marginTop: 18 }}>Частые вопросы</div>
        {FAQ.map((f, i) => (
          <button key={i} className={`sub-faq ${faqOpen === i ? 'open' : ''}`} onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
            <div className="sub-faq-q">{f.q}<span>{faqOpen === i ? '−' : '›'}</span></div>
            {faqOpen === i && <div className="sub-faq-a">{f.a}</div>}
          </button>
        ))}

        <a className="btn btn-soft sub-support" href="mailto:care@bubka.app?subject=bubka+ вопрос">💬 Написать в поддержку</a>
      </div>

      <style>{`
        .sub-head { padding:60px 20px 0; text-align:center; }
        .sub-hero { font-size:44px; }
        .sub-head h2 { font-size:24px; font-weight:750; letter-spacing:-.02em; margin-top:4px; }
        .sub-body { padding:14px 18px calc(30px + env(safe-area-inset-bottom)); }
        .sub-status { display:flex; align-items:center; gap:10px; background:var(--card); border-radius:16px; padding:14px 16px; box-shadow:var(--shadow); }
        .sub-status b { font-size:16px; flex:1; }
        .sub-status-e { font-size:20px; }
        .sub-badge { font-size:11px; font-weight:800; letter-spacing:.04em; padding:5px 12px; border-radius:999px; background:var(--elev); color:var(--text2); }
        .sub-badge.on { background:var(--accent); color:#fff; }
        .sub-links { font-size:12.5px; color:var(--text2); margin:10px 2px 0; line-height:1.5; }
        .sub-promo { display:flex; gap:8px; margin-top:12px; }
        .sub-promo-link { display:block; margin:14px auto 0; border:none; background:none; font-family:inherit; font-size:14px;
          font-weight:700; color:var(--accent); cursor:pointer; }
        .sub-free { font-size:12.5px; color:var(--text2); line-height:1.5; margin-top:10px; background:var(--accent-soft);
          border-radius:14px; padding:12px 14px; }
        .sub-faq { display:block; width:100%; text-align:left; border:none; font-family:inherit; background:var(--card);
          border-radius:14px; padding:13px 14px; box-shadow:var(--shadow); margin-bottom:8px; cursor:pointer; }
        .sub-faq-q { display:flex; justify-content:space-between; align-items:center; font-size:14px; font-weight:700; color:var(--text); gap:10px; }
        .sub-faq-q span { color:var(--accent); font-weight:700; }
        .sub-faq-a { font-size:13px; color:var(--text2); line-height:1.55; margin-top:8px; border-top:1px solid var(--hairline); padding-top:8px; }
        .sub-support { display:block; text-align:center; text-decoration:none; margin-top:14px; }
      `}</style>
    </div>
    <Paywall open={pwOpen} onClose={() => setPwOpen(false)} onSuccess={() => setPrem(true)} />
    </>,
    document.body,
  );
}
