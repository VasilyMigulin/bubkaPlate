// Фото нарезки по возрастам из справочника «Азбука безопасной подачи» (@kat.atlashova, с разрешения).
// Ключ — id продукта, вложенно — месяц → фото нужной нарезки.
export const SERVE_PHOTOS: Record<string, Record<string, string>> = {
  zucchini: { '6': '/serve/zucchini-6.jpg', '8': '/serve/zucchini-8.jpg', '10': '/serve/zucchini-8.jpg', '12': '/serve/zucchini-8.jpg' },
  apple: { '6': '/serve/apple-10.jpg', '8': '/serve/apple-8.jpg', '10': '/serve/apple-12.jpg', '12': '/serve/apple-6.jpg' },
  apricot: { '6': '/serve/apricot-6.jpg', '8': '/serve/apricot-8.jpg' },
  avocado: { '6': '/serve/avocado-6.jpg', '8': '/serve/avocado-8.jpg', '18': '/serve/avocado-18.jpg' },
  pineapple: { '6': '/serve/pineapple-6.jpg', '8': '/serve/pineapple-8.jpg', '12': '/serve/pineapple-12.jpg' },
  orange: { '6': '/serve/orange-6.jpg', '8': '/serve/orange-8.jpg', '12': '/serve/orange-12.jpg' },
  peanut: { '6': '/serve/peanut-paste.jpg', '8': '/serve/peanut-paste.jpg', '12': '/serve/peanut-paste.jpg', '48': '/serve/peanut-whole.jpg' },
  grape: { '6': '/serve/grape-6.jpg', '48': '/serve/grape-48.jpg' },
  cherry: { '6': '/serve/cherry-6.jpg', '48': '/serve/cherry-48.jpg' },
  sweetcherry: { '6': '/serve/cherry-6.jpg', '48': '/serve/cherry-48.jpg' },
  melon: { '6': '/serve/melon-6.jpg', '8': '/serve/melon-8.jpg', '12': '/serve/melon-12.jpg' },
  watermelon: { '6': '/serve/watermelon-6.jpg', '8': '/serve/watermelon-8.jpg', '12': '/serve/watermelon-12.jpg' },
  pear: { '6': '/serve/pear-6.jpg', '8': '/serve/pear-8.jpg', '12': '/serve/pear-12.jpg' },
  mushroom: { '6': '/serve/mushroom-6.jpg', '8': '/serve/mushroom-8.jpg', '12': '/serve/mushroom-12.jpg' },
  beef: { '6': '/serve/beef-6.jpg', '8': '/serve/beef-8.jpg', '12': '/serve/beef-12.jpg' },
  pomegranate: { '6': '/serve/pomegranate-6.jpg', '8': '/serve/pomegranate-8.jpg', '12': '/serve/pomegranate-8.jpg' },
  buckwheat: { '6': '/serve/buckwheat-6.jpg', '8': '/serve/buckwheat-8.jpg', '12': '/serve/buckwheat-12.jpg' },
};
