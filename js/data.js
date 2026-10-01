/* Маълумот: категорияҳо, маҳсулот, баннерҳо, шарҳҳо */
(function () {
  'use strict';

  var CATEGORIES = [
    { id: 'cookware', name: 'Тоба ва дег', icon: 'pot', hue: 152 },
    { id: 'knives', name: 'Корд ва табақ', icon: 'knife', hue: 12 },
    { id: 'appliances', name: 'Техникаи ошхона', icon: 'blender', hue: 262 },
    { id: 'tableware', name: 'Сервировка', icon: 'plate', hue: 190 },
    { id: 'storage', name: 'Нигоҳдории хӯрок', icon: 'container', hue: 38 },
    { id: 'textile', name: 'Матои ошхона', icon: 'apron', hue: 330 },
    { id: 'tea', name: 'Чой ва қаҳва', icon: 'teapot', hue: 96 },
    { id: 'bake', name: 'Барои хӯроки ширин', icon: 'baking', hue: 320 }
  ];

  var P = function (id, name, brand, cat, price, old, rating, reviews, art, opts) {
    opts = opts || {};
    return {
      id: id, name: name, brand: brand, cat: cat,
      price: price, old: old || 0, rating: rating, reviews: reviews,
      art: art, hue: opts.hue != null ? opts.hue : 152,
      badges: opts.badges || [], stock: opts.stock != null ? opts.stock : (2 + (id % 23)),
      sold: opts.sold || 20 + (id * 37) % 900,
      variants: opts.variants || null,
      desc: opts.desc || '', specs: opts.specs || {}, weight: opts.weight || '',
      country: opts.country || 'Россия', warranty: opts.warranty || '12 моҳ',
      added: opts.added || '2026-0' + (1 + (id % 8)) + '-1' + (id % 9)
    };
  };

  var VARIANTS_COLORS = [
    [{ n: 'Сиёҳ', c: '#1F2937' }, { n: 'Асосӣ', c: '#059669' }, { n: 'Сурх', c: '#DC2626' }],
    [{ n: '20 см', c: '#059669' }, { n: '24 см', c: '#0891B2' }, { n: '28 см', c: '#EA580C' }],
    [{ n: '1 л', c: '#059669' }, { n: '1,7 л', c: '#0891B2' }, { n: '2 л', c: '#EA580C' }],
    [{ n: 'Чӯбин', c: '#B45309' }, { n: 'Сафед', c: '#E5E7EB' }, { n: 'Сиёҳ', c: '#374151' }],
    [{ n: 'Мато', c: '#EA580C' }, { n: 'Нержавейка', c: '#94A3B8' }, { n: 'Чӯбин', c: '#B45309' }]
  ];

  var PRODUCTS = [
    P(1, 'Тобаи гухорӣ «Classic» 28 см', 'Tefal', 'cookware', 1290, 1690, 4.8, 214, 'pan',
      { badges: ['hit'], hue: 12, variants: VARIANTS_COLORS[1],
        desc: 'Пӯсти ҳимояшуда бо 3 қабат, гармшавии баробар. Барои оҳану электрӣ. Ғайричаспак. Маводи антипригарӣ дарозумр.',
        specs: { 'Диаметр': '28 см', 'Маводи пӯст': 'Алюминийӣ', 'Пӯст': 'Anti-adhesive', 'Дастрасӣ': 'Оҳан, газ, индуксия' } }),
    P(2, 'Тобаи гухорӣ «Classic» 24 см', 'Tefal', 'cookware', 990, 0, 4.7, 168, 'pan', { hue: 200 }),
    P(3, 'Дег «Haus» 5 л бо қапқоқи шишагун', 'Polaris', 'cookware', 890, 1090, 4.6, 97, 'saucepan',
      { badges: ['sale'], hue: 210, variants: VARIANTS_COLORS[4],
        desc: 'Деги зӯрӣ бо қапқоқи шишагун ва дасти ҳимояшуда. Барои ҳар гуна ош, шӯрбо ва ҷӯшидан.',
        specs: { 'Ҳаҷм': '5 л', 'Мавод': 'Алюминийӣ', 'Қапқоқ': 'Шишагун' } }),
    P(4, 'Скороварка «ProChef» 6 л', 'Mayer & Boch', 'cookware', 1790, 2300, 4.9, 143, 'pot',
      { badges: ['hit', 'sale'], hue: 152, variants: VARIANTS_COLORS[2],
        desc: 'Пухтани тезтар то 70%. 3 дараҷаи бехатарӣ, клапани фишор, дасти синтаксонӣ.',
        specs: { 'Ҳаҷм': '6 л', 'Давом': 'Ҳимояи 3 дараҷа', 'Мавод': 'Нержавеющӣ' } }),
    P(5, 'Тобаи бирёнӣи вагнӣ (вок) 30 см', 'Ardesto', 'cookware', 1150, 0, 4.5, 76, 'wok', { hue: 30 }),
    P(6, 'Маҷмӯи тобаҳои гухорӣ 3 дона', 'Ardesto', 'cookware', 1490, 1990, 4.4, 58, 'pot',
      { badges: ['sale'], hue: 340, variants: VARIANTS_COLORS[4],
        desc: 'Се тобаи андозаҳои гуногун: 20, 24 ва 28 см. Пӯсти қат-қатӣ бо антипригарӣ.',
        specs: { 'Шумора': '3 дона', 'Андозаҳо': '20/24/28 см' } }),
    P(7, 'Деги чӯянида 7 л «Плов»', 'La Costa', 'cookware', 1990, 0, 4.8, 112, 'deg', { hue: 40 }),
    P(8, 'Маҷмӯи кордҳои ошпаз 5 дона', 'Kelli', 'knives', 690, 1100, 4.7, 341, 'knife',
      { badges: ['hit', 'sale'], hue: 12, variants: VARIANTS_COLORS[3],
        desc: 'Кордҳои тири нержавеющӣ дар тахтаи чӯбинӣ. Корди шеф, корди пӯст, кордҳои майда.',
        specs: { 'Шумора': '5 дона', 'Маводи тир': 'Нержавеющӣ', 'Тахта': 'Чӯбин' } }),
    P(9, 'Корди шефи калон 20 см', 'Vitesse', 'knives', 450, 0, 4.6, 89, 'knife', { hue: 20 }),
    P(10, 'Табақи буридани чӯбин 38×26 см', 'Bekker', 'knives', 240, 0, 4.5, 203, 'board',
      { badges: ['new'], hue: 38, variants: VARIANTS_COLORS[3],
        desc: 'Табақи табиӣ бо ҷойи даст ва каҷи ҷамъоварии шӯр. Барои гӯшт ва сабзавот.',
        specs: { 'Андоза': '38 × 26 см', 'Мавод': 'Чӯбин' } }),
    P(11, 'Теркаи пӯстида 4 вазъият', 'Gemini', 'knives', 180, 240, 4.3, 156, 'grater', { hue: 260 }),
    P(12, 'Маҷмӯи кордҳои керамикӣ 3 дона', 'Kelli', 'knives', 520, 0, 4.4, 64, 'knife',
      { badges: ['new'], hue: 190, variants: VARIANTS_COLORS[0],
        desc: 'Кордҳои сахт ва тирезамуҳоҷ. Барои мева, сабзавот ва гӯшти пухташуда.',
        specs: { 'Шумора': '3 дона', 'Мавод': 'Керамика' } }),
    P(13, 'Блендери ҷойӣ «Fresh» 800 Вт', 'Polaris', 'appliances', 1290, 1590, 4.8, 187, 'blender',
      { badges: ['hit', 'sale'], hue: 262, variants: VARIANTS_COLORS[0],
        desc: 'Кӯчаки шишагун 1,5 л, 2 тезгӣ + турбо, тирҳои нержавеющӣ. Смузии сахт ва шӯрбаи ҷӯшонида.',
        specs: { 'Қувват': '800 Вт', 'Ҳаҷми кӯчак': '1,5 л', 'Тезгӣ': '2 + турбо' } }),
    P(14, 'Блендери дастивӣ (погружной) 300 Вт', 'Vitesse', 'appliances', 690, 0, 4.5, 121, 'handblender', { hue: 300 }),
    P(15, 'Чайники электрӣ 1,7 л «Aqua»', 'Vitesse', 'appliances', 590, 790, 4.7, 412, 'kettle',
      { badges: ['hit', 'sale'], hue: 200, variants: VARIANTS_COLORS[2],
        desc: 'Ҷӯшонидани тез дар 3 дақиқа, филтри ҷудокунандаи каср, ҳимоя аз ҷӯшонидани холӣ.',
        specs: { 'Ҳаҷм': '1,7 л', 'Қувват': '2200 Вт', 'Филтр': 'Ҳа' } }),
    P(16, 'Микромавҷи сол 23 л', 'Samsung', 'appliances', 2490, 2990, 4.8, 96, 'microwave',
      { badges: ['sale'], hue: 214, variants: VARIANTS_COLORS[0],
        desc: '8 барномаи пухтан, гармдиҳии тез, қапқоқи шишагун ва диск ҳаракатнок.',
        specs: { 'Ҳаҷм': '23 л', 'Қувват': '800 Вт', 'Барнома': '8' } }),
    P(17, 'Тостер 2 қисм «Toast»', 'Ardesto', 'appliances', 690, 0, 4.4, 74, 'toaster', { hue: 32 }),
    P(18, 'Миксери ҷойӣ 5 тезгӣ', 'Polaris', 'appliances', 1890, 0, 4.9, 58, 'mixer',
      { badges: ['new'], hue: 340, variants: VARIANTS_COLORS[0],
        desc: 'Ҳаракатдиҳии планетавӣ, кӯчаки 4 л, гардондани ҳамвор. Барои хамир, крем ва сафед.',
        specs: { 'Қувват': '1000 Вт', 'Ҳаҷми кӯчак': '4 л', 'Тезгӣ': '5' } }),
    P(19, 'Кофмашинаи капельная 900 мл', 'Gemini', 'appliances', 1190, 1490, 4.6, 88, 'coffeemachine',
      { badges: ['sale'], hue: 24, variants: VARIANTS_COLORS[0],
        desc: 'Қаҳваи тоза дар 5 дақиқа, табақи гармкунанда, системаи антитапнок.',
        specs: { 'Ҳаҷм': '900 мл', 'Қувват': '800 Вт' } }),
    P(20, 'Тарозии ошхонавӣ электронӣ 5 кг', 'Gemini', 'appliances', 320, 0, 4.5, 267, 'scale', { hue: 180 }),
    P(21, 'Машинаи ширмуҳандис 8 банка', 'Polaris', 'appliances', 480, 0, 4.3, 52, 'yogurtmaker', { hue: 150 }),
    P(22, 'Грили электрӣ 2000 Вт', 'Ardesto', 'appliances', 1390, 1790, 4.6, 43, 'grill',
      { badges: ['sale'], hue: 12, variants: VARIANTS_COLORS[0],
        desc: 'Ду қабатӣ бо гармдиҳии холӣ ва ҷамъоварии равған. Барои гӯшт, сабзавот ва сэндвич.',
        specs: { 'Қувват': '2000 Вт', 'Саҳифа': 'Дуқабата' } }),
    P(23, 'Маҷмӯи табақҳои сервировка 18 дона', 'Mayer & Boch', 'tableware', 890, 1190, 4.7, 158, 'plate',
      { badges: ['hit', 'sale'], hue: 190, variants: VARIANTS_COLORS[3],
        desc: '6 табақи калон, 6 коса, 6 косаи хурд. Дизайни ҳаррӯза, муқовимати машини ҳамӯшӣ.',
        specs: { 'Шумора': '18 дона', 'Мавод': 'Порцелан' } }),
    P(24, 'Косаи салатаи шишагун 3 л', 'Pasabahce', 'tableware', 190, 0, 4.6, 143, 'bowl', { hue: 160 }),
    P(25, 'Маҷмӯи қадаҳҳои чойнӯшӣ 6 дона', 'Pasabahce', 'tableware', 350, 450, 4.5, 91, 'glass',
      { badges: ['sale'], hue: 260, variants: VARIANTS_COLORS[0],
        desc: 'Қадаҳҳои сабук бо девори ғафс. Барои чой, обу нӯшокиҳои сард.',
        specs: { 'Шумора': '6 дона', 'Ҳаҷм': '250 мл' } }),
    P(26, 'Маҷмӯи қошуқҳо 24 дона', 'Bekker', 'tableware', 320, 0, 4.4, 178, 'cutlery', { hue: 210 }),
    P(27, 'Пиёлаи қаҳва 350 мл, 2 дона', 'Mayer & Boch', 'tableware', 280, 0, 4.7, 66, 'cup',
      { badges: ['new'], hue: 28, variants: VARIANTS_COLORS[0],
        desc: 'Пиёлаи ғафсӣ бо дастгоҳи гармӣ. Барои капучино ва латте.',
        specs: { 'Ҳаҷм': '350 мл', 'Шумора': '2 дона' } }),
    P(28, 'Маҷмӯи контейнерҳои ҳерметикӣ 10 дона', 'Gemini', 'storage', 690, 950, 4.8, 231, 'container',
      { badges: ['hit', 'sale'], hue: 38, variants: VARIANTS_COLORS[3],
        desc: 'Контейнерҳои муқовим бо қапқоқи ҳерметикӣ. Мувофиқ барои холодильник ва микромавҷ.',
        specs: { 'Шумора': '10 дона', 'Ҳаҷм': '0,2–2,0 л', 'Мавод': 'Пластики муқовим' } }),
    P(29, 'Банкаҳо барои маҳсулоти хушк, 5 дона', 'Bekker', 'storage', 350, 0, 4.5, 87, 'jar',
      { hue: 96, variants: VARIANTS_COLORS[3],
        desc: 'Банкаҳои шаффоф бо қапқоқи ҳерметикӣ ва қалантарӣ. Барои дон, ҳалво, чой ва масоҳатҳо.',
        specs: { 'Шумора': '5 дона', 'Ҳаҷм': '0,5–1,4 л' } }),
    P(30, 'Душолаи полиздиҳӣ 9 л', 'Gemini', 'storage', 260, 0, 4.3, 119, 'colander', { hue: 190 }),
    P(31, 'Тахтаи специяҳо 12 банка', 'Bekker', 'storage', 420, 560, 4.6, 74, 'spices',
      { badges: ['sale'], hue: 32, variants: VARIANTS_COLORS[3],
        desc: 'Тахтаи чӯбин бо 12 банкаи шаффоф ва қапқоқи молиданӣ. Масоҳатҳо ҳамеша дар даст.',
        specs: { 'Банка': '12 дона', 'Тахта': 'Чӯбин' } }),
    P(32, 'Банкаи ҳерметикӣ барои қаҳва 1,2 л', 'Gemini', 'storage', 190, 0, 4.7, 96, 'jar', { hue: 20 }),
    P(33, 'Фартуки ошхонавӣ', 'Bekker', 'textile', 180, 0, 4.6, 188, 'apron',
      { badges: ['hit'], hue: 330, variants: VARIANTS_COLORS[0],
        desc: 'Фартуки ғафсӣ бо ҷойи гӯшворӣ ва ҷойи даст. Матои нахшукунандаи доғ.',
        specs: { 'Мавод': 'Пашм + пахта', 'Дарозӣ': '85 см' } }),
    P(34, 'Маҷмӯи дастпӯшакҳои ошпаз 4 дона', 'Bekker', 'textile', 160, 220, 4.4, 141, 'mitt',
      { badges: ['sale'], hue: 340, variants: VARIANTS_COLORS[0],
        desc: 'Дастпӯшакҳои ҳимояӣ барои тобаи гарм, бо қабати синтаксонӣ.',
        specs: { 'Шумора': '4 дона', 'Ҳимоя': 'то 250°C' } }),
    P(35, 'Софраи миз 140×180 см', 'Bekker', 'textile', 260, 0, 4.2, 63, 'towel', { hue: 152 }),
    P(36, 'Дастпӯшоки суфра 40×60 см', 'Bekker', 'textile', 90, 0, 4.5, 210, 'towel',
      { hue: 190, variants: VARIANTS_COLORS[3] }),
    P(37, 'Чийнаки Abay 1 л', 'La Costa', 'tea', 390, 0, 4.8, 176, 'teapot',
      { badges: ['hit'], hue: 96, variants: VARIANTS_COLORS[3],
        desc: 'Чийнаки зангзанӣ бо дастаи дастивӣ. Барои чойи сабз ва чойи ширин.',
        specs: { 'Ҳаҷм': '1 л', 'Мавод': 'Занги нержавеющӣ' } }),
    P(38, 'Френч-пресс 800 мл', 'Gemini', 'tea', 490, 650, 4.7, 92, 'frenchpress',
      { badges: ['sale', 'new'], hue: 20, variants: VARIANTS_COLORS[0],
        desc: 'Кӯчаки шишагун борсиликат, филтри нержавеющӣ. Қаҳваи пурмазза.',
        specs: { 'Ҳаҷм': '800 мл', 'Мавод': 'Шиша + нержавейка' } }),
    P(39, 'Джезва (турка) барои қаҳва 600 мл', 'La Costa', 'tea', 210, 0, 4.5, 124, 'teapot', { hue: 30 }),
    P(40, 'Маҷмӯи пиёлаҳои чой 6 дона', 'Pasabahce', 'tea', 240, 320, 4.6, 87, 'cup',
      { badges: ['sale'], hue: 150, variants: VARIANTS_COLORS[3] }),
    P(41, 'Формаи пекарӣ (противень) 40×28 см', 'Mayer & Boch', 'bake', 290, 0, 4.4, 58, 'baking', { hue: 20 }),
    P(42, 'Формаи торт 26 см бо қапқоқ', 'Bekker', 'bake', 340, 0, 4.5, 41, 'baking', { hue: 340 }),
    P(43, 'Маҷмӯи формаҳои кекс 12 дона', 'Gemini', 'bake', 180, 250, 4.3, 37, 'baking',
      { badges: ['sale'], hue: 40, variants: VARIANTS_COLORS[0] })
  ];

  var BANNERS = [
    { id: 'b1', tag: 'Тамоси рӯз', title: 'Тобаҳои Tefal то 40% арзон',
      text: 'Пухтан бе гухор ва доғ. Ирсоли ройгон аз 500 смн.',
      cta: 'Маҷмӯи тобаҳоро бубинед', hue: 152, art: 'pan', link: '#/catalog?cat=cookware' },
    { id: 'b2', tag: 'Нав', title: 'Техникаи ошхонаи зеринавӣ',
      text: 'Блендер, миксери ҷойӣ ва кофмашина. Супориш то шабонарӯзӣ.',
      cta: 'Каталоги техника', hue: 262, art: 'blender', link: '#/catalog?cat=appliances' },
    { id: 'b3', tag: 'Маҷмӯафзун', title: 'Сервировкаи пурраи миз',
      text: 'Табақ, коса ва қадаҳ барои 6 нафар танҳо 890 смн.',
      cta: 'Сервировка', hue: 190, art: 'plate', link: '#/catalog?cat=tableware' },
    { id: 'b4', tag: 'Бонуси 10%', title: 'Коди супориш: OSHXONA10',
      text: 'Ба супориши якум 10% тахфиф. Аксия то охири моҳ.',
      cta: 'Хариданро оғоз кун', hue: 24, art: 'tag', link: '#/catalog' }
  ];

  var PROMO_CODES = {
    'OSHXONA10': { type: 'percent', value: 10, title: 'Тамоси 10% барои супориши якум' },
    'OSHXONA500': { type: 'fixed', value: 500, title: '500 смн. тахфиф' },
    'NEW2026': { type: 'percent', value: 15, title: 'Тамос 15% барои мусофирон' }
  };

  var REVIEW_AUTHORS = ['Дилшод Р.', 'Мадина А.', 'Фирӯз С.', 'Нилуфар К.', 'Аҳмад Ҷ.', 'Зебо М.', 'Сайфулло Т.', 'Гулнора Б.', 'Рустам Н.', 'Хуршед Ш.', 'Озуда Ф.', 'Бахтиёр Л.'];
  var REVIEW_TEXTS = [
    'Сифати хуб, ба тасвир мувофиқ. Ирсол дар 2 рӯз. Тавсия мекардам!',
    'Барои ин нарх беҳтарин интихоб. Аллакай маро заказ кардам — ҳоло дубора.',
    'Барои ошхонаи ман ҳамон чизи ки мехост. Бачаҳо низ хурсанд.',
    'Маводи ғафс, дасти кӯҳна надорад. Танҳо ранги каме аз тасвир фарқ мекунад.',
    'Маҳсулоти хуб, вале қуттии пешниҳодӣ вайрон буд. Худ маҳсулот 5.',
    'Се моҳ истифода мебарам — ҳанӯз ҳамчун нав. Нархи арзонтар ҷустанд.',
    'Озодона ба тавсия. Сифати бренд ҳамон кадоме ки мегуфтанд.',
    'Барои оилаи 4 нафар кофӣ аст. Ҳар рӯз мегузорам.',
    'Хурсанд шудам, нарх низ хуб буд. Ирсоли ройгон бисёр қулай.',
    'Дизайн зебо, дар ошхона хуб нигорист. Барои туҳфа низ мувофиқ.'
  ];

  function seedReviews(product) {
    var n = Math.min(product.reviews, 6);
    var out = [];
    for (var i = 0; i < n; i++) {
      var s = (product.id * 13 + i * 7) % 1000;
      var rating = Math.max(3, Math.min(5, Math.round(product.rating - 0.3 + (s % 10) / 10)));
      out.push({
        author: REVIEW_AUTHORS[(product.id + i) % REVIEW_AUTHORS.length],
        rating: rating,
        date: '2026-0' + (1 + ((product.id + i) % 8)) + '-' + (10 + ((product.id * i) % 18)),
        text: REVIEW_TEXTS[(product.id * 3 + i) % REVIEW_TEXTS.length],
        photos: (s % 3 === 0) ? 2 : (s % 5 === 0 ? 1 : 0),
        helpful: 3 + (s % 42)
      });
    }
    return out;
  }

  window.DB = {
    CATEGORIES: CATEGORIES,
    PRODUCTS: PRODUCTS,
    BANNERS: BANNERS,
    PROMO_CODES: PROMO_CODES,
    catById: function (id) {
      for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].id === id) return CATEGORIES[i];
      return null;
    },
    brands: function () {
      var m = {};
      PRODUCTS.forEach(function (p) { m[p.brand] = (m[p.brand] || 0) + 1; });
      return Object.keys(m).map(function (k) { return { name: k, count: m[k] }; })
        .sort(function (a, b) { return b.count - a.count; });
    },
    priceRange: function () {
      var min = Infinity, max = 0;
      PRODUCTS.forEach(function (p) { if (p.price < min) min = p.price; if (p.price > max) max = p.price; });
      return { min: min, max: max };
    },
    seedReviews: seedReviews
  };
})();
