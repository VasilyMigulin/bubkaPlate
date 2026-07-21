// Поиск по родительским вопросам: тема → куда вести (статьи, продукты, рецепты).
// Слова покрываем корнями, чтобы ловить все формы: «давится / подавился / давиться».

export interface Topic {
  re: RegExp;
  label: string;            // как показать тему в подсказке
  articles?: string[];      // id статей (ARTICLES + POSTS)
  products?: string[];      // id продуктов
  recipeQuery?: string;     // подстрока для поиска рецептов
}

export const TOPICS: Topic[] = [
  { re: /давит|подавил|удушь|кашля|рвотн/i, label: 'Если подавился', articles: ['choking', 'approaches'] },
  { re: /запор|стул|какае|каках|подгузник/i, label: 'Стул и запоры', articles: ['poo'], products: ['prune', 'plum', 'pear'] },
  { re: /понос|диаре/i, label: 'Стул', articles: ['poo'] },
  { re: /не ест|мало ест|отказ|аппетит|выплёв|выплев|играет с ед/i, label: 'Мало ест', articles: ['norms', 'modern'] },
  { re: /аллерг|сыпь|щёк|щек|диатез|высыпан/i, label: 'Аллергия', articles: ['allergy'], products: ['egg', 'peanut', 'cowmilk'] },
  { re: /зуб|прорезыв|дёсн|десн/i, label: 'Зубки', articles: ['start'], recipeQuery: 'эскимо' },
  { re: /соль|сахар|мёд|мед |запрещ|нельзя/i, label: 'Что нельзя', articles: ['forbidden', 'myths'] },
  { re: /вода|пить|поильник|стакан/i, label: 'Вода и питьё', articles: ['norms'], products: ['water'] },
  { re: /желез|анеми|гемоглоб/i, label: 'Железо', articles: ['vitamins'], products: ['beef', 'liver', 'buckwheat', 'lentils'] },
  { re: /витамин|добавк|омега/i, label: 'Витамины', articles: ['vitamins'] },
  { re: /порци|сколько ест|сколько долж|наедает/i, label: 'Порции', articles: ['norms'] },
  { re: /кусоч|кусок|blw|боюсь|страшно|текстур/i, label: 'Кусочки без страха', articles: ['approaches', 'choking'] },
  { re: /с чего нач|как нач|начать|старт|первый прикорм|готовност/i, label: 'С чего начать', articles: ['start', 'approaches'] },
  { re: /молок|смесь|гв |грудно/i, label: 'Молоко и смесь', articles: ['modern'], products: ['cowmilk', 'kefir', 'cottage'] },
  { re: /путешеств|дорог|отпуск|кафе|самолёт|самолет/i, label: 'В поездке', articles: ['post-travel'] },
  { re: /замороз|заготовк|морозил|впрок/i, label: 'Заготовки', articles: ['post-batch'], recipeQuery: 'заготовк' },
  { re: /стульчик|стул для корм/i, label: 'Стульчик', articles: ['post-highchair'] },
  { re: /бабушк|свекров|родствен/i, label: 'Споры о прикорме', articles: ['approaches', 'myths'] },
  { re: /соус|макать|дип/i, label: 'Соусы и дипы', recipeQuery: 'дип' },
];
