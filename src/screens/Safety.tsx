import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ARTICLES, type Article } from '../data/basics';

const EMERGENCY_KEY = 'bubka-plate-emergency';

/** «База» — мини-статьи об основах прикорма в стиле Apple Tips. */
export function Safety() {
  const [article, setArticle] = useState<Article | null>(null);
  const [emNum, setEmNum] = useState<string>(() => localStorage.getItem(EMERGENCY_KEY) || '');
  const [emEdit, setEmEdit] = useState(false);
  const [emDraft, setEmDraft] = useState('');

  const saveEm = () => {
    const v = emDraft.trim();
    setEmNum(v);
    localStorage.setItem(EMERGENCY_KEY, v);
    setEmEdit(false);
  };

  return (
    <>
      {/* Экстренная карточка — номер задаёт пользователь (международность) */}
      <div className="em-card">
        <div className="em-head">🆘 Экстренный номер</div>
        {emNum && !emEdit ? (
          <div className="em-row">
            <a className="em-call" href={`tel:${emNum}`}>📞 Позвонить · {emNum}</a>
            <button className="em-edit" onClick={() => { setEmDraft(emNum); setEmEdit(true); }} aria-label="Изменить">✎</button>
          </div>
        ) : emEdit ? (
          <div className="em-row">
            <input className="em-input" type="tel" placeholder="Например: 112" value={emDraft}
              onChange={(e) => setEmDraft(e.target.value)} autoFocus />
            <button className="btn btn-primary" style={{ flex: 'none', width: 'auto', padding: '0 18px' }} onClick={saveEm}>Ок</button>
          </div>
        ) : (
          <>
            <div className="em-hint">Сохраните местный номер скорой заранее — чтобы не искать его в момент паники.</div>
            <div className="em-suggest">
              {['112', '911', '103'].map((n) => (
                <button key={n} className="chip" onClick={() => { setEmNum(n); localStorage.setItem(EMERGENCY_KEY, n); }}>{n}</button>
              ))}
              <button className="chip" onClick={() => { setEmDraft(''); setEmEdit(true); }}>другой…</button>
            </div>
          </>
        )}
      </div>

      {/* Список статей — карточки в стиле Apple Tips */}
      {ARTICLES.map((a) => (
        <button key={a.id} className="art-card" onClick={() => setArticle(a)}>
          <div className="art-pic" style={{ background: `radial-gradient(circle at 30% 25%, ${a.bg[0]}, ${a.bg[1]})` }}>{a.e}</div>
          <div className="grow">
            <div className="art-t">{a.t}</div>
            <div className="art-s">{a.sub}</div>
          </div>
          <span className="art-chev">›</span>
        </button>
      ))}

      <div className="note" style={{ marginTop: 14 }}>
        <span className="ne">📚</span>
        <span>Собрано по справочнику безопасной подачи и рекомендациям ВОЗ, AAP, NHS и Solid Starts. Ориентир, а не замена консультации врача.</span>
      </div>

      {/* Полноэкранная статья */}
      {article && createPortal(
        <div className="article-view">
          <button className="ps-back" onClick={() => setArticle(null)} aria-label="Назад">‹</button>
          <div className="art-hero" style={{ background: `radial-gradient(circle at 30% 25%, ${article.bg[0]}, ${article.bg[1]})` }}>
            <span>{article.e}</span>
          </div>
          <div className="art-body">
            <h2>{article.t}</h2>
            <p className="art-lead">{article.lead}</p>
            {article.blocks.map((b, i) => (
              <div key={i}>
                {b.big && <div className="art-big">{b.big}</div>}
                {b.h && <h3 className="art-h">{b.h}</h3>}
                {b.p && <p className="art-p">{b.p}</p>}
                {b.list && (
                  <ul className="art-list">
                    {b.list.map((li, j) => <li key={j}>{li}</li>)}
                  </ul>
                )}
                {b.warn && <div className="art-warn"><span>⚠️</span><span>{b.warn}</span></div>}
                {b.tip && <div className="art-tip"><span>💡</span><span>{b.tip}</span></div>}
              </div>
            ))}
            <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={() => setArticle(null)}>Понятно</button>
          </div>
        </div>,
        document.body,
      )}

      <style>{`
        .em-card { background:color-mix(in srgb, var(--danger) 8%, var(--card)); border-radius:18px; padding:14px 16px; box-shadow:var(--shadow); margin-bottom:16px; }
        .em-head { font-size:13px; font-weight:750; letter-spacing:.04em; margin-bottom:8px; }
        .em-row { display:flex; gap:8px; align-items:center; }
        .em-call { flex:1; text-decoration:none; text-align:center; background:var(--danger); color:#fff; border-radius:14px; padding:13px; font-weight:750; font-size:15px; }
        .em-edit { flex:none; width:40px; height:44px; border:none; border-radius:12px; background:var(--elev); color:var(--text2); font-size:15px; }
        .em-input { flex:1; border:1.5px solid var(--hairline); background:var(--bg); border-radius:12px; padding:11px 14px; font-family:inherit; font-size:15px; color:var(--text); outline:none; }
        .em-hint { font-size:12.5px; color:var(--text2); line-height:1.45; margin-bottom:10px; }
        .em-suggest { display:flex; gap:8px; flex-wrap:wrap; }

        .art-card { display:flex; align-items:center; gap:13px; width:100%; text-align:left; border:none; font-family:inherit;
          background:var(--card); border-radius:18px; padding:12px; box-shadow:var(--shadow); margin-bottom:10px; cursor:pointer;
          transition:transform .18s cubic-bezier(.34,1.56,.64,1); }
        .art-card:active { transform:scale(.97); }
        .art-pic { flex:none; width:56px; height:56px; border-radius:16px; display:flex; align-items:center; justify-content:center; font-size:28px; }
        .art-t { font-size:14.5px; font-weight:700; color:var(--text); letter-spacing:-.01em; }
        .art-s { font-size:12px; color:var(--text2); margin-top:2px; line-height:1.35; }
        .art-chev { flex:none; color:var(--text2); font-size:18px; }

        .article-view { position:fixed; inset:0; z-index:50; max-width:440px; margin:0 auto; background:var(--bg);
          display:flex; flex-direction:column; overflow-y:auto; box-shadow:0 0 0 100vw var(--page);
          animation:pushin .3s cubic-bezier(.3,.7,.3,1) both; }
        .article-view::-webkit-scrollbar { display:none; }
        .art-hero { height:180px; flex:none; display:flex; align-items:center; justify-content:center; font-size:76px; }
        .art-hero span { filter:drop-shadow(0 14px 24px rgba(100,60,20,.25)); }
        .art-body { padding:22px 20px calc(30px + env(safe-area-inset-bottom)); }
        .art-body h2 { font-size:26px; font-weight:750; letter-spacing:-.02em; line-height:1.15; }
        .art-lead { font-size:16px; line-height:1.55; color:var(--text); margin-top:10px; font-weight:550; }
        .art-h { font-size:16.5px; font-weight:750; letter-spacing:-.01em; margin:20px 0 6px; }
        .art-p { font-size:14.5px; line-height:1.6; color:var(--text); }
        .art-list { list-style:none; margin-top:4px; }
        .art-list li { position:relative; padding:6px 0 6px 24px; font-size:14.5px; line-height:1.5; color:var(--text); }
        .art-list li::before { content:'•'; position:absolute; left:6px; color:var(--accent); font-weight:700; }
        .art-big { font-size:38px; text-align:center; letter-spacing:.2em; margin:18px 0 6px; }
        .art-warn, .art-tip { display:flex; gap:10px; border-radius:14px; padding:12px 14px; font-size:13.5px; line-height:1.5; margin-top:12px; }
        .art-warn { background:color-mix(in srgb, var(--danger) 9%, var(--card)); }
        .art-tip { background:color-mix(in srgb, var(--accent) 9%, var(--card)); }
      `}</style>
    </>
  );
}
