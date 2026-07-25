import { useEffect, useState } from 'react';
import { looksVideo, resolveMedia } from '../lib/idbMedia';

/** Универсальное превью медиа: сам разрешает idb-ссылки в object URL, рисует фото или видео. */
export function Media({ src, className, onClick, alt }: { src: string; className?: string; onClick?: () => void; alt?: string }) {
  const [url, setUrl] = useState(() => (src.startsWith('idb:') ? '' : src));
  useEffect(() => {
    let live = true;
    if (src.startsWith('idb:')) resolveMedia(src).then((u) => { if (live) setUrl(u); });
    else setUrl(src);
    return () => { live = false; };
  }, [src]);

  if (!url) return <div className={className} style={{ background: 'var(--elev)' }} onClick={onClick} />;
  return looksVideo(src)
    ? <video className={className} src={url} muted playsInline onClick={onClick} />
    : <img className={className} src={url} alt={alt || 'момент'} onClick={onClick} />;
}
