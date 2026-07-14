import { createPortal } from 'react-dom';
import './Lightbox.css';

/** Полноэкранный просмотр фото: тап по фото в приложении — открыть крупно, тап в любом месте — закрыть. */
export function Lightbox({ src, alt, onClose }: { src: string; alt?: string; onClose: () => void }) {
  return createPortal(
    <div className="lb-scrim" onClick={onClose}>
      <button className="lb-close" onClick={onClose} aria-label="Закрыть">✕</button>
      <img className="lb-img" src={src} alt={alt || ''} />
      {alt && <div className="lb-cap">{alt}</div>}
    </div>,
    document.body,
  );
}
