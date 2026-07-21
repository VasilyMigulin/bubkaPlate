import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Article } from '../data/basics';

/** Полноэкранный просмотр статьи. footer — свои кнопки снизу (по умолчанию «Понятно»). */
export function ArticleView({ article, onClose, footer }: { article: Article; onClose: () => void; footer?: ReactNode }) {
  return createPortal(
    <div className="article-view">
      <button className="ps-back" onClick={onClose} aria-label="Назад">‹</button>
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
        {footer ?? <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={onClose}>Понятно</button>}
      </div>

      <style>{`
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
    </div>,
    document.body,
  );
}
