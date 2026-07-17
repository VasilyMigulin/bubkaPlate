// Фото пюре-лестницы: продукт → ступень → файл.
// Если у ступени пюре и кусочков одно фото (например, кусочки в 12 мес общие) — ссылаемся на тот же файл из /serve.
export const PUREE_PHOTOS: Record<string, Record<string, string>> = {
  apricot: { '6': '/serve/apricot-puree-6.jpg', '8': '/serve/apricot-puree-8.jpg', '12': '/serve/apricot-12.jpg' },
  avocado: { '6': '/serve/avocado-puree-6.jpg', '8': '/serve/avocado-puree-8.jpg', '12': '/serve/avocado-12.jpg' },
};
