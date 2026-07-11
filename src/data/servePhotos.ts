// Фото нарезки по возрастам из справочника «Азбука безопасной подачи» (@kat.atlashova, с разрешения).
// Ключ — id продукта, вложенно — месяц → фото нужной нарезки.
export const SERVE_PHOTOS: Record<string, Record<string, string>> = {
  zucchini: { '6': '/serve/zucchini-6.jpg', '8': '/serve/zucchini-8.jpg', '10': '/serve/zucchini-8.jpg', '12': '/serve/zucchini-8.jpg' },
  apple: { '6': '/serve/apple-10.jpg', '8': '/serve/apple-8.jpg', '10': '/serve/apple-12.jpg', '12': '/serve/apple-6.jpg' },
  apricot: { '6': '/serve/apricot-6.jpg', '8': '/serve/apricot-8.jpg' },
  avocado: { '6': '/serve/avocado-6.jpg', '8': '/serve/avocado-8.jpg', '18': '/serve/avocado-18.jpg' },
};
