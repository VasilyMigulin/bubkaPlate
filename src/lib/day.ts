// Помощники «живого дня»: приветствие по времени и возраст с точностью до дня.

export function helloNow(): string {
  const h = new Date().getHours();
  return h < 5 ? 'Тихой ночи 🌙' : h < 11 ? 'Доброе утро ☀️' : h < 17 ? 'Добрый день 🌤' : 'Добрый вечер 🌙';
}

export function ageTextOf(birthDate: string, ageMonths: number): string {
  const bd = new Date(birthDate);
  const now = new Date();
  let days = now.getDate() - bd.getDate();
  if (days < 0) days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  if (ageMonths >= 12) return `${Math.floor(ageMonths / 12)} г ${ageMonths % 12} мес`;
  return days > 0 ? `${ageMonths} мес ${days} дн` : `сегодня ровно ${ageMonths} мес 🎉`;
}
