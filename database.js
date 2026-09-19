const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_FILE = path.join(__dirname, 'data', 'db.json');

function uid() {
  return crypto.randomBytes(8).toString('hex');
}

function hash(pw) {
  return crypto.createHash('sha256').update('akel:' + pw).digest('hex');
}

function seed() {
  const now = new Date().toISOString();
  return {
    users: [
      {
        id: 'admin',
        phone: '992034392828',
        name: 'MS MIRSAIDJON',
        email: 'admin@akelcargo.app',
        language: 'ru',
        theme: 'light',
        branchId: 'istaravshan',
        isAdmin: true,
        passwordHash: hash('MS MIRSAIDJON'),
        bonusPoints: 0,
        createdAt: now
      }
    ],
    tokens: [],
    otps: [],
    parcels: sampleParcels(now),
    news: [
      {
        id: uid(),
        title: 'Приложение Akelcargo уже доступно!',
        body: 'Мы официально запустили мобильное приложение Akelcargo. Следите за посылками, копируйте адрес склада и считайте доставку в одном месте.',
        createdAt: now
      }
    ],
    notifications: [],
    lessons: [
      {
        id: uid(),
        course: 'Pinduoduo',
        title: 'Регистрация в Pinduoduo',
        duration: '4:12',
        youtubeId: '',
        description: 'Как создать аккаунт и начать покупки.',
        createdAt: now
      },
      {
        id: uid(),
        course: 'Pinduoduo',
        title: 'Как ввести адрес склада',
        duration: '6:30',
        youtubeId: '',
        description: 'Пошаговая инструкция заполнения адреса Akelcargo.',
        createdAt: now
      },
      {
        id: uid(),
        course: 'Taobao',
        title: 'Регистрация в Taobao',
        duration: '5:00',
        youtubeId: '',
        description: 'Регистрация и первые покупки на Taobao.',
        createdAt: now
      }
    ],
    settings: {
      companyName: 'Akelcargo',
      version: '1.0.0',
      taglineRu: 'Akelcargo — быстрая и надёжная доставка из Китая в Истаравшан и Ниджони.',
      taglineTg: 'Akelcargo — расонидани зуд ва боэътимод аз Чин ба Истаравшан ва Ниҷонӣ.',
      warehouse: {
        recipientName: 'Клиент',
        phone: '15757966666',
        address: '浙江省义乌胜利达物流石塔头88幢2号',
        city: 'Yiwu',
        country: 'China'
      },
      tariffs: {
        perM3: 240,
        perKg: 2.5,
        tiers: [
          { min: 1, max: 20, tjs: 25, usd: 2.5 },
          { min: 21, max: 30, tjs: 24, usd: 2.4 },
          { min: 31, max: 100, tjs: 23, usd: 2.3 },
          { min: 101, max: 300, tjs: 22, usd: 2.2 },
          { min: 201, max: 500, tjs: 20, usd: 2.0 }
        ]
      },
      hours: {
        timezone: 'Asia/Dushanbe',
        days: {
          mon: '8:00 – 17:30',
          tue: '8:00 – 17:30',
          wed: '8:00 – 17:30',
          thu: '8:00 – 17:30',
          fri: '8:00 – 17:30',
          sat: '8:00 – 17:30',
          sun: 'off'
        },
        noteRu: 'Иногда какой-либо день может быть выходным — следите за новостями.',
        noteTg: 'Баъзан як рӯз метавонад рӯзи истироҳат бошад — хабарҳоро пайгирӣ кунед.'
      },
      delivery: {
        daysRu: 'Стандартный срок доставки из Китая в Истаравшан и Ниджони составляет 15–25 дней.',
        daysTg: 'Муҳлати стандартии расонидан аз Чин ба Истаравшан ва Ниҷонӣ 15–25 рӯз аст.',
        guaranteeRu: 'Мы обеспечиваем надёжную упаковку и контроль на каждом этапе маршрута.',
        guaranteeTg: 'Мо бастабандии боэътимод ва назоратро дар ҳар марҳила таъмин мекунем.',
        packRu: 'Каждая посылка проходит проверку и дополнительную упаковку при необходимости.',
        packTg: 'Ҳар як посылка дар ҳолати зарурӣ санҷида ва иловагӣ бастабандӣ мешавад.',
        freeRu: 'При весе более 30 кг доставка по Истаравшану и Ниджони может быть бесплатной — уточняйте у оператора.',
        freeTg: 'Агар вазн зиёда аз 30 кг бошад, расонидан дар Истаравшан ва Ниҷонӣ метавонад ройгон бошад — аз оператор пурсед.'
      },
      prohibited: [
        {
          titleRu: 'Оружие и боеприпасы',
          titleTg: 'Яроқ ва аслиҳа',
          descRu: 'Огнестрельное, холодное, пневматическое оружие, патроны, порох.',
          descTg: 'Яроқи оташфишон, сард, пневматикӣ, патронҳо, барут.'
        },
        {
          titleRu: 'Наркотические вещества',
          titleTg: 'Моддаҳои нашъадор',
          descRu: 'Любые наркотики и прекурсоры.',
          descTg: 'Ҳама гуна нашъа ва прекурсорҳо.'
        },
        {
          titleRu: 'Легковоспламеняющиеся жидкости',
          titleTg: 'Моеъҳои зудсӯз',
          descRu: 'Бензин, растворители, аэрозоли под давлением.',
          descTg: 'Бензин, ҳалкунандаҳо, аэрозолҳои зери фишор.'
        },
        {
          titleRu: 'Аккумуляторы и powerbank сверх нормы',
          titleTg: 'Батарея ва пауэрбанк зиёда аз меъёр',
          descRu: 'Литиевые батареи без согласования с оператором.',
          descTg: 'Батареяҳои литийӣ бе мувофиқа бо оператор.'
        }
      ],
      support: {
        phones: ['+992 98 909 1111', '+992 80 361 1010', '+992 98 151 7777'],
        email: 'support@akelcargo.app'
      },
      socials: {
        instagram: '@akelcargo.tj',
        telegram: '@akelcargo'
      },
      banners: [
        {
          id: 'b1',
          image: '/banner1.jpg',
          titleRu: 'Быстрая и надёжная доставка',
          titleTg: 'Расонидани зуд ва боэътимод',
          subRu: 'Китай → Истаравшан  ·  от 2,5 $/кг',
          subTg: 'Чин → Истаравшан  ·  аз 2,5 $/кг'
        },
        {
          id: 'b2',
          image: '/banner2.jpg',
          titleRu: 'Склад в Ниджони',
          titleTg: 'Анбор дар Ниҷонӣ',
          subRu: 'Китай → Ниджони  ·  прозрачный тариф',
          subTg: 'Чин → Ниҷонӣ  ·  тарифи шаффоф'
        }
      ],
      marketplaces: [
        { id: 'pdd', name: 'Pinduoduo', url: 'https://mobile.pinduoduo.com', color: '#e02e24' },
        { id: 'tb', name: 'Taobao', url: 'https://m.taobao.com', color: '#ff5000' },
        { id: '1688', name: '1688', url: 'https://m.1688.com', color: '#ff6a00' },
        { id: 'poizon', name: 'Poizon', url: 'https://www.poizon.com', color: '#111111' }
      ],
      branches: [
        { id: 'istaravshan', nameRu: 'Истаравшан', nameTg: 'Истаравшан', city: 'Istaravshan' },
        { id: 'nijoni', nameRu: 'Ниджони', nameTg: 'Ниҷонӣ', city: 'Nijoni' }
      ],
      sms: {
        apiKey: '',
        from: 'Akelcargo'
      },
      bonusRulesRu: 'Баллы начисляются за каждую доставленную посылку: 1$ = 1 балл. 100 баллов = 1$ скидки на следующую доставку.',
      bonusRulesTg: 'Холҳо барои ҳар посылкаи расонидашуда ҳисоб мешаванд: 1$ = 1 хол. 100 хол = 1$ тахфиф барои расонидани навбатӣ.',
      aboutRu: 'Akelcargo — быстрая и надёжная доставка из Китая в Истаравшан и Ниджони.',
      aboutTg: 'Akelcargo — расонидани зуд ва боэътимод аз Чин ба Истаравшан ва Ниҷонӣ.',
      privacyRu: 'Akelcargo использует данные пользователя только для корректной работы сервиса, отслеживания заказов и предоставления логистических услуг.',
      privacyTg: 'Akelcargo маълумоти корбарро танҳо барои кори дурусти хизматрасонӣ, пайгирии фармоишҳо ва хизматҳои логистикӣ истифода мебарад.',
      termsRu: 'Пользуясь приложением, вы соглашаетесь с правилами перевозки, списком запрещённых товаров и тарифами компании.',
      termsTg: 'Бо истифодаи барнома шумо бо қоидаҳои интиқол, рӯйхати молҳои манъшуда ва тарифҳои ширкат розӣ мешавед.'
    }
  };
}

function sampleParcels(now) {
  const mk = (o) => ({
    id: uid(),
    userId: null,
    volume: 0,
    comment: '',
    createdAt: now,
    updatedAt: now,
    history: [
      {
        status: 'accepted',
        date: o.receivedDate,
        noteRu: `Бор санаи ${o.receivedDate} қабул карда шуд`,
        noteTg: `Бор санаи ${o.receivedDate} қабул карда шуд`
      }
    ].concat(
      o.status !== 'accepted'
        ? [{ status: o.status, date: now.slice(0, 10), noteRu: '', noteTg: '' }]
        : []
    ),
    ...o
  });
  return [
    mk({ trackCode: 'AKEL88001101', userPhone: '992988884477', status: 'accepted', branch: 'istaravshan', receivedDate: '2026-09-01', weight: 3.2, price: 8, title: 'Pinduoduo · либос' }),
    mk({ trackCode: 'AKEL88001102', userPhone: '992988884477', status: 'in_transit', branch: 'istaravshan', receivedDate: '2026-08-28', weight: 5.1, price: 12.5, title: 'Taobao · посуда' }),
    mk({ trackCode: 'AKEL88001103', userPhone: '992988884477', status: 'warehouse', branch: 'nijoni', receivedDate: '2026-08-20', weight: 2, price: 5, title: '1688 · қисмҳо' }),
    mk({ trackCode: 'YT000112233445', userPhone: '992988884477', status: 'delivery', branch: 'istaravshan', receivedDate: '2026-08-18', weight: 1.4, price: 3.5, title: 'Poizon · пойафзол' }),
    mk({ trackCode: 'LP9988776655', userPhone: '992988884477', status: 'received', branch: 'nijoni', receivedDate: '2026-08-10', weight: 8, price: 19.2, title: 'Pinduoduo · бозичаҳо' }),
    mk({ trackCode: 'AKEL88001106', userPhone: '992034392828', status: 'in_transit', branch: 'istaravshan', receivedDate: '2026-09-02', weight: 4.6, price: 11.5, title: 'Taobao · техника' })
  ];
}

function migrate(db) {
  db.settings = db.settings || {};
  db.settings.sms = Object.assign({ apiKey: '', from: 'Akelcargo' }, db.settings.sms || {});
  delete db.settings.whatsapp;
  db.settings.branches = [
    { id: 'istaravshan', nameRu: 'Истаравшан', nameTg: 'Истаравшан', city: 'Istaravshan' },
    { id: 'nijoni', nameRu: 'Ниджони', nameTg: 'Ниҷонӣ', city: 'Nijoni' }
  ];
  db.settings.taglineRu = 'Akelcargo — быстрая и надёжная доставка из Китая в Истаравшан и Ниджони.';
  db.settings.taglineTg = 'Akelcargo — расонидани зуд ва боэътимод аз Чин ба Истаравшан ва Ниҷонӣ.';
  db.settings.aboutRu = db.settings.taglineRu;
  db.settings.aboutTg = db.settings.taglineTg;
  if (db.settings.delivery) {
    db.settings.delivery.daysRu = 'Стандартный срок доставки из Китая в Истаравшан и Ниджони составляет 15–25 дней.';
    db.settings.delivery.daysTg = 'Муҳлати стандартии расонидан аз Чин ба Истаравшан ва Ниҷонӣ 15–25 рӯз аст.';
    db.settings.delivery.freeRu = 'При весе более 30 кг доставка по Истаравшану и Ниджони может быть бесплатной — уточняйте у оператора.';
    db.settings.delivery.freeTg = 'Агар вазн зиёда аз 30 кг бошад, расонидан дар Истаравшан ва Ниҷонӣ метавонад ройгон бошад — аз оператор пурсед.';
  }
  if (Array.isArray(db.settings.banners)) {
    if (db.settings.banners[0]) {
      db.settings.banners[0].subRu = 'Китай → Истаравшан  ·  от 2,5 $/кг';
      db.settings.banners[0].subTg = 'Чин → Истаравшан  ·  аз 2,5 $/кг';
    }
    if (db.settings.banners[1]) {
      db.settings.banners[1].titleRu = 'Склад в Ниджони';
      db.settings.banners[1].titleTg = 'Анбор дар Ниҷонӣ';
      db.settings.banners[1].subRu = 'Китай → Ниджони  ·  прозрачный тариф';
      db.settings.banners[1].subTg = 'Чин → Ниҷонӣ  ·  тарифи шаффоф';
    }
  }
  (db.users || []).forEach((u) => {
    if (!u.branchId || u.branchId === 'dushanbe' || u.branchId === 'khujand') u.branchId = 'istaravshan';
  });
  const have = new Set((db.parcels || []).map((p) => p.trackCode));
  const extra = sampleParcels(new Date().toISOString()).filter((p) => !have.has(p.trackCode));
  db.parcels = extra.concat(db.parcels || []);
  persist();
  return db;
}

function load() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      return migrate(db);
    }
  } catch (e) {
    console.error('DB load error', e);
  }
  const s = seed();
  save(s);
  return s;
}

function save(db) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

let db = load();

function get() {
  return db;
}

function persist() {
  save(db);
}

function reset() {
  db = seed();
  persist();
  return db;
}

module.exports = { get, persist, uid, hash, reset };
