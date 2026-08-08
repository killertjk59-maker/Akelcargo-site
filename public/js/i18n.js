// ============ INTERNATIONALIZATION ============
const translations = {
  tg: {
    // Navbar
    'nav.services': 'Хизматрасониҳо',
    'nav.pricing': 'Нархнома',
    'nav.howItWorks': 'Чӣ тавр кор мекунад',
    'nav.address': 'Суроға',
    'nav.tracking': 'Трекинг',
    'nav.contact': 'Тамос',
    'nav.login': 'Воридшавӣ',
    'nav.register': 'Регистратсия',
    'nav.dashboard': '📊 Кабинет',
    'nav.myTracking': '📦 Трекинг',
    'nav.logout': '🚪 Баромад',
    'nav.admin': '👑 Админ',

    // Hero
    'hero.badge': 'Хизматрасонии боэътимод',
    'hero.title': 'Борҳои шумо аз <span>Чин</span> ба Тоҷикистон',
    'hero.subtitle': 'Борҳои худро аз Чин ба Тоҷикистон бо нархи дастрас ва бехатар интиқол диҳед. Сроки интиқол 15-20 рӯз.',
    'hero.startBtn': 'Сар кардан →',
    'hero.trackBtn': '📦 Пайгирии бор',
    'hero.stat1': 'Борҳо интиқол шудаанд',
    'hero.stat2': 'Рӯзи интиқол',
    'hero.stat3': 'Барои 1 кг',
    'hero.cardTitle': 'Пайгирии бор',
    'hero.cardSubtitle': 'Рақами трекингро ворид кунед',
    'hero.trackBtn2': 'Ҷустуҷӯ',

    // Services
    'services.badge': 'Хизматрасониҳо',
    'services.title': 'Хизматрасониҳои мо',
    'services.subtitle': 'Мо хизматрасонии пурраи боркашониро аз Чин ба Тоҷикистон пешниҳод менамоем',
    'services.s1title': 'Боркашонии баҳрӣ',
    'services.s1desc': 'Интиқоли бор тавассути нақлиёти баҳрӣ бо нархи дастрас ва бехатар',
    'services.s2title': 'Боркашонии заминӣ',
    'services.s2desc': 'Интиқоли бор тавассути нақлиёти автомобилӣ аз Чин ба Тоҷикистон',
    'services.s3title': 'Расмикунии гумрукӣ',
    'services.s3desc': 'Мо ҳамаи расмикуниҳои гумрукиро барои шумо иҷро мекунем',
    'services.s4title': 'Бастабандӣ',
    'services.s4desc': 'Бастабандии касбии борҳо барои ҳифзи онҳо дар вақти интиқол',
    'services.s5title': 'Харид аз Чин',
    'services.s5desc': 'Кӯмак дар хариди мол аз бозорҳои Чин ва сомонаҳои онлайн',
    'services.s6title': 'Пайгирии онлайн',
    'services.s6desc': 'Пайгирии бори шумо дар ҳар лаҳза тавассути системаи онлайн',

    // Pricing
    'pricing.badge': 'Нархнома',
    'pricing.title': 'Нархи интиқол',
    'pricing.subtitle': 'Нархи шаффоф ва дастрас барои ҳама',
    'pricing.popular': 'Нархи асосӣ',
    'pricing.unit': 'сомонӣ барои 1 кг',
    'pricing.f1': 'Интиқол аз Чин ба Тоҷикистон',
    'pricing.f2': 'Сроки интиқол 15-20 рӯз',
    'pricing.f3': 'Пайгирии онлайн',
    'pricing.f4': 'Расмикунии гумрукӣ',
    'pricing.f5': 'Бастабандии ройгон',
    'pricing.f6': 'Дастрасии 24/7',
    'pricing.cta': 'Ҳоло сар кунед',

    // How it works
    'how.badge': 'Раванд',
    'how.title': 'Чӣ тавр кор мекунад?',
    'how.subtitle': '4 қадами оддӣ барои интиқоли бор',
    'how.s1title': 'Регистратсия',
    'how.s1desc': 'Дар системаи мо сабти ном кунед ва ба кабинети шахсӣ ворид шавед',
    'how.s2title': 'Фиристодани бор',
    'how.s2desc': 'Бори худро ба суроғаи анбори мо дар Чин фиристед',
    'how.s3title': 'Интиқол',
    'how.s3desc': 'Мо бори шуморо аз Чин ба Тоҷикистон интиқол медиҳем',
    'how.s4title': 'Гирифтани бор',
    'how.s4desc': 'Бори худро дар Тоҷикистон гиред',

    // Address
    'address.badge': 'Суроға',
    'address.title': 'Суроғаи анбор',
    'address.subtitle': 'Бори худро ба ин суроға фиристед',
    'address.chinaTitle': 'Анбор дар Чин',
    'address.tjTitle': 'Дар Тоҷикистон',
    'address.addr': 'Суроға',
    'address.phone': 'Телефон',
    'address.copy': 'Нусхабардорӣ',
    'address.delivery': 'Сроки интиқол',
    'address.deliveryTime': '15-20 рӯз',
    'address.airline': 'Авиакомпания',
    'address.noAirline': 'Надорем',

    // Contact
    'contact.badge': 'Тамос',
    'contact.title': 'Бо мо тамос гиред',
    'contact.subtitle': 'Мо ҳамеша омодаем ба шумо кӯмак кунем',
    'contact.infoTitle': 'Маълумоти тамос',
    'contact.phone': 'Телефон',
    'contact.location': 'Ҷойгиршавӣ',
    'contact.locationVal': 'Тоҷикистон',
    'contact.hours': 'Вақти корӣ',
    'contact.hoursVal': 'Душанбе - Шанбе: 9:00 - 18:00',
    'contact.formTitle': 'Паём фиристонед',
    'contact.name': 'Ном',
    'contact.phoneLabel': 'Телефон',
    'contact.subject': 'Мавзӯъ',
    'contact.message': 'Паём',
    'contact.send': 'Фиристондан',

    // Footer
    'footer.desc': 'Хизматрасонии боэътимоди боркашонӣ аз Чин ба Тоҷикистон. Нархи дастрас, сроки тез.',
    'footer.linksTitle': 'Саҳифаҳо',
    'footer.servicesTitle': 'Хизматрасониҳо',
    'footer.contactTitle': 'Тамос',
    'footer.copy': '© 2026 Akel Cargo. Ҳамаи ҳуқуқ маҳфузанд.',
    'footer.made': 'Сохташуда бо ❤️',

    // Auth
    'auth.loginTitle': 'Воридшавӣ',
    'auth.registerTitle': 'Регистратсия',
    'auth.loginSubtitle': 'Ба кабинети шахсии худ ворид шавед',
    'auth.registerSubtitle': 'Ҳисоби нав созед',
    'auth.login': 'Логин',
    'auth.password': 'Парол',
    'auth.fullName': 'Номи пурра',
    'auth.phone': 'Телефон',
    'auth.email': 'Email (ихтиёрӣ)',
    'auth.loginBtn': 'Ворид шудан',
    'auth.registerBtn': 'Сабти ном',
    'auth.noAccount': 'Ҳисоб надоред?',
    'auth.haveAccount': 'Аллакай ҳисоб доред?',
    'auth.createHere': 'Инҷо созед',
    'auth.loginHere': 'Инҷо ворид шавед',

    // Dashboard
    'dash.title': 'Кабинети шахсӣ',
    'dash.welcome': 'Хуш омадед',
    'dash.packages': 'Борҳои ман',
    'dash.messages': 'Паёмҳо',
    'dash.settings': 'Танзимот',
    'dash.noPackages': 'Борҳо нест',
    'dash.noMessages': 'Паёмҳо нест',
    'dash.track': 'Пайгирӣ кардан',
    'dash.sendMessage': 'Паём фиристондан',

    // Tracking
    'track.title': 'Пайгирии бор',
    'track.subtitle': 'Рақами трекингро ворид кунед',
    'track.input': 'Рақами трекинг',
    'track.search': 'Ҷустуҷӯ',
    'track.notFound': 'Бор ёфт нашуд',
    'track.status': 'Ҳолат',
    'track.location': 'Ҷойгиршавӣ',
    'track.weight': 'Вазн',
    'track.price': 'Нарх',
    'track.estimated': 'Тақрибан',
    'track.history': 'Таърих',

    // Status
    'status.received_china': 'Дар анбори Чин',
    'status.in_transit': 'Дар роҳ',
    'status.customs': 'Дар гумрук',
    'status.received_tj': 'Расид ба Тоҷикистон',
    'status.delivered': 'Супурда шуд',
    'status.pending': 'Интизорӣ',

    // Messages
    'msg.success': 'Муваффақ шуд!',
    'msg.error': 'Хато!',
    'msg.copied': 'Нусха бардошта шуд!',
    'msg.sent': 'Паём фиристода шуд!',
    'msg.logout': 'Шумо баромадед',
    'msg.welcome': 'Хуш омадед!',

    // Admin
    'admin.title': 'Панели администратор',
    'admin.dashboard': 'Боғ',
    'admin.users': 'Корбарон',
    'admin.packages': 'Борҳо',
    'admin.messages': 'Паёмҳо',
    'admin.settings': 'Танзимот',
    'admin.addPackage': 'Бор илова кардан',
    'admin.totalUsers': 'Ҳамагӣ корбарон',
    'admin.totalPackages': 'Ҳамагӣ борҳо',
    'admin.totalMessages': 'Ҳамагӣ паёмҳо',
    'admin.unread': 'Хонда нашуда',
    'admin.edit': 'Таҳрир',
    'admin.delete': 'Нест кардан',
    'admin.save': 'Нигоҳ доштан',
    'admin.cancel': 'Бекор кардан',
    'admin.block': 'Бастан',
    'admin.unblock': 'Кушодан',
    'admin.reply': 'Ҷавоб',
    'admin.markRead': 'Хонда шуда',
  },

  ru: {
    // Navbar
    'nav.services': 'Услуги',
    'nav.pricing': 'Тарифы',
    'nav.howItWorks': 'Как работает',
    'nav.address': 'Адрес',
    'nav.tracking': 'Трекинг',
    'nav.contact': 'Контакты',
    'nav.login': 'Войти',
    'nav.register': 'Регистрация',
    'nav.dashboard': '📊 Кабинет',
    'nav.myTracking': '📦 Трекинг',
    'nav.logout': '🚪 Выход',
    'nav.admin': '👑 Админ',

    // Hero
    'hero.badge': 'Надежная служба доставки',
    'hero.title': 'Ваши грузы из <span>Китая</span> в Таджикистан',
    'hero.subtitle': 'Доставьте свои грузы из Китая в Таджикистан по доступной цене и безопасно. Срок доставки 15-20 дней.',
    'hero.startBtn': 'Начать →',
    'hero.trackBtn': '📦 Отследить груз',
    'hero.stat1': 'Грузов доставлено',
    'hero.stat2': 'Дней доставки',
    'hero.stat3': 'За 1 кг',
    'hero.cardTitle': 'Отследить груз',
    'hero.cardSubtitle': 'Введите номер отслеживания',
    'hero.trackBtn2': 'Поиск',

    // Services
    'services.badge': 'Услуги',
    'services.title': 'Наши услуги',
    'services.subtitle': 'Мы предоставляем полный спектр услуг по доставке грузов из Китая в Таджикистан',
    'services.s1title': 'Морская перевозка',
    'services.s1desc': 'Доставка грузов морским транспортом по доступной цене и безопасно',
    'services.s2title': 'Наземная перевозка',
    'services.s2desc': 'Доставка грузов автомобильным транспортом из Китая в Таджикистан',
    'services.s3title': 'Таможенное оформление',
    'services.s3desc': 'Мы выполняем все таможенные формальности для вас',
    'services.s4title': 'Упаковка',
    'services.s4desc': 'Профессиональная упаковка грузов для их защиты при транспортировке',
    'services.s5title': 'Закупки из Китая',
    'services.s5desc': 'Помощь в покупке товаров на рынках Китая и онлайн-магазинах',
    'services.s6title': 'Онлайн отслеживание',
    'services.s6desc': 'Отслеживание вашего груза в любой момент через онлайн систему',

    // Pricing
    'pricing.badge': 'Тарифы',
    'pricing.title': 'Стоимость доставки',
    'pricing.subtitle': 'Прозрачная и доступная цена для всех',
    'pricing.popular': 'Базовый тариф',
    'pricing.unit': 'сомони за 1 кг',
    'pricing.f1': 'Доставка из Китая в Таджикистан',
    'pricing.f2': 'Срок доставки 15-20 дней',
    'pricing.f3': 'Онлайн отслеживание',
    'pricing.f4': 'Таможенное оформление',
    'pricing.f5': 'Бесплатная упаковка',
    'pricing.f6': 'Доступность 24/7',
    'pricing.cta': 'Начать сейчас',

    // How it works
    'how.badge': 'Процесс',
    'how.title': 'Как это работает?',
    'how.subtitle': '4 простых шага для доставки груза',
    'how.s1title': 'Регистрация',
    'how.s1desc': 'Зарегистрируйтесь в нашей системе и войдите в личный кабинет',
    'how.s2title': 'Отправка груза',
    'how.s2desc': 'Отправьте ваш груз на адрес нашего склада в Китае',
    'how.s3title': 'Транспортировка',
    'how.s3desc': 'Мы доставим ваш груз из Китая в Таджикистан',
    'how.s4title': 'Получение груза',
    'how.s4desc': 'Получите ваш груз в Таджикистане',

    // Address
    'address.badge': 'Адрес',
    'address.title': 'Адрес склада',
    'address.subtitle': 'Отправьте ваш груз на этот адрес',
    'address.chinaTitle': 'Склад в Китае',
    'address.tjTitle': 'В Таджикистане',
    'address.addr': 'Адрес',
    'address.phone': 'Телефон',
    'address.copy': 'Копировать',
    'address.delivery': 'Срок доставки',
    'address.deliveryTime': '15-20 дней',
    'address.airline': 'Авиакомпания',
    'address.noAirline': 'Нет',

    // Contact
    'contact.badge': 'Контакты',
    'contact.title': 'Свяжитесь с нами',
    'contact.subtitle': 'Мы всегда готовы вам помочь',
    'contact.infoTitle': 'Контактная информация',
    'contact.phone': 'Телефон',
    'contact.location': 'Местоположение',
    'contact.locationVal': 'Таджикистан',
    'contact.hours': 'Рабочие часы',
    'contact.hoursVal': 'Понедельник - Суббота: 9:00 - 18:00',
    'contact.formTitle': 'Отправить сообщение',
    'contact.name': 'Имя',
    'contact.phoneLabel': 'Телефон',
    'contact.subject': 'Тема',
    'contact.message': 'Сообщение',
    'contact.send': 'Отправить',

    // Footer
    'footer.desc': 'Надежная служба доставки грузов из Китая в Таджикистан. Доступные цены, быстрые сроки.',
    'footer.linksTitle': 'Страницы',
    'footer.servicesTitle': 'Услуги',
    'footer.contactTitle': 'Контакты',
    'footer.copy': '© 2026 Akel Cargo. Все права защищены.',
    'footer.made': 'Сделано с ❤️',

    // Auth
    'auth.loginTitle': 'Вход',
    'auth.registerTitle': 'Регистрация',
    'auth.loginSubtitle': 'Войдите в свой личный кабинет',
    'auth.registerSubtitle': 'Создайте новый аккаунт',
    'auth.login': 'Логин',
    'auth.password': 'Пароль',
    'auth.fullName': 'Полное имя',
    'auth.phone': 'Телефон',
    'auth.email': 'Email (необязательно)',
    'auth.loginBtn': 'Войти',
    'auth.registerBtn': 'Зарегистрироваться',
    'auth.noAccount': 'Нет аккаунта?',
    'auth.haveAccount': 'Уже есть аккаунт?',
    'auth.createHere': 'Создать здесь',
    'auth.loginHere': 'Войти здесь',

    // Dashboard
    'dash.title': 'Личный кабинет',
    'dash.welcome': 'Добро пожаловать',
    'dash.packages': 'Мои грузы',
    'dash.messages': 'Сообщения',
    'dash.settings': 'Настройки',
    'dash.noPackages': 'Нет грузов',
    'dash.noMessages': 'Нет сообщений',
    'dash.track': 'Отследить',
    'dash.sendMessage': 'Отправить сообщение',

    // Tracking
    'track.title': 'Отследить груз',
    'track.subtitle': 'Введите номер отслеживания',
    'track.input': 'Номер отслеживания',
    'track.search': 'Поиск',
    'track.notFound': 'Груз не найден',
    'track.status': 'Статус',
    'track.location': 'Местоположение',
    'track.weight': 'Вес',
    'track.price': 'Цена',
    'track.estimated': 'Примерно',
    'track.history': 'История',

    // Status
    'status.received_china': 'На складе в Китае',
    'status.in_transit': 'В пути',
    'status.customs': 'На таможне',
    'status.received_tj': 'Прибыл в Таджикистан',
    'status.delivered': 'Доставлен',
    'status.pending': 'Ожидание',

    // Messages
    'msg.success': 'Успешно!',
    'msg.error': 'Ошибка!',
    'msg.copied': 'Скопировано!',
    'msg.sent': 'Сообщение отправлено!',
    'msg.logout': 'Вы вышли',
    'msg.welcome': 'Добро пожаловать!',

    // Admin
    'admin.title': 'Панель администратора',
    'admin.dashboard': 'Обзор',
    'admin.users': 'Пользователи',
    'admin.packages': 'Грузы',
    'admin.messages': 'Сообщения',
    'admin.settings': 'Настройки',
    'admin.addPackage': 'Добавить груз',
    'admin.totalUsers': 'Всего пользователей',
    'admin.totalPackages': 'Всего грузов',
    'admin.totalMessages': 'Всего сообщений',
    'admin.unread': 'Непрочитанные',
    'admin.edit': 'Редактировать',
    'admin.delete': 'Удалить',
    'admin.save': 'Сохранить',
    'admin.cancel': 'Отмена',
    'admin.block': 'Заблокировать',
    'admin.unblock': 'Разблокировать',
    'admin.reply': 'Ответить',
    'admin.markRead': 'Прочитано',
  },

  en: {
    // Navbar
    'nav.services': 'Services',
    'nav.pricing': 'Pricing',
    'nav.howItWorks': 'How It Works',
    'nav.address': 'Address',
    'nav.tracking': 'Tracking',
    'nav.contact': 'Contact',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.dashboard': '📊 Dashboard',
    'nav.myTracking': '📦 Tracking',
    'nav.logout': '🚪 Logout',
    'nav.admin': '👑 Admin',

    // Hero
    'hero.badge': 'Reliable Delivery Service',
    'hero.title': 'Your Cargo from <span>China</span> to Tajikistan',
    'hero.subtitle': 'Ship your cargo from China to Tajikistan at an affordable price and safely. Delivery time 15-20 days.',
    'hero.startBtn': 'Get Started →',
    'hero.trackBtn': '📦 Track Cargo',
    'hero.stat1': 'Packages Delivered',
    'hero.stat2': 'Delivery Days',
    'hero.stat3': 'Per 1 kg',
    'hero.cardTitle': 'Track Cargo',
    'hero.cardSubtitle': 'Enter tracking number',
    'hero.trackBtn2': 'Search',

    // Services
    'services.badge': 'Services',
    'services.title': 'Our Services',
    'services.subtitle': 'We provide comprehensive cargo delivery services from China to Tajikistan',
    'services.s1title': 'Sea Freight',
    'services.s1desc': 'Cargo delivery by sea transport at an affordable price and safely',
    'services.s2title': 'Land Transport',
    'services.s2desc': 'Cargo delivery by road from China to Tajikistan',
    'services.s3title': 'Customs Clearance',
    'services.s3desc': 'We handle all customs formalities for you',
    'services.s4title': 'Packaging',
    'services.s4desc': 'Professional cargo packaging for protection during transit',
    'services.s5title': 'Purchasing from China',
    'services.s5desc': 'Assistance in buying goods from Chinese markets and online stores',
    'services.s6title': 'Online Tracking',
    'services.s6desc': 'Track your cargo anytime through our online system',

    // Pricing
    'pricing.badge': 'Pricing',
    'pricing.title': 'Delivery Cost',
    'pricing.subtitle': 'Transparent and affordable pricing for everyone',
    'pricing.popular': 'Basic Plan',
    'pricing.unit': 'somoni per 1 kg',
    'pricing.f1': 'Delivery from China to Tajikistan',
    'pricing.f2': 'Delivery time 15-20 days',
    'pricing.f3': 'Online tracking',
    'pricing.f4': 'Customs clearance',
    'pricing.f5': 'Free packaging',
    'pricing.f6': '24/7 availability',
    'pricing.cta': 'Get Started',

    // How it works
    'how.badge': 'Process',
    'how.title': 'How It Works?',
    'how.subtitle': '4 simple steps for cargo delivery',
    'how.s1title': 'Registration',
    'how.s1desc': 'Register in our system and log into your personal account',
    'how.s2title': 'Ship Cargo',
    'how.s2desc': 'Send your cargo to our warehouse address in China',
    'how.s3title': 'Transportation',
    'how.s3desc': 'We deliver your cargo from China to Tajikistan',
    'how.s4title': 'Receive Cargo',
    'how.s4desc': 'Receive your cargo in Tajikistan',

    // Address
    'address.badge': 'Address',
    'address.title': 'Warehouse Address',
    'address.subtitle': 'Send your cargo to this address',
    'address.chinaTitle': 'Warehouse in China',
    'address.tjTitle': 'In Tajikistan',
    'address.addr': 'Address',
    'address.phone': 'Phone',
    'address.copy': 'Copy',
    'address.delivery': 'Delivery Time',
    'address.deliveryTime': '15-20 days',
    'address.airline': 'Airline',
    'address.noAirline': 'None',

    // Contact
    'contact.badge': 'Contact',
    'contact.title': 'Contact Us',
    'contact.subtitle': 'We are always ready to help you',
    'contact.infoTitle': 'Contact Information',
    'contact.phone': 'Phone',
    'contact.location': 'Location',
    'contact.locationVal': 'Tajikistan',
    'contact.hours': 'Working Hours',
    'contact.hoursVal': 'Monday - Saturday: 9:00 - 18:00',
    'contact.formTitle': 'Send Message',
    'contact.name': 'Name',
    'contact.phoneLabel': 'Phone',
    'contact.subject': 'Subject',
    'contact.message': 'Message',
    'contact.send': 'Send',

    // Footer
    'footer.desc': 'Reliable cargo delivery service from China to Tajikistan. Affordable prices, fast delivery.',
    'footer.linksTitle': 'Pages',
    'footer.servicesTitle': 'Services',
    'footer.contactTitle': 'Contact',
    'footer.copy': '© 2026 Akel Cargo. All rights reserved.',
    'footer.made': 'Made with ❤️',

    // Auth
    'auth.loginTitle': 'Login',
    'auth.registerTitle': 'Registration',
    'auth.loginSubtitle': 'Log into your personal account',
    'auth.registerSubtitle': 'Create a new account',
    'auth.login': 'Login',
    'auth.password': 'Password',
    'auth.fullName': 'Full Name',
    'auth.phone': 'Phone',
    'auth.email': 'Email (optional)',
    'auth.loginBtn': 'Log In',
    'auth.registerBtn': 'Register',
    'auth.noAccount': "Don't have an account?",
    'auth.haveAccount': 'Already have an account?',
    'auth.createHere': 'Create here',
    'auth.loginHere': 'Login here',

    // Dashboard
    'dash.title': 'Personal Dashboard',
    'dash.welcome': 'Welcome',
    'dash.packages': 'My Packages',
    'dash.messages': 'Messages',
    'dash.settings': 'Settings',
    'dash.noPackages': 'No packages',
    'dash.noMessages': 'No messages',
    'dash.track': 'Track',
    'dash.sendMessage': 'Send Message',

    // Tracking
    'track.title': 'Track Cargo',
    'track.subtitle': 'Enter tracking number',
    'track.input': 'Tracking Number',
    'track.search': 'Search',
    'track.notFound': 'Package not found',
    'track.status': 'Status',
    'track.location': 'Location',
    'track.weight': 'Weight',
    'track.price': 'Price',
    'track.estimated': 'Estimated',
    'track.history': 'History',

    // Status
    'status.received_china': 'At China Warehouse',
    'status.in_transit': 'In Transit',
    'status.customs': 'At Customs',
    'status.received_tj': 'Arrived in Tajikistan',
    'status.delivered': 'Delivered',
    'status.pending': 'Pending',

    // Messages
    'msg.success': 'Success!',
    'msg.error': 'Error!',
    'msg.copied': 'Copied!',
    'msg.sent': 'Message sent!',
    'msg.logout': 'You have logged out',
    'msg.welcome': 'Welcome!',

    // Admin
    'admin.title': 'Admin Panel',
    'admin.dashboard': 'Overview',
    'admin.users': 'Users',
    'admin.packages': 'Packages',
    'admin.messages': 'Messages',
    'admin.settings': 'Settings',
    'admin.addPackage': 'Add Package',
    'admin.totalUsers': 'Total Users',
    'admin.totalPackages': 'Total Packages',
    'admin.totalMessages': 'Total Messages',
    'admin.unread': 'Unread',
    'admin.edit': 'Edit',
    'admin.delete': 'Delete',
    'admin.save': 'Save',
    'admin.cancel': 'Cancel',
    'admin.block': 'Block',
    'admin.unblock': 'Unblock',
    'admin.reply': 'Reply',
    'admin.markRead': 'Mark Read',
  }
};

// Language management
let currentLang = localStorage.getItem('akel_lang') || 'tg';

function t(key) {
  return translations[currentLang]?.[key] || translations['tg']?.[key] || key;
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('akel_lang', lang);
  document.documentElement.lang = lang;
  applyTranslations();
  updateLangMenu();
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translation = t(key);
    if (translation) {
      if (el.tagName === 'INPUT') {
        el.placeholder = translation;
      } else {
        el.innerHTML = translation;
      }
    }
  });

  // Update select options
  document.querySelectorAll('[data-i18n-value]').forEach(el => {
    const key = el.getAttribute('data-i18n-value');
    const translation = t(key);
    if (translation) el.value = translation;
  });
}

function updateLangMenu() {
  document.querySelectorAll('.lang-option').forEach(el => {
    el.classList.remove('active');
    if (el.textContent.includes(currentLang === 'tg' ? 'Тоҷикӣ' : currentLang === 'ru' ? 'Русский' : 'English')) {
      el.classList.add('active');
    }
  });
}

function toggleLangMenu() {
  document.getElementById('langMenu').classList.toggle('show');
}

// Close lang menu on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.lang-dropdown')) {
    document.getElementById('langMenu')?.classList.remove('show');
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.lang = currentLang;
  applyTranslations();
  updateLangMenu();
});
