import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { looksVideo, resolveMedia } from '../lib/idbMedia';
import './Lightbox.css';

/** Полноэкранный просмотр фото/видео (в т.ч. из IndexedDB). Тап вне — закрыть. */
export function Lightbox({ src, alt, onClose }: { src: string; alt?: string; onClose: () => void }) {
  const [url, setUrl] = useState(() => (src.startsWith('idb:') ? '' : src));
  useEffect(() => {
    let live = true;
    if (src.startsWith('idb:')) resolveMedia(src).then((u) => { if (live) setUrl(u); });
    return () => { live = false; };
  }, [src]);
  return createPortal(
    <div className="lb-scrim" onClick={onClose}>
      <button className="lb-close" onClick={onClose} aria-label="Закрыть">✕</button>
      {url && (looksVideo(src)
        ? <video className="lb-img" src={url} controls autoPlay playsInline onClick={(e) => e.stopPropagation()} />
        : <img className="lb-img" src={url} alt={alt || ''} />)}
      {alt && <div className="lb-cap">{alt}</div>}
    </div>,
    document.body,
  );
}
