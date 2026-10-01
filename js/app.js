/* ================= Ошхона Маркет — логика ================= */
(function () {
  'use strict';

  /* ---------- Утилитаҳо ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function money(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' смн.'; }
  function num(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function find(list, id) {
    for (var i = 0; i < list.length; i++) if (String(list[i].id) === String(id)) return list[i];
    return null;
  }
  function product(id) { return find(DB.PRODUCTS, id); }
  function uid(p) { return (p || 'id') + Math.random().toString(36).slice(2, 8); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function timeAgo(ts) {
    var d = Date.now() - ts;
    var m = Math.floor(d / 60000), h = Math.floor(d / 3600000), dd = Math.floor(d / 86400000);
    if (d < 60000) return 'ҳозир';
    if (m < 60) return m + ' дақиқа пеш';
    if (h < 24) return h + ' соат пеш';
    if (dd < 30) return dd + ' рӯз пеш';
    return new Date(ts).toLocaleDateString('ru-RU');
  }

  /* ---------- State ---------- */
  var KEY = 'oshxona_v1';
  var state = {
    cart: [], fav: [], compare: [], orders: [], notifications: [],
    theme: 'light', history: [], viewed: [], promo: null, reviews: {},
    user: { name: 'Меҳмон', phone: '', city: 'Хуҷанд', bonus: 340 }
  };

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        cart: state.cart, fav: state.fav, compare: state.compare, orders: state.orders,
        notifications: state.notifications, theme: state.theme, history: state.history,
        viewed: state.viewed, promo: state.promo, reviews: state.reviews, user: state.user
      }));
    } catch (e) { /* storage дастнорас аст */ }
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return;
      var d = JSON.parse(raw);
      ['cart', 'fav', 'compare', 'orders', 'notifications', 'history', 'viewed', 'reviews'].forEach(function (k) {
        if (Array.isArray(d[k])) state[k] = d[k];
        else if (d[k] && typeof d[k] === 'object') state[k] = d[k];
      });
      if (d.theme) state.theme = d.theme;
      if (d.promo) state.promo = d.promo;
      if (d.user) state.user = Object.assign(state.user, d.user);
    } catch (e) { /* номуайян */ }
  }

  /* ---------- Тост ---------- */
  function toast(title, text, kind) {
    var wrap = $('#toasts');
    var el = document.createElement('div');
    el.className = 'toast' + (kind ? ' ' + kind : '');
    el.setAttribute('role', 'status');
    var ic = kind === 'err' ? 'close' : kind === 'warn' ? 'percent' : 'check';
    el.innerHTML = '<span class="toast__icon">' + ICONS[ic] + '</span>' +
      '<span><b>' + esc(title) + '</b>' + (text ? '<span>' + esc(text) + '</span>' : '') + '</span>' +
      '<button class="toast__close" aria-label="Пӯшидан">' + ICONS.close + '</button>';
    el.querySelector('.toast__close').addEventListener('click', function () { hide(); });
    wrap.appendChild(el);
    var t = setTimeout(hide, 4000);
    function hide() {
      clearTimeout(t);
      el.classList.add('is-out');
      setTimeout(function () { el.remove(); }, 220);
    }
  }

  /* ---------- Огоҳномаҳо ---------- */
  function seedNotifications() {
    var now = Date.now();
    state.notifications = [
      { id: uid('n'), type: 'order', title: 'Фармоиши #1024 расонида шуд', text: 'Қуттии бо 3 маҳсулот ба пункти дарҷӯи Хуҷанд омадааст.', time: now - 5400000, read: false },
      { id: uid('n'), type: 'promo', title: 'Тамоси 10% бо коди OSHXONA10', text: 'Барои супориши якум. Аксия то охири моҳ.', time: now - 90000000, read: false },
      { id: uid('n'), type: 'price', title: 'Нархи «Чайники электрӣ 1,7 л» паст шуд', text: 'Аз 790 смн. ба 590 смн. — тезтар харед!', time: now - 260000000, read: true },
      { id: uid('n'), type: 'system', title: 'Хуш омадед ба Ошхона Маркет', text: 'Ирсоли ройгон барои фармоишҳо аз 500 смн.', time: now - 500000000, read: true }
    ];
  }

  function notify(type, title, text) {
    state.notifications.unshift({ id: uid('n'), type: type, title: title, text: text, time: Date.now(), read: false });
    if (state.notifications.length > 40) state.notifications.pop();
    save();
    renderNotifBadge();
    renderNotifPanel();
    var btn = $('#bellBtn');
    btn.classList.remove('is-active');
    if (btn.animate) btn.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-14deg)' }, { transform: 'rotate(14deg)' }, { transform: 'rotate(0)' }], { duration: 520, iterations: 2 });
  }

  function unreadCount() {
    return state.notifications.filter(function (n) { return !n.read; }).length;
  }

  /* ---------- Маҳсулот: ёрдамчӣ ---------- */
  function discountPct(p) {
    if (!p.old || p.old <= p.price) return 0;
    return Math.round((1 - p.price / p.old) * 100);
  }
  function inCart(id) { return !!find(state.cart, id); }
  function inFav(id) { return state.fav.indexOf(Number(id)) > -1; }
  function inCompare(id) { return state.compare.indexOf(Number(id)) > -1; }
  function cartCount() { return state.cart.reduce(function (a, c) { return a + c.qty; }, 0); }
  function cartSubtotal() {
    return state.cart.reduce(function (a, c) { var p = product(c.id); return p ? a + p.price * c.qty : a; }, 0);
  }
  function cartOld() {
    return state.cart.reduce(function (a, c) { var p = product(c.id); return p ? a + (p.old || p.price) * c.qty : a; }, 0);
  }
  function promoDiscount() {
    if (!state.promo) return 0;
    var code = DB.PROMO_CODES[state.promo];
    if (!code) return 0;
    return code.type === 'percent' ? Math.round(cartSubtotal() * code.value / 100) : Math.min(code.value, cartSubtotal());
  }
  function deliveryCost(method) {
    if (state.cart.length === 0) return 0;
    if (method === 'pickup') return 0;
    if (method === 'post') return 80;
    return cartSubtotal() - promoDiscount() >= 500 ? 0 : 40;
  }
  function grandTotal(method) { return Math.max(0, cartSubtotal() - promoDiscount() + deliveryCost(method)); }

  var checkout = { step: 1, method: 'courier', address: '', pay: 'card', comment: '', city: 'Хуҷанд', name: '', phone: '' };

  /* ---------- Роутер ---------- */
  function parseHash() {
    var h = location.hash.replace(/^#/, '') || '/';
    var qi = h.indexOf('?');
    var raw = qi > -1 ? h.slice(0, qi) : h;
    var qs = qi > -1 ? h.slice(qi + 1) : '';
    var params = {};
    qs.split('&').forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf('=');
      var k = decodeURIComponent(i > -1 ? kv.slice(0, i) : kv);
      var v = i > -1 ? decodeURIComponent(kv.slice(i + 1).replace(/\+/g, ' ')) : '1';
      if (k === 'cat' || k === 'brand') {
        params[k] = v ? v.split(',').filter(Boolean) : [];
      } else params[k] = v;
    });
    var segs = raw.split('/').filter(Boolean);
    return {
      path: '/' + (segs[0] || ''),
      id: segs[1] || params.id || null,
      params: params,
      raw: raw
    };
  }

  var catalogView = { page: 1, per: 12 };

  function render() {
    var r = parseHash();
    var app = $('#app');
    var html = '';
    closeCatalog(); closeCart(); closeNotif();

    if (r.path === '/' || r.path === '') html = viewHome();
    else if (r.path === '/catalog') html = viewCatalog(r.params);
    else if (r.path === '/product') html = viewProduct(r.id);
    else if (r.path === '/cart') html = viewCartPage();
    else if (r.path === '/checkout') html = viewCheckout();
    else if (r.path === '/orders') html = viewOrders();
    else if (r.path === '/order') html = viewOrder(r.id);
    else if (r.path === '/favorites') html = viewFavorites();
    else if (r.path === '/compare') html = viewCompare();
    else if (r.path === '/profile') html = viewProfile();
    else if (r.path === '/deals') html = viewDeals();
    else if (r.path === '/search') html = viewCatalog({ q: r.params.q || '', sort: 'popular' });
    else html = viewNotFound();

    app.innerHTML = html;
    renderNav();
    afterRender(r);
    renderCompareBar();
    try { window.scrollTo(0, 0); } catch (e) { /* пешниҳод нест */ }
  }

  /* ---------- Header / nav ---------- */
  var NAV = [
    { href: '#/', label: 'Асосӣ', icon: 'home' },
    { href: '#/catalog', label: 'Каталог', icon: 'grid' },
    { href: '#/deals', label: 'Тамоси рӯз', icon: 'bolt', hot: true },
    { href: '#/favorites', label: 'Дӯстдоштаҳо', icon: 'heart' },
    { href: '#/orders', label: 'Фармоишҳо', icon: 'box' },
    { href: '#/profile', label: 'Профил', icon: 'user' }
  ];

  function renderHeader() {
    $('#catalogBtn').innerHTML = ICONS.menu;
    $('#logoMark').innerHTML = ICONS.box;
    $('#footerLogoMark').innerHTML = ICONS.box;
    $('#searchIcon').innerHTML = ICONS.search;
    $('#themeBtn').innerHTML = state.theme === 'dark' ? ICONS.sun : ICONS.moon;
    $('#bellBtn').innerHTML = ICONS.bell + '<span class="badge-count is-hidden" id="notifBadge">0</span>';
    $('#favBtn').innerHTML = ICONS.heart(false) + '<span class="badge-count is-hidden" id="favBadge">0</span>';
    $('#cartIconWrap').innerHTML = ICONS.cart;
    $('#profileBtn').innerHTML = ICONS.user;
    $('#fabTop').innerHTML = ICONS.arrowUp;
    $('#catalogBtn').setAttribute('aria-label', 'Каталог');

    var nav = NAV.map(function (n) {
      var cur = location.hash === n.href || (n.href !== '#/' && location.hash.indexOf(n.href) === 0);
      return '<a class="nav-link' + (cur ? ' is-current' : '') + (n.hot ? ' hot' : '') + '" href="' + n.href + '">' +
        ICONS[n.icon] + '<span>' + n.label + '</span></a>';
    }).join('');
    $('#navLinks').innerHTML = nav +
      '<span class="nav-spacer"></span>' +
      '<a class="nav-link" href="#/catalog?sort=rating">' + ICONS.star + '<span>Маҳсулоти беҳтарин</span></a>' +
      '<a class="nav-link" href="#/catalog?sort=new">' + ICONS.sparkle + '<span>Навтарин</span></a>' +
      '<a class="nav-link" href="#/compare">' + ICONS.compare + '<span>Муқоиса</span></a>';

    $('#mobileNav').innerHTML = NAV.map(function (n) {
      var cur = location.hash === n.href || (n.href !== '#/' && location.hash.indexOf(n.href) === 0);
      return '<button class="' + (cur ? 'is-on' : '') + '" data-go="' + n.href + '">' + ICONS[n.icon] + '<span>' + n.label + '</span></button>';
    }).join('') + '<button data-go="#/catalog">' + ICONS.grid + '<span>Каталог</span></button>';

    $('#footerCats').innerHTML = DB.CATEGORIES.map(function (c) {
      return '<li><a href="#/catalog?cat=' + c.id + '">' + esc(c.name) + '</a></li>';
    }).join('');

    $('#catalogMenuBody').innerHTML = DB.CATEGORIES.map(function (c) {
      var cnt = DB.PRODUCTS.filter(function (p) { return p.cat === c.id; }).length;
      return '<button class="cat-row" data-go="#/catalog?cat=' + c.id + '" style="--h:' + c.hue + '">' +
        '<span class="cat-row__icon">' + ART[c.icon] + '</span>' +
        '<span><b>' + esc(c.name) + '</b><span>' + cnt + ' маҳсулот</span></span>' +
        '<span class="cat-row__go">' + ICONS.chevron + '</span></button>';
    }).join('');
  }

  function renderNav() { renderHeader(); }

  function renderBadges() {
    var cc = cartCount(), un = unreadCount(), fv = state.fav.length;
    setBadge('#cartCount', cc);
    setBadge('#favBadge', fv);
    setBadge('#notifBadge', un);
    $('#cartTotalBadge').textContent = money(cartSubtotal());
    var cnt = $('#cartItemsCount');
    if (cnt) cnt.textContent = cc + ' маҳсулот';
  }
  function setBadge(sel, n) {
    var el = $(sel);
    if (!el) return;
    el.textContent = n > 99 ? '99+' : n;
    el.classList.toggle('is-hidden', n === 0);
  }

  /* ---------- Карточкаи маҳсулот ---------- */
  function badgesHtml(p) {
    var out = '';
    var d = discountPct(p);
    if (d) out += '<span class="tag tag-sale">−' + d + '%</span>';
    if (p.badges.indexOf('hit') > -1) out += '<span class="tag tag-hit">' + ICONS.bolt + 'Хит</span>';
    if (p.badges.indexOf('new') > -1) out += '<span class="tag tag-new">' + ICONS.sparkle + 'Нав</span>';
    return out ? '<div class="p-card__badges">' + out + '</div>' : '';
  }

  function starsHtml(rating, size) {
    var out = '';
    for (var i = 1; i <= 5; i++) out += ICONS.star(i <= Math.round(rating));
    return '<span class="stars" style="display:inline-flex;gap:2px">' + out + '</span>';
  }

  function cardHtml(p, list) {
    var fav = inFav(p.id), cmp = inCompare(p.id);
    return '<article class="p-card" style="--h:' + p.hue + '">' +
      '<div class="p-card__media" data-act="open" data-id="' + p.id + '" role="button" tabindex="0" aria-label="' + esc(p.name) + '">' +
        badgesHtml(p) +
        '<button class="p-card__fav' + (fav ? ' is-on' : '') + '" data-act="fav" data-id="' + p.id + '" aria-label="Дӯстдошта" aria-pressed="' + fav + '">' + ICONS.heart(fav) + '</button>' +
        ART[p.art] +
      '</div>' +
      '<button class="p-card__compare' + (cmp ? ' is-on' : '') + '" data-act="cmp" data-id="' + p.id + '">' + (cmp ? 'Дар муқоиса' : 'Муқоиса') + '</button>' +
      '<div class="p-card__body">' +
        '<div class="p-card__rating">' + ICONS.star(true) + p.rating.toFixed(1) + ' <span style="font-weight:700">(' + p.reviews + ' шарҳ)</span></div>' +
        '<h3 class="p-card__name" data-act="open" data-id="' + p.id + '">' + esc(p.name) + '</h3>' +
        '<div class="p-card__brand">' + esc(p.brand) + ' · ' + esc(p.country) + '</div>' +
        '<div class="p-card__price"><span class="price-now">' + money(p.price) + '</span>' +
          (p.old ? '<span class="price-old">' + num(p.old) + '</span>' : '') + '</div>' +
        '<div class="p-card__stock' + (p.stock === 0 ? ' out' : p.stock < 5 ? ' low' : '') + '">' +
          (p.stock === 0 ? 'Мавҷуд нест' : p.stock < 5 ? 'Танҳо ' + p.stock + ' дона' : 'Мавҷуд аст') + '</div>' +
        '<div class="p-card__foot">' +
          '<button class="btn btn-primary btn-sm" data-act="add" data-id="' + p.id + '">' + ICONS.cart + 'Ба сабад</button>' +
          '<button class="btn btn-outline btn-sm" data-act="buy" data-id="' + p.id + '">Харидан</button>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function gridHtml(list, listMode) {
    if (!list.length) {
      return '<div class="empty" style="grid-column:1/-1"><span class="empty__icon">' + ICONS.search +
        '</span><h3>Чиз ёфт нашуд</h3><p>Калимаҳои ҷустуҷӯро иваз кунед ё филтрҳоро тоза намоед.</p>' +
        '<button class="btn btn-primary" data-act="clear-filters">Филтрҳоро тоза кардан</button></div>';
    }
    return '<div class="p-grid' + (listMode ? ' list' : '') + '">' + list.map(function (p) { return cardHtml(p, listMode); }).join('') + '</div>';
  }

  /* ---------- Саҳифаи асосӣ ---------- */
  function viewHome() {
    var deals = DB.PRODUCTS.filter(function (p) { return discountPct(p) > 0; }).sort(function (a, b) { return discountPct(b) - discountPct(a); });
    var top = DB.PRODUCTS.slice().sort(function (a, b) { return b.rating - a.rating || b.reviews - a.reviews; }).slice(0, 8);
    var news = DB.PRODUCTS.filter(function (p) { return p.badges.indexOf('new') > -1; }).slice(0, 4);
    var viewed = state.viewed.map(product).filter(Boolean).slice(0, 6);

    var slides = DB.BANNERS.map(function (b, i) {
      return '<div class="hero-slide" data-slide="' + i + '" style="background:linear-gradient(135deg,hsl(' + b.hue + ' 72% 34%),hsl(' + ((b.hue + 40) % 360) + ' 68% 26%))">' +
        '<span class="hero-slide__bg" aria-hidden="true"></span>' +
        '<span class="hero-slide__blob" style="width:280px;height:280px;background:hsl(' + ((b.hue + 30) % 360) + ' 90% 60%);top:-90px;right:12%"></span>' +
        '<span class="hero-slide__blob" style="width:180px;height:180px;background:hsl(' + ((b.hue + 300) % 360) + ' 90% 60%);bottom:-60px;left:38%"></span>' +
        '<span class="hero-slide__art">' + (ART[b.art] || '') + '</span>' +
        '<span class="hero-tag">' + ICONS.bolt + b.tag + '</span>' +
        '<h2>' + esc(b.title) + '</h2><p>' + esc(b.text) + '</p>' +
        '<a class="btn btn-primary" href="' + b.link + '">' + esc(b.cta) + ICONS.arrowRight + '</a>' +
      '</div>';
    }).join('');

    var usps = [
      { i: 'truck', t: 'Ирсоли ройгон', s: 'Барои фармоишҳо аз 500 смн. Дар ҷой — 1–2 рӯз' },
      { i: 'shield', t: 'Кафолати 12 моҳ', s: 'Расмӣ ва бо чек. Дурусткунӣ ё иваз' },
      { i: 'refresh', t: 'Баргашти 30 рӯз', s: 'Агар маҳсулот мувофиқ набошад' },
      { i: 'chat', t: 'Пуштикӣ 24/7', s: 'Машварат дар бораи интихоб' }
    ].map(function (u) {
      return '<div class="usp-card"><span class="usp-card__icon">' + ICONS[u.i] + '</span><b>' + u.t + '</b><span>' + u.s + '</span></div>';
    }).join('');

    return '<div class="container">' +
      '<section class="hero">' +
        '<div class="hero-slider" id="heroSlider" aria-roledescription="карусел">' +
          '<div class="hero-track" id="heroTrack">' + slides + '</div>' +
          '<button class="hero-arrow prev" data-act="hero" data-dir="-1" aria-label="Пешина">' + ICONS.chevron + '</button>' +
          '<button class="hero-arrow next" data-act="hero" data-dir="1" aria-label="Баъдӣ">' + ICONS.chevron + '</button>' +
          '<div class="hero-dots" id="heroDots">' + DB.BANNERS.map(function (_, i) {
            return '<button class="hero-dot' + (i === 0 ? ' is-active' : '') + '" data-act="hero-dot" data-i="' + i + '" aria-label="Слайди ' + (i + 1) + '"></button>';
          }).join('') + '</div>' +
        '</div>' +
        '<div class="hero-side">' + usps + '</div>' +
      '</section>' +

      '<section class="section"><div class="section-head"><div><h2>Категорияҳо</h2><p>Ҳар чизе ки барои ошхона лозим аст</p></div>' +
        '<a class="btn btn-outline btn-sm" href="#/catalog">Ҳамаи каталог' + ICONS.arrowRight + '</a></div>' +
        '<div class="cat-grid">' + DB.CATEGORIES.map(function (c) {
          var cnt = DB.PRODUCTS.filter(function (p) { return p.cat === c.id; }).length;
          return '<button class="cat-tile" data-go="#/catalog?cat=' + c.id + '" style="--h:' + c.hue + '">' +
            '<span class="cat-tile__icon">' + ART[c.icon] + '</span><b>' + esc(c.name) + '</b><span>' + cnt + ' маҳсулот</span></button>';
        }).join('') + '</div></section>' +

      '<section class="section"><div class="deals-strip"><div class="deals-strip__head">' +
        '<div><h2>' + ICONS.bolt + ' Тамоси рӯз</h2><p>Нархҳои махсус то шабонарӯзӣ</p></div>' +
        '<div class="countdown" id="countdown" aria-label="Вақти боқимонда">' +
          '<div class="countdown__cell"><b id="cdH">00</b><span>соат</span></div>' +
          '<div class="countdown__cell"><b id="cdM">00</b><span>дақ</span></div>' +
          '<div class="countdown__cell"><b id="cdS">00</b><span>сон</span></div></div></div>' +
        '<div class="deals-row">' + deals.slice(0, 8).map(cardHtml).join('') + '</div></div></section>' +

      '<section class="section"><div class="section-head"><div><h2>Маҳсулоти беҳтарин</h2><p>Бо рейтинги баландтарини харидорон</p></div>' +
        '<a class="btn btn-outline btn-sm" href="#/catalog?sort=rating">Ҳама' + ICONS.arrowRight + '</a></div>' +
        gridHtml(top) + '</section>' +

      (news.length ? '<section class="section"><div class="section-head"><div><h2>Навтарин</h2><p>Тазоҷа дар мағоза</p></div>' +
        '<a class="btn btn-outline btn-sm" href="#/catalog?sort=new">Ҳама' + ICONS.arrowRight + '</a></div>' + gridHtml(news) + '</section>' : '') +

      (viewed.length ? '<section class="section"><div class="section-head"><div><h2>Шумо дидӣ</h2><p>Маҳсулоти охирин</p></div></div>' + gridHtml(viewed) + '</section>' : '') +

      '<section class="section"><div class="section-head"><div><h2>Брендҳо</h2><p>Ҳамкорони расмӣ</p></div></div>' +
        '<div class="cat-grid">' + DB.brands().slice(0, 10).map(function (b) {
          return '<button class="cat-tile" data-go="#/catalog?brand=' + encodeURIComponent(b.name) + '" style="--h:150">' +
            '<span class="cat-tile__icon" style="background:var(--muted);color:var(--fg)">' + ICONS.tag + '</span>' +
            '<b>' + esc(b.name) + '</b><span>' + b.count + ' маҳсулот</span></button>';
        }).join('') + '</div></section>' +

      '<section class="section"><div class="section-head"><div><h2>Чаро Ошхона Маркет?</h2><p>Тарзи нави харидани маҳсулоти ошхона</p></div></div>' +
        '<div class="p-grid" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">' +
          [1, 2, 3].map(function (i) {
            return '<div class="card-box"><h3>' + ['Интихоби ҳаррӯза', 'Сифати тафтишшуда', 'Ирсоли тез'][i - 1] + '</h3>' +
              '<p style="margin:0;color:var(--muted-fg);font-weight:600">' + [
                '43 маҳсулот дар 8 категория — ҳама чиз барои ошхонаи шумо дар як ҷо.',
                'Ҳар маҳсулот пеш аз фурӯш тафтиш мешавад. Фақат брендҳои боваринока.',
                'Дар ҷой ҳангоми супориши пеш аз 18:00. Ирсоли ройгон аз 500 смн.'][i - 1] + '</p>' +
              '<a class="btn btn-ghost btn-sm" href="#/catalog" style="width:max-content">Каталог' + ICONS.arrowRight + '</a></div>';
          }).join('') + '</div></section>' +
    '</div>';
  }

  /* ---------- Каталог ---------- */
  var SORTS = [
    { v: 'popular', l: 'Машҳуртарин' },
    { v: 'price-asc', l: 'Нарх: паст → баланд' },
    { v: 'price-desc', l: 'Нарх: баланд → паст' },
    { v: 'rating', l: 'Рейтинги баланд' },
    { v: 'reviews', l: 'Шарҳҳои зиёд' },
    { v: 'discount', l: 'Тамоси калон' },
    { v: 'new', l: 'Навтарин' }
  ];

  function currentFilters(params) {
    var pr = DB.priceRange();
    var f = {
      cat: (params.cat || []).slice(),
      brand: (params.brand || []).slice(),
      min: params.min ? Number(params.min) : pr.min,
      max: params.max ? Number(params.max) : pr.max,
      rating: params.rating ? Number(params.rating) : 0,
      disc: params.disc === '1',
      stock: params.stock === '1',
      q: params.q || '',
      sort: SORTS.some(function (s) { return s.v === params.sort; }) ? params.sort : 'popular'
    };
    return f;
  }

  function applyFilters(f) {
    var list = DB.PRODUCTS.filter(function (p) {
      if (f.cat.length && f.cat.indexOf(p.cat) === -1) return false;
      if (f.brand.length && f.brand.indexOf(p.brand) === -1) return false;
      if (p.price < f.min || p.price > f.max) return false;
      if (f.rating && p.rating < f.rating) return false;
      if (f.disc && !discountPct(p)) return false;
      if (f.stock && p.stock === 0) return false;
      if (f.q) {
        var q = f.q.toLowerCase();
        var hay = (p.name + ' ' + p.brand + ' ' + (p.desc || '') + ' ' + DB.catById(p.cat).name).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    list.sort(function (a, b) {
      switch (f.sort) {
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'rating': return b.rating - a.rating;
        case 'reviews': return b.reviews - a.reviews;
        case 'discount': return discountPct(b) - discountPct(a);
        case 'new': return (b.added || '').localeCompare(a.added || '');
        default: return (b.sold * b.rating) - (a.sold * a.rating);
      }
    });
    return list;
  }

  function viewCatalog(params) {
    var f = currentFilters(params);
    var all = applyFilters(f);
    var shown = all.slice(0, catalogView.page * catalogView.per);
    var pr = DB.priceRange();
    var activePills = [];

    f.cat.forEach(function (c) {
      var cat = DB.catById(c);
      if (cat) activePills.push({ k: 'cat', v: c, t: cat.name });
    });
    f.brand.forEach(function (b) { activePills.push({ k: 'brand', v: b, t: b }); });
    if (f.min > pr.min || f.max < pr.max) activePills.push({ k: 'price', v: '', t: num(f.min) + '–' + num(f.max) + ' смн.' });
    if (f.rating) activePills.push({ k: 'rating', v: f.rating, t: 'Рейтинг ' + f.rating + '+' });
    if (f.disc) activePills.push({ k: 'disc', v: '1', t: 'Танҳо бо тамос' });
    if (f.stock) activePills.push({ k: 'stock', v: '1', t: 'Мавҷуд' });
    if (f.q) activePills.push({ k: 'q', v: '', t: '«' + f.q + '»' });

    function pillUrl(pill) {
      var np = Object.assign({}, params);
      if (pill.k === 'price') { delete np.min; delete np.max; }
      else if (pill.k === 'rating') { delete np.rating; }
      else if (pill.k === 'disc' || pill.k === 'stock' || pill.k === 'q') { delete np[pill.k]; }
      else {
        var arr = (np[pill.k] || []).filter(function (x) { return String(x) !== String(pill.v); });
        if (arr.length) np[pill.k] = arr; else delete np[pill.k];
      }
      var qs = Object.keys(np).map(function (k) {
        var v = np[k];
        if (Array.isArray(v)) return v.length ? k + '=' + encodeURIComponent(v.join(',')) : '';
        return k + '=' + encodeURIComponent(v);
      }).filter(Boolean).join('&');
      return '#/catalog' + (qs ? '?' + qs : '');
    }

    var title = 'Каталог';
    if (f.cat.length === 1 && DB.catById(f.cat[0])) title = DB.catById(f.cat[0]).name;
    if (f.q) title = 'Ҷустуҷӯ: ' + f.q;

    return '<div class="container">' +
      '<div class="breadcrumbs"><a href="#/">Асосӣ</a>' + ICONS.chevron + '<span>' + esc(title) + '</span></div>' +
      '<div class="page-head"><h1>' + esc(title) + '</h1><span class="count">' + all.length + ' маҳсулот ёфт шуд</span></div>' +

      '<div class="catalog-layout">' +
        '<aside class="filters" id="filtersPanel" aria-label="Филтрҳо">' +
          '<div class="filters__head"><h2>' + ICONS.filter + 'Филтрҳо</h2>' +
            '<button class="btn btn-ghost btn-sm" data-act="clear-filters">Тоза кардан</button></div>' +
          '<div class="filters__body">' +
            '<div class="f-group"><h3>Категория</h3>' + DB.CATEGORIES.map(function (c) {
              var cnt = DB.PRODUCTS.filter(function (p) { return p.cat === c.id; }).length;
              var on = f.cat.indexOf(c.id) > -1;
              return '<label class="f-check"><input type="checkbox" data-act="fcat" value="' + c.id + '"' + (on ? ' checked' : '') + '>' +
                '<span>' + esc(c.name) + '</span><span class="cnt">' + cnt + '</span></label>';
            }).join('') + '</div>' +

            '<div class="f-group"><h3>Нарх</h3><div class="f-price">' +
              '<input type="number" id="fMin" value="' + f.min + '" aria-label="Нархи аз" min="0">' +
              '<span>—</span><input type="number" id="fMax" value="' + f.max + '" aria-label="Нарх то" min="0"></div>' +
              '<input type="range" class="f-range" id="fRange" min="' + pr.min + '" max="' + pr.max + '" value="' + f.max + '" aria-label="Нарх">' +
              '<button class="btn btn-ghost btn-sm btn-block" style="margin-top:10px" data-act="apply-price">Татбиқ кардан</button></div>' +

            '<div class="f-group"><h3>Бренд</h3>' + DB.brands().map(function (b) {
              var on = f.brand.indexOf(b.name) > -1;
              return '<label class="f-check"><input type="checkbox" data-act="fbrand" value="' + esc(b.name) + '"' + (on ? ' checked' : '') + '>' +
                '<span>' + esc(b.name) + '</span><span class="cnt">' + b.count + '</span></label>';
            }).join('') + '</div>' +

            '<div class="f-group"><h3>Рейтинг</h3><div class="f-stars" role="radiogroup" aria-label="Рейтинг">' +
              [5, 4, 3].map(function (r) {
                return '<button data-act="frating" data-v="' + r + '" aria-label="Аз ' + r + '" style="background:none;border:0;padding:0;cursor:pointer">' + ICONS.star(true) + '</button>';
              }).join('') +
              (f.rating ? '<button class="chip" data-act="frating" data-v="0">' + f.rating + '+</button>' : '<span style="font-size:12.5px;color:var(--muted-fg);font-weight:700">' + (f.rating ? f.rating + ' ва боло' : 'Ҳар рейтинг') + '</span>') +
            '</div></div>' +

            '<div class="f-group"><h3>Дигар</h3>' +
              '<label class="f-check"><input type="checkbox" data-act="fdisc"' + (f.disc ? ' checked' : '') + '><span>Танҳо бо тамос</span></label>' +
              '<label class="f-check"><input type="checkbox" data-act="fstock"' + (f.stock ? ' checked' : '') + '><span>Танҳо мавҷуд</span></label>' +
            '</div>' +
          '</div>' +
          '<div style="padding:0 16px 16px"><button class="btn btn-primary btn-block filters__close" data-act="close-filters">' + all.length + ' маҳсулотро нишон деҳ</button></div>' +
        '</aside>' +

        '<div>' +
          '<div class="toolbar">' +
            '<button class="btn btn-outline btn-sm filters-toggle" data-act="open-filters">' + ICONS.filter + 'Филтрҳо</button>' +
            '<span class="toolbar__count">' + shown.length + ' аз ' + all.length + '</span>' +
            '<label class="toolbar__sort">Тартиб: <select id="sortSel" aria-label="Тартибдодан">' +
              SORTS.map(function (s) { return '<option value="' + s.v + '"' + (f.sort === s.v ? ' selected' : '') + '>' + s.l + '</option>'; }).join('') +
            '</select></label>' +
            '<span style="flex:1"></span>' +
            '<span class="view-toggle" role="group" aria-label="Намуди намоиш">' +
              '<button id="viewGrid" class="' + (params.view !== 'list' ? 'is-on' : '') + '" data-act="view" data-v="grid" aria-label="Шабақ">' + ICONS.grid + '</button>' +
              '<button id="viewList" class="' + (params.view === 'list' ? 'is-on' : '') + '" data-act="view" data-v="list" aria-label="Рӯйхат">' + ICONS.list + '</button>' +
            '</span>' +
          '</div>' +
          '<div class="active-filters">' + activePills.map(function (p) {
            return '<a class="f-pill" href="' + pillUrl(p) + '">' + esc(p.t) + ICONS.close + '</a>';
          }).join('') + (activePills.length ? '<button class="chip" data-act="clear-filters">Ҳамаи филтрҳоро тоза кардан</button>' : '') + '</div>' +
          (all.length ? '<div id="catalogResults">' + gridHtml(shown, params.view === 'list') + '</div>' : '<div class="empty"><span class="empty__icon">' + ICONS.search + '</span><h3>Чиз ёфт нашуд</h3><p>Филтрҳоро иваз кунед ё тоза намоед.</p><button class="btn btn-primary" data-act="clear-filters">Филтрҳоро тоза кардан</button></div>') +
          (all.length > shown.length ? '<div style="text-align:center;margin-top:22px"><button class="btn btn-outline btn-lg" data-act="more">' + (all.length - shown.length) + ' маҳсулоти дигар' + ICONS.chevronDown + '</button></div>' : '') +
        '</div>' +
      '</div></div>';
  }

  /* ---------- Саҳифаи маҳсулот ---------- */
  function viewProduct(id) {
    var p = product(id);
    if (!p) return viewNotFound();
    if (state.viewed.indexOf(p.id) === -1) {
      state.viewed.unshift(p.id);
      state.viewed = state.viewed.slice(0, 12);
      save();
    }
    var cat = DB.catById(p.cat);
    var myReviews = state.reviews[p.id] || [];
    var base = DB.seedReviews(p);
    var reviews = myReviews.concat(base);
    var dist = [5, 4, 3, 2, 1].map(function (r) {
      return reviews.filter(function (x) { return x.rating === r; }).length;
    });
    var similar = DB.PRODUCTS.filter(function (x) { return x.cat === p.cat && x.id !== p.id; }).slice(0, 4);
    var d = discountPct(p);
    var vars = p.variants ? p.variants.map(function (v, i) {
      return '<button class="var-btn' + (i === 0 ? ' is-on' : '') + '" data-act="variant" data-v="' + esc(v.n) + '">' +
        '<span class="var-dot" style="background:' + v.c + '"></span>' + esc(v.n) + '</button>';
    }).join('') : '';

    return '<div class="container">' +
      '<div class="breadcrumbs"><a href="#/">Асосӣ</a>' + ICONS.chevron +
        '<a href="#/catalog">Каталог</a>' + ICONS.chevron +
        '<a href="#/catalog?cat=' + p.cat + '">' + esc(cat ? cat.name : '') + '</a>' + ICONS.chevron +
        '<span>' + esc(p.name) + '</span></div>' +

      '<div class="product-layout">' +
        '<div class="gallery" style="--h:' + p.hue + '">' +
          '<div class="gallery__main" id="galleryMain">' + ART[p.art] + '</div>' +
          '<div class="gallery__thumbs">' + [0, 1, 2, 3].map(function (i) {
            return '<button class="gallery__thumb' + (i === 0 ? ' is-on' : '') + '" data-act="thumb" data-i="' + i + '" aria-label="Акси ' + (i + 1) + '">' +
              (i === 0 ? ART[p.art] : '<span style="color:var(--muted-fg)">' + [ICONS.box, ICONS.tag, ICONS.shield, ICONS.sparkle][i] + '</span>') + '</button>';
          }).join('') + '</div>' +
        '</div>' +

        '<div class="p-info">' +
          '<div class="p-info__head">' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap">' + badgesHtml(p) + '<span class="tag tag-info">' + ICONS.tag + esc(p.brand) + '</span></div>' +
            '<h1 class="p-info__title">' + esc(p.name) + '</h1>' +
            '<div class="p-info__meta"><span class="p-info__rating">' + ICONS.star(true) + p.rating.toFixed(1) + '</span>' +
              '<span>' + p.reviews + ' шарҳ</span><span>·</span><span>' + p.sold + ' маро заказ кардаанд</span><span>·</span><span>Код: ' + p.id + '</span></div>' +
          '</div>' +

          '<div class="price-box">' +
            '<div class="price-box__row"><span class="price-box__now" id="pPrice">' + money(p.price) + '</span>' +
              (p.old ? '<span class="price-box__old">' + num(p.old) + ' смн.</span><span class="price-box__save">Эҷод: ' + num(p.old - p.price) + ' смн.</span>' : '') + '</div>' +
            '<p class="price-box__hint">' + ICONS.percent + 'Бо коди <b>OSHXONA10</b> — 10% арзонтар. ' +
              (p.stock ? 'Мавҷуд аст (' + p.stock + ' дона)' : 'Мавҷуд нест') + '</p>' +
            (vars ? '<div class="p-variants"><span>Интихоб кунед</span><div class="var-list" id="varList">' + vars + '</div></div>' : '') +
            '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">' +
              '<div class="qty"><button data-act="qdec" aria-label="Кам">' + ICONS.minus + '</button>' +
                '<b id="pQty">1</b><button data-act="qinc" aria-label="Зиёд">' + ICONS.plus + '</button></div>' +
              '<div class="p-actions" style="flex:1;min-width:240px">' +
                '<button class="btn btn-primary btn-lg" data-act="add" data-id="' + p.id + '">' + ICONS.cart + 'Ба сабад</button>' +
                '<button class="btn btn-accent btn-lg" data-act="buy" data-id="' + p.id + '">Харидан' + ICONS.bolt + '</button>' +
              '</div>' +
              '<button class="icon-btn' + (inFav(p.id) ? ' is-active' : '') + '" data-act="fav" data-id="' + p.id + '" aria-label="Дӯстдошта" aria-pressed="' + inFav(p.id) + '">' + ICONS.heart(inFav(p.id)) + '</button>' +
              '<button class="icon-btn' + (inCompare(p.id) ? ' is-active' : '') + '" data-act="cmp" data-id="' + p.id + '" aria-label="Муқоиса">' + ICONS.compare + '</button>' +
            '</div>' +
          '</div>' +

          '<div class="delivery-card"><h3>Ирсол ва пардохт</h3>' +
            '<div class="row">' + ICONS.truck + '<span>Курьер ба ҷой — <b>1–2 рӯз</b>, ройгон аз 500 смн.</span></div>' +
            '<div class="row">' + ICONS.pin + '<span>Пункти дарҷӯӣ дар Хуҷанд — <b>имрӯз</b>, ройгон</span></div>' +
            '<div class="row">' + ICONS.wallet + '<span>Пардохт бо корт, Alif ё нақд ҳангоми қабул</span></div>' +
            '<div class="row">' + ICONS.shield + '<span>Кафолати расмӣ: <b>' + esc(p.warranty) + '</b>, баргашт то 30 рӯз</span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<section class="section">' +
        '<div class="tabs" role="tablist">' +
          '<button class="tab is-on" data-act="tab" data-t="desc" role="tab" aria-selected="true">Тавсиф</button>' +
          '<button class="tab" data-act="tab" data-t="specs" role="tab" aria-selected="false">Хусусиятҳо</button>' +
          '<button class="tab" data-act="tab" data-t="reviews" role="tab" aria-selected="false">Шарҳҳо (' + reviews.length + ')</button>' +
        '</div>' +
        '<div class="panel is-on" data-panel="desc">' +
          '<div class="card-box"><h3>Дар бораи маҳсулот</h3>' +
            '<p style="margin:0;font-size:15px;line-height:1.65;color:var(--muted-fg);font-weight:600">' + esc(p.desc || 'Маҳсулоти сифати баланд барои ошхонаи шумо.') + '</p>' +
            '<div class="stat-row" style="margin-top:4px">' +
              '<div class="stat"><b>' + esc(p.country) + '</b><span>Кишвари истеҳсол</span></div>' +
              '<div class="stat"><b>' + esc(p.warranty) + '</b><span>Кафолат</span></div>' +
              '<div class="stat"><b>' + (p.weight || '—') + '</b><span>Вазн</span></div>' +
              '<div class="stat"><b>' + p.sold + '</b><span>Фурӯш</span></div>' +
            '</div></div>' +
        '</div>' +
        '<div class="panel" data-panel="specs">' +
          (Object.keys(p.specs).length ? '<table class="spec-table">' + Object.keys(p.specs).map(function (k) {
            return '<tr><th>' + esc(k) + '</th><td>' + esc(p.specs[k]) + '</td></tr>';
          }).join('') + '</table>' : '<div class="empty"><span class="empty__icon">' + ICONS.info + '</span><h3>Маълумот нест</h3><p>Барои ин маҳсулот хусусиятҳо ҳанӯз илова нашудаанд.</p></div>') +
        '</div>' +
        '<div class="panel" data-panel="reviews">' +
          '<div class="reviews-summary">' +
            '<div class="rating-big"><b>' + p.rating.toFixed(1) + '</b>' + starsHtml(p.rating) + '<span>' + p.reviews + ' шарҳ</span></div>' +
            '<div class="rating-bars">' + [5, 4, 3, 2, 1].map(function (r, i) {
              var pct = p.reviews ? Math.round(dist[i] / reviews.length * 100) : 0;
              return '<div class="rating-bar"><span>' + r + ' ситора</span><span class="rating-bar__track"><span class="rating-bar__fill" style="width:' + pct + '%"></span></span><span class="rating-bar__val">' + pct + '%</span></div>';
            }).join('') + '</div>' +
          '</div>' +
          '<div style="margin-bottom:16px"><button class="btn btn-primary" data-act="review">' + ICONS.chat + 'Шарҳ нависед</button></div>' +
          reviews.map(function (r) {
            return '<div class="review"><div class="review__head">' +
              '<span class="review__avatar">' + esc(r.author.slice(0, 1)) + '</span>' +
              '<span><span class="review__name">' + esc(r.author) + '</span><br><span class="review__date">' + esc(r.date) + '</span></span>' +
              '<span class="review__stars">' + starsHtml(r.rating) + '</span></div>' +
              '<p>' + esc(r.text) + '</p>' +
              (r.photos ? '<div class="review__photos">' + [0, 1].slice(0, r.photos).map(function () {
                return '<span class="review__photo">' + ART[p.art] + '</span>';
              }).join('') + '</div>' : '') +
              '<div class="review__foot"><button class="review__helpful" data-act="helpful">' + ICONS.check + 'Фоидаовар (' + r.helpful + ')</button>' +
                '<span>Маҳсулотро тавсия мекунам</span></div></div>';
          }).join('') +
        '</div>' +
      '</section>' +

      (similar.length ? '<section class="section"><div class="section-head"><div><h2>Маҳсулоти монанд</h2></div>' +
        '<a class="btn btn-outline btn-sm" href="#/catalog?cat=' + p.cat + '">Ҳама' + ICONS.arrowRight + '</a></div>' +
        gridHtml(similar) + '</section>' : '') +
    '</div>';
  }

  /* ---------- Сабад (саҳифа) ---------- */
  function cartItemHtml(c) {
    var p = product(c.id);
    if (!p) return '';
    var lineTotal = p.price * c.qty;
    return '<div class="cart-item" style="--h:' + p.hue + '">' +
      '<div class="cart-item__media" data-act="open" data-id="' + p.id + '">' + ART[p.art] + '</div>' +
      '<div><div class="cart-item__name" data-act="open" data-id="' + p.id + '">' + esc(p.name) + '</div>' +
        (c.variant ? '<div class="cart-item__var">Интихоб: ' + esc(c.variant) + '</div>' : '') +
        '<div class="cart-item__bottom">' +
          '<div class="qty sm"><button data-act="qdec" data-id="' + p.id + '" aria-label="Кам">' + ICONS.minus + '</button>' +
            '<b>' + c.qty + '</b><button data-act="qinc" data-id="' + p.id + '" aria-label="Зиёд">' + ICONS.plus + '</button></div>' +
          '<span class="cart-item__price">' + money(lineTotal) + '</span>' +
          (p.old ? '<span class="cart-item__old">' + num(p.old * c.qty) + ' смн.</span>' : '') +
        '</div></div>' +
      '<button class="cart-item__remove" data-act="rm" data-id="' + p.id + '" aria-label="Ҳазф">' + ICONS.trash + '</button>' +
    '</div>';
  }

  function viewCartPage() {
    if (!state.cart.length) {
      return '<div class="container" style="padding:30px 20px 60px"><div class="empty"><span class="empty__icon">' + ICONS.cart +
        '</span><h3>Сабад холӣ аст</h3><p>Маҳсулоти дилхоҳро интихоб кунед — мо ба шумо бо тахфиф мерасонем.</p>' +
        '<a class="btn btn-primary btn-lg" href="#/catalog">Каталогро кушоед' + ICONS.arrowRight + '</a></div></div>';
    }
    var sub = cartSubtotal();
    return '<div class="container" style="padding:20px 20px 60px">' +
      '<div class="breadcrumbs"><a href="#/">Асосӣ</a>' + ICONS.chevron + '<span>Сабад</span></div>' +
      '<div class="page-head"><h1>Сабад</h1><span class="count">' + cartCount() + ' маҳсулот</span></div>' +
      '<div class="checkout-layout">' +
        '<div style="display:grid;gap:12px">' + state.cart.map(cartItemHtml).join('') + '</div>' +
        '<div class="card-box" style="position:sticky;top:calc(var(--header-h) + 12px)">' +
          '<h2>Ҳисоботи супориш</h2>' +
          '<div class="sum-row"><span class="muted">Маҳсулот (' + cartCount() + ')</span><span>' + money(sub) + '</span></div>' +
          (cartOld() > sub ? '<div class="sum-row"><span class="muted">Тамос</span><span style="color:var(--accent)">−' + money(cartOld() - sub) + '</span></div>' : '') +
          '<div class="sum-row"><span class="muted">Ирсол</span><span>' + (sub >= 500 ? 'Ройгон' : money(40)) + '</span></div>' +
          '<div class="sum-row total"><span>Ҳамагӣ</span><span>' + money(sub + (sub >= 500 ? 0 : 40)) + '</span></div>' +
          '<a class="btn btn-primary btn-lg btn-block" href="#/checkout">Супориш додан' + ICONS.arrowRight + '</a>' +
          '<a class="btn btn-ghost btn-block" href="#/catalog">Харидро давом диҳед</a>' +
        '</div>' +
      '</div></div>';
  }

  /* ---------- Drawerи сабад ---------- */
  function renderCartDrawer() {
    var body = $('#cartBody'), foot = $('#cartFoot');
    if (!body) return;
    if (!state.cart.length) {
      body.innerHTML = '<div class="empty" style="border:0;padding:40px 10px"><span class="empty__icon">' + ICONS.cart +
        '</span><h3>Сабад холӣ аст</h3><p>Маҳсулот илова кунед.</p>' +
        '<a class="btn btn-primary" href="#/catalog" data-close-cart>Каталог</a></div>';
      foot.innerHTML = '';
      return;
    }
    body.innerHTML = state.cart.map(cartItemHtml).join('');
    var sub = cartSubtotal(), disc = promoDiscount();
    var need = Math.max(0, 500 - (sub - disc));
    var pct = clamp(Math.round((sub - disc) / 500 * 100), 0, 100);
    foot.innerHTML =
      '<div class="free-progress"><p>' + ICONS.truck + (need > 0 ?
        'То ирсоли ройгон ' + money(need) + ' мондан лозим аст' :
        'Табрик! Ирсол ройгон аст') + '</p>' +
        '<span class="free-progress__track"><span class="free-progress__fill" style="width:' + pct + '%"></span></span></div>' +
      '<div class="promo-row"><input id="promoInput" placeholder="Коди тахфиф" value="' + esc(state.promo || '') + '" aria-label="Коди тахфиф">' +
        '<button class="btn btn-outline" data-act="promo">Татбиқ</button></div>' +
      (state.promo ? '<p class="promo-msg ok">Коди «' + esc(state.promo) + '» қабул шуд: −' + money(disc) + '</p>' : '') +
      '<div class="sum-row"><span class="muted">Маҳсулот</span><span>' + money(sub) + '</span></div>' +
      (disc ? '<div class="sum-row"><span class="muted">Тамоси код</span><span style="color:var(--accent)">−' + money(disc) + '</span></div>' : '') +
      '<div class="sum-row"><span class="muted">Ирсол</span><span>' + (deliveryCost(checkout.method) ? money(deliveryCost(checkout.method)) : 'Ройгон') + '</span></div>' +
      '<div class="sum-row total"><span>Ҳамагӣ</span><span>' + money(grandTotal(checkout.method)) + '</span></div>' +
      '<a class="btn btn-primary btn-lg btn-block" href="#/checkout" data-close-cart>Супориш додан' + ICONS.arrowRight + '</a>' +
      '<a class="btn btn-ghost btn-block" href="#/cart" data-close-cart>Сабадро пурра бубинед</a>';
  }

  function openCart() { renderCartDrawer(); $('#cartDrawer').classList.add('is-open'); document.body.style.overflow = 'hidden'; }
  function closeCart() { var d = $('#cartDrawer'); if (d) d.classList.remove('is-open'); document.body.style.overflow = ''; }

  /* ---------- Огоҳномаҳо: UI ---------- */
  var NOTIF_META = {
    order: { i: 'box', c: '' }, promo: { i: 'percent', c: 'orange' },
    price: { i: 'tag', c: 'blue' }, system: { i: 'info', c: '' }
  };
  function renderNotifPanel() {
    var body = $('#notifBody');
    if (!body) return;
    if (!state.notifications.length) {
      body.innerHTML = '<div class="empty" style="border:0;padding:34px 12px"><span class="empty__icon">' + ICONS.bell +
        '</span><h3>Огоҳнома нест</h3><p>Мо дар бораи фармоиш ва тахфиф хабар медиҳем.</p></div>';
      return;
    }
    body.innerHTML = state.notifications.slice(0, 20).map(function (n) {
      var m = NOTIF_META[n.type] || NOTIF_META.system;
      return '<div class="notif' + (n.read ? '' : ' is-unread') + '" data-act="notif" data-id="' + n.id + '" role="button" tabindex="0">' +
        '<span class="notif__icon ' + m.c + '">' + ICONS[m.i] + '</span>' +
        '<span><span class="notif__title">' + esc(n.title) + '</span>' +
        '<span class="notif__text">' + esc(n.text) + '</span>' +
        '<span class="notif__time">' + timeAgo(n.time) + '</span></span></div>';
    }).join('');
  }
  function renderNotifBadge() { setBadge('#notifBadge', unreadCount()); }
  function toggleNotif() {
    var p = $('#notifPanel'), open = p.classList.contains('is-open');
    if (open) closeNotif(); else { renderNotifPanel(); p.classList.add('is-open'); $('#bellBtn').setAttribute('aria-expanded', 'true'); }
  }
  function closeNotif() {
    var p = $('#notifPanel');
    if (p) p.classList.remove('is-open');
    var b = $('#bellBtn');
    if (b) b.setAttribute('aria-expanded', 'false');
  }

  /* ---------- Каталог меню ---------- */
  function openCatalog() { $('#catalogMenu').classList.add('is-open'); $('#catalogBtn').setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; }
  function closeCatalog() { var m = $('#catalogMenu'); if (m) m.classList.remove('is-open'); document.body.style.overflow = ''; }

  /* ---------- Муқоиса ---------- */
  function renderCompareBar() {
    var bar = $('#compareBar');
    if (!bar) return;
    bar.classList.toggle('is-on', state.compare.length > 0);
    $('#compareItems').innerHTML = state.compare.map(function (id) {
      var p = product(id);
      if (!p) return '';
      return '<span class="compare-mini"><span class="compare-mini__art">' + ART[p.art] + '</span>' + esc(p.name.slice(0, 22)) +
        '<button data-act="cmp" data-id="' + id + '" aria-label="Ҳазф" style="cursor:pointer">' + ICONS.close + '</button></span>';
    }).join('');
    $('#compareGo').classList.toggle('is-hidden', false);
  }

  function viewCompare() {
    var items = state.compare.map(product).filter(Boolean);
    if (items.length < 2) {
      return '<div class="container" style="padding:30px 20px 60px"><div class="empty"><span class="empty__icon">' + ICONS.compare +
        '</span><h3>Барои муқоиса кам</h3><p>Аққалан 2 маҳсулот интихоб кунед, то хусусиятҳои онҳоро муқоиса намоем.</p>' +
        '<a class="btn btn-primary" href="#/catalog">Каталог</a></div></div>';
    }
    var rows = [
      ['Нарх', function (p) { return '<b>' + money(p.price) + '</b>' + (p.old ? '<br><s style="color:var(--muted-fg)">' + num(p.old) + '</s>' : ''); }],
      ['Рейтинг', function (p) { return p.rating.toFixed(1) + ' / 5'; }],
      ['Шарҳҳо', function (p) { return p.reviews; }],
      ['Бренд', function (p) { return esc(p.brand); }],
      ['Категория', function (p) { var c = DB.catById(p.cat); return esc(c ? c.name : ''); }],
      ['Мавҷудӣ', function (p) { return p.stock ? p.stock + ' дона' : 'Мавҷуд нест'; }],
      ['Кишвар', function (p) { return esc(p.country); }],
      ['Кафолат', function (p) { return esc(p.warranty); }]
    ];
    return '<div class="container" style="padding:20px 20px 60px">' +
      '<div class="breadcrumbs"><a href="#/">Асосӣ</a>' + ICONS.chevron + '<span>Муқоиса</span></div>' +
      '<div class="page-head"><h1>Муқоисаи маҳсулот</h1><span class="count">' + items.length + ' маҳсулот</span>' +
      '<button class="btn btn-ghost btn-sm" data-act="cmp-clear" style="margin-left:auto">Тоза кардан</button></div>' +
      '<div style="overflow-x:auto"><table class="compare-table"><thead><tr><th>Хусусият</th>' +
      items.map(function (p) {
        return '<th style="min-width:190px"><div style="display:grid;gap:8px;justify-items:start">' +
          '<span style="width:88px;height:88px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(150deg,hsl(' + p.hue + ' 68% 94%),hsl(' + p.hue + ' 55% 86%))">' +
          '<span style="width:70%;color:hsl(' + p.hue + ' 55% 30%)">' + ART[p.art] + '</span></span>' +
          '<a href="#/product/' + p.id + '" style="font-size:13.5px;font-family:var(--font-head)">' + esc(p.name) + '</a>' +
          '<button class="btn btn-primary btn-sm" data-act="add" data-id="' + p.id + '">Ба сабад</button></div></th>';
      }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><th>' + r[0] + '</th>' + items.map(function (p) { return '<td>' + r[1](p) + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div></div>';
  }

  /* ---------- Фармоишҳо ---------- */
  var ORDER_STEPS = ['Қабул шуд', 'Бастабандӣ', 'Дар роҳ', 'Расонида шуд'];
  function viewOrders() {
    if (!state.orders.length) {
      return '<div class="container" style="padding:30px 20px 60px"><div class="empty"><span class="empty__icon">' + ICONS.box +
        '</span><h3>Фармоиш нест</h3><p>Якум фармоиши худро диҳед — мо тез мерасонем.</p>' +
        '<a class="btn btn-primary btn-lg" href="#/catalog">Хариданро оғоз кун</a></div></div>';
    }
    return '<div class="container" style="padding:20px 20px 60px">' +
      '<div class="breadcrumbs"><a href="#/">Асосӣ</a>' + ICONS.chevron + '<span>Фармоишҳо</span></div>' +
      '<div class="page-head"><h1>Фармоишҳои ман</h1><span class="count">' + state.orders.length + ' фармоиш</span></div>' +
      '<div style="display:grid;gap:16px">' + state.orders.map(orderCardHtml).join('') + '</div></div>';
  }

  function orderCardHtml(o) {
    var stepIdx = ORDER_STEPS.indexOf(o.status);
    var items = o.items.map(function (c) { return product(c.id); }).filter(Boolean);
    return '<div class="order-card"><div class="order-card__head">' +
      '<b>Фармоиш #' + o.id + '</b>' +
      '<span style="font-size:12.5px;color:var(--muted-fg);font-weight:700">' + esc(o.date) + '</span>' +
      '<span class="tag tag-soft st">' + esc(o.statusText) + '</span>' +
      '<a class="btn btn-outline btn-sm" href="#/order/' + o.id + '">Пажгирӣ</a></div>' +
      '<div class="order-card__items">' + items.map(function (p) {
        return '<div class="cart-item" style="--h:' + p.hue + ';grid-template-columns:64px 1fr">' +
          '<div class="cart-item__media" style="width:64px;height:64px" data-act="open" data-id="' + p.id + '">' + ART[p.art] + '</div>' +
          '<div><div class="cart-item__name" style="font-size:13px;padding-right:0" data-act="open" data-id="' + p.id + '">' + esc(p.name) + '</div>' +
          '<div class="cart-item__var">' + money(p.price) + ' × ' + (function () { var c = find(o.items, p.id); return c ? c.qty : 1; })() + '</div></div></div>';
      }).join('') + '</div>' +
      '<div class="timeline">' + ORDER_STEPS.map(function (s, i) {
        var done = i < stepIdx, cur = i === stepIdx;
        return '<div class="timeline__step' + (done || cur ? ' is-done' : '') + (cur ? ' is-current' : '') + '">' +
          '<span class="timeline__dot">' + (done ? ICONS.check : ICONS.clock) + '</span><span>' + s + '</span></div>';
      }).join('') + '</div></div>';
  }

  function viewOrder(id) {
    var o = find(state.orders, id);
    if (!o) return viewNotFound();
    var stepIdx = ORDER_STEPS.indexOf(o.status);
    var items = o.items.map(function (c) { return product(c.id); }).filter(Boolean);
    return '<div class="container" style="padding:20px 20px 60px">' +
      '<div class="breadcrumbs"><a href="#/">Асосӣ</a>' + ICONS.chevron + '<a href="#/orders">Фармоишҳо</a>' + ICONS.chevron +
        '<span>#' + o.id + '</span></div>' +
      '<div class="page-head"><h1>Фармоиш #' + o.id + '</h1><span class="tag tag-soft">' + esc(o.statusText) + '</span></div>' +
      '<div class="checkout-layout">' +
        '<div style="display:grid;gap:16px">' +
          '<div class="card-box"><h2>Пайгирии фармоиш</h2><div class="timeline" style="padding:8px 0 0">' +
            ORDER_STEPS.map(function (s, i) {
              var done = i < stepIdx, cur = i === stepIdx;
              return '<div class="timeline__step' + (done || cur ? ' is-done' : '') + (cur ? ' is-current' : '') + '">' +
                '<span class="timeline__dot">' + (done ? ICONS.check : ICONS.clock) + '</span><span>' + s + '</span></div>';
            }).join('') + '</div></div>' +
          '<div class="card-box"><h2>Маҳсулот (' + items.length + ')</h2>' + items.map(function (p) {
            var c = find(o.items, p.id);
            return '<div class="cart-item" style="--h:' + p.hue + ';grid-template-columns:72px 1fr">' +
              '<div class="cart-item__media" style="width:72px;height:72px" data-act="open" data-id="' + p.id + '">' + ART[p.art] + '</div>' +
              '<div><div class="cart-item__name" style="padding-right:0" data-act="open" data-id="' + p.id + '">' + esc(p.name) + '</div>' +
              '<div class="cart-item__var">' + esc(p.brand) + ' · ' + money(p.price) + ' × ' + (c ? c.qty : 1) + '</div>' +
              '<div style="margin-top:6px"><button class="btn btn-outline btn-sm" data-act="add" data-id="' + p.id + '">' + ICONS.refresh + 'Дубора харед</button></div></div></div>';
          }).join('') + '</div>' +
        '</div>' +
        '<div class="card-box" style="position:sticky;top:calc(var(--header-h) + 12px)">' +
          '<h2>Тафсилоти супориш</h2>' +
          '<div class="sum-row"><span class="muted">Сана</span><span>' + esc(o.date) + '</span></div>' +
          '<div class="sum-row"><span class="muted">Ирсол</span><span style="text-align:right;max-width:60%">' + esc(o.methodText) + '</span></div>' +
          '<div class="sum-row"><span class="muted">Пардохт</span><span>' + esc(o.payText) + '</span></div>' +
          '<div class="sum-row"><span class="muted">Суроға</span><span style="text-align:right;max-width:60%">' + esc(o.address) + '</span></div>' +
          '<div class="sum-row total"><span>Ҳамагӣ</span><span>' + money(o.total) + '</span></div>' +
          (o.status !== 'Расонида шуд' ? '<button class="btn btn-outline btn-block" data-act="simulate" data-id="' + o.id + '">Симулятсияи қадами навбатӣ</button>' : '') +
        '</div>' +
      '</div></div>';
  }

  /* ---------- Чек-аут ---------- */
  function viewCheckout() {
    if (checkout.step === 3) {
      return '<div class="container" style="padding:30px 20px 60px">' +
        '<div class="card-box success-box"><span class="success-box__icon">' + ICONS.check + '</span>' +
        '<h1 style="font-size:26px">Супориш қабул шуд!</h1>' +
        '<p style="margin:0;color:var(--muted-fg);font-weight:700">Мо бо шумо дар тамос мешавем. Расонидан: ' + esc(checkout.methodText || '1–2 рӯз') + '.</p>' +
        '<span class="order-num">#' + (checkout.lastOrder || '—') + '</span>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">' +
        '<a class="btn btn-primary" href="#/order/' + checkout.lastOrder + '">Пайгирӣ кардан' + ICONS.arrowRight + '</a>' +
        '<a class="btn btn-outline" href="#/catalog">Харидро давом диҳед</a></div></div></div>';
    }
    if (!state.cart.length) {
      return '<div class="container" style="padding:30px 20px 60px"><div class="empty"><span class="empty__icon">' + ICONS.cart +
        '</span><h3>Сабад холӣ аст</h3><p>Барои супориш маҳсулот илова кунед.</p><a class="btn btn-primary" href="#/catalog">Каталог</a></div></div>';
    }

    var methods = [
      { v: 'courier', i: 'truck', t: 'Курьер ба ҷой', s: 'Хуҷанд ва наздик — 1–2 рӯз', p: cartSubtotal() - promoDiscount() >= 500 ? 'Ройгон' : '40 смн.' },
      { v: 'pickup', i: 'pin', t: 'Пункти дарҷӯӣ', s: 'кӯчаи И. Сомонӣ 45 — имрӯз', p: 'Ройгон' },
      { v: 'post', i: 'box', t: 'Почта ба вилоят', s: 'Душанбе, Хуҷанд, Бохтар — 3–5 рӯз', p: '80 смн.' }
    ];
    var pays = [
      { v: 'card', i: 'wallet', t: 'Корти онлайн', s: 'Visa, Mastercard, Alif' },
      { v: 'cash', i: 'money', t: 'Нақд ҳангоми қабул', s: 'Ба курьер ё дар пункт' },
      { v: 'bonus', i: 'gift', t: 'Бонусҳо (' + state.user.bonus + ' смн.)', s: 'То 20% аз ҳисобот' }
    ];
    pays[1].i = 'wallet';

    var sub = cartSubtotal(), disc = promoDiscount(), dl = deliveryCost(checkout.method);
    var total = grandTotal(checkout.method);

    var stepHtml = '<div class="steps">' + [1, 2, 3].map(function (i) {
      return '<div class="step' + (checkout.step === i ? ' is-on' : checkout.step > i ? ' is-done' : '') + '"><b>' + i + '</b>' +
        ['Ирсол', 'Пардохт', 'Тасдиқ'][i - 1] + '</div>';
    }).join('') + '</div>';

    if (checkout.step === 1) {
      return '<div class="container" style="padding:20px 20px 60px">' +
        '<div class="breadcrumbs"><a href="#/">Асосӣ</a>' + ICONS.chevron + '<a href="#/cart">Сабад</a>' + ICONS.chevron + '<span>Супориш</span></div>' +
        '<div class="page-head"><h1>Супориш додан</h1></div>' + stepHtml +
        '<div class="checkout-layout"><div class="card-box">' +
          '<h2>1. Тариқи ирсол</h2><div class="radio-cards">' +
          methods.map(function (m) {
            return '<label class="radio-card' + (checkout.method === m.v ? ' is-on' : '') + '">' +
              '<input type="radio" name="dm" value="' + m.v + '"' + (checkout.method === m.v ? ' checked' : '') + ' data-act="dmethod">' +
              '<span><b>' + m.t + '</b><span>' + m.s + '</span></span><span class="price">' + m.p + '</span></label>';
          }).join('') + '</div>' +
          '<h2 style="margin-top:6px">Маълумоти қабулкунанда</h2>' +
          '<div class="field-2"><div class="field"><label for="coName">Ном ва насаб</label><input id="coName" value="' + esc(checkout.name) + '" placeholder="Дилшод Раҳимов"></div>' +
          '<div class="field"><label for="coPhone">Телефон</label><input id="coPhone" value="' + esc(checkout.phone) + '" placeholder="+992 9X XXX XX XX"></div></div>' +
          '<div class="field-2"><div class="field"><label for="coCity">Шаҳр</label><input id="coCity" value="' + esc(checkout.city) + '"></div>' +
          '<div class="field"><label for="coAddr">Суроға</label><input id="coAddr" value="' + esc(checkout.address) + '" placeholder="кӯча, хона, хона"></div></div>' +
          '<div class="field"><label for="coNote">Шарҳ ба фармоиш (ихтиёрӣ)</label><textarea id="coNote" rows="2" placeholder="Навбатӣ, таваққуф ё…">' + esc(checkout.comment) + '</textarea></div>' +
          '<button class="btn btn-primary btn-lg btn-block" data-act="co-next">Давом додан ба пардохт' + ICONS.arrowRight + '</button>' +
        '</div>' + orderSummaryHtml(sub, disc, dl, total) + '</div></div>';
    }

    return '<div class="container" style="padding:20px 20px 60px">' +
      '<div class="breadcrumbs"><a href="#/">Асосӣ</a>' + ICONS.chevron + '<a href="#/cart">Сабад</a>' + ICONS.chevron + '<span>Пардохт</span></div>' +
      '<div class="page-head"><h1>Пардохт</h1></div>' + stepHtml +
      '<div class="checkout-layout"><div class="card-box">' +
        '<h2>2. Тариқи пардохт</h2><div class="radio-cards">' +
        pays.map(function (m) {
          return '<label class="radio-card' + (checkout.pay === m.v ? ' is-on' : '') + '">' +
            '<input type="radio" name="pay" value="' + m.v + '"' + (checkout.pay === m.v ? ' checked' : '') + ' data-act="dpay">' +
            '<span><b>' + m.t + '</b><span>' + m.s + '</span></span><span class="price">' + ICONS.check + '</span></label>';
        }).join('') + '</div>' +
        '<div class="field-2"><div class="field"><label for="cardNum">Рақами корт</label><input id="cardNum" placeholder="0000 0000 0000 0000" inputmode="numeric"></div>' +
        '<div class="field"><label for="cardExp">Мӯҳлати тамом шудан</label><input id="cardExp" placeholder="MM/YY" inputmode="numeric"></div></div>' +
        '<div class="field"><label for="cardCvc">CVC</label><input id="cardCvc" placeholder="•••" inputmode="numeric" maxlength="3"></div>' +
        '<p style="font-size:12.5px;color:var(--muted-fg);font-weight:700;display:flex;gap:7px;align-items:center">' + ICONS.shield +
        'Маълумоти корт ҳифз шудааст ва бо протоколи ҳифозат интиқол дода мешавад.</p>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
        '<button class="btn btn-ghost" data-act="co-back">' + ICONS.chevron + 'Бозгашт</button>' +
        '<button class="btn btn-primary btn-lg" style="flex:1" data-act="co-confirm">' + ICONS.check + 'Супоришро тасдиқ кунед</button></div>' +
      '</div>' + orderSummaryHtml(sub, disc, dl, total) + '</div></div>';
  }

  function orderSummaryHtml(sub, disc, dl, total) {
    return '<div class="card-box" style="position:sticky;top:calc(var(--header-h) + 12px)">' +
      '<h2>Ҳисобот</h2>' +
      '<div class="sum-row"><span class="muted">Маҳсулот (' + cartCount() + ')</span><span>' + money(sub) + '</span></div>' +
      (disc ? '<div class="sum-row"><span class="muted">Тамоси код</span><span style="color:var(--accent)">−' + money(disc) + '</span></div>' : '') +
      '<div class="sum-row"><span class="muted">Ирсол</span><span>' + (dl ? money(dl) : 'Ройгон') + '</span></div>' +
      '<div class="sum-row total"><span>Ҳамагӣ</span><span>' + money(total) + '</span></div>' +
      '<div class="delivery-card" style="padding:12px"><div class="row">' + ICONS.shield + '<span>Пардохт ҳифзшуда · Кафолати 12 моҳ</span></div>' +
      '<div class="row">' + ICONS.refresh + '<span>Баргашти ройгон то 30 рӯз</span></div></div></div>';
  }

  /* ---------- Дӯстдоштаҳо ---------- */
  function viewFavorites() {
    var items = state.fav.map(product).filter(Boolean);
    return '<div class="container" style="padding:20px 20px 60px">' +
      '<div class="breadcrumbs"><a href="#/">Асосӣ</a>' + ICONS.chevron + '<span>Дӯстдоштаҳо</span></div>' +
      '<div class="page-head"><h1>Дӯстдоштаҳо</h1><span class="count">' + items.length + ' маҳсулот</span></div>' +
      (items.length ? gridHtml(items) + '<div style="margin-top:20px"><button class="btn btn-primary" data-act="add-all-fav">' + ICONS.cart + 'Ҳамаро ба сабад гузоред</button></div>'
        : '<div class="empty"><span class="empty__icon">' + ICONS.heart + '</span><h3>Рӯйхат холӣ аст</h3><p>Маҳсулоти дилхоҳро бо дидани қалби ҷойгир кунед.</p><a class="btn btn-primary" href="#/catalog">Каталог</a></div>') +
    '</div>';
  }

  /* ---------- Тамоси рӯз ---------- */
  function viewDeals() {
    var list = DB.PRODUCTS.filter(function (p) { return discountPct(p) > 0; }).sort(function (a, b) { return discountPct(b) - discountPct(a); });
    return '<div class="container" style="padding:20px 20px 60px">' +
      '<div class="breadcrumbs"><a href="#/">Асосӣ</a>' + ICONS.chevron + '<span>Тамоси рӯз</span></div>' +
      '<div class="page-head"><h1>Тамоси рӯз</h1><span class="count">' + list.length + ' маҳсулот бо тахфиф</span></div>' +
      '<div class="deals-strip" style="margin-bottom:22px"><div class="deals-strip__head"><div><h2>' + ICONS.bolt + ' Нархҳо то шабонарӯзӣ</h2><p>Вақт боқимонда:</p></div>' +
      '<div class="countdown"><div class="countdown__cell"><b id="cdH">00</b><span>соат</span></div>' +
      '<div class="countdown__cell"><b id="cdM">00</b><span>дақ</span></div>' +
      '<div class="countdown__cell"><b id="cdS">00</b><span>сон</span></div></div></div></div>' +
      gridHtml(list) + '</div>';
  }

  /* ---------- Профил ---------- */
  function viewProfile() {
    var spent = state.orders.reduce(function (a, o) { return a + o.total; }, 0);
    var itemsBought = state.orders.reduce(function (a, o) {
      return a + o.items.reduce(function (b, c) { return b + c.qty; }, 0);
    }, 0);
    return '<div class="container" style="padding:20px 20px 60px">' +
      '<div class="breadcrumbs"><a href="#/">Асосӣ</a>' + ICONS.chevron + '<span>Профил</span></div>' +
      '<div class="page-head"><h1>Кабинети ман</h1></div>' +
      '<div class="profile-layout">' +
        '<div class="profile-menu">' +
          [['#/profile', 'user', 'Профил', 1], ['#/orders', 'box', 'Фармоишҳо', 0], ['#/favorites', 'heart', 'Дӯстдоштаҳо', 0],
           ['#/compare', 'compare', 'Муқоиса', 0], ['#/cart', 'cart', 'Сабад', 0]].map(function (m) {
            return '<button data-go="' + m[0] + '" class="' + (m[3] ? 'is-on' : '') + '">' + ICONS[m[1]] + m[2] + '</button>';
          }).join('') +
          '<button data-act="theme">' + ICONS.moon + 'Мавзӯъ: ' + (state.theme === 'dark' ? 'торикӣ' : 'равшанӣ') + '</button>' +
          '<button data-act="logout">' + ICONS.logout + 'Баромадан</button>' +
        '</div>' +
        '<div style="display:grid;gap:18px">' +
          '<div class="profile-card"><div class="profile-card__top"><span class="avatar">' + esc(state.user.name.slice(0, 1)) + '</span>' +
            '<div><h2 style="font-size:21px">' + esc(state.user.name) + '</h2>' +
            '<p style="margin:4px 0 0;color:var(--muted-fg);font-weight:700;font-size:13.5px">' + esc(state.user.phone || 'Телефон илова нашудааст') + ' · ' + esc(state.user.city) + '</p></div>' +
            '<button class="btn btn-outline btn-sm" style="margin-left:auto" data-act="edit-profile">' + ICONS.user + 'Таҳрир</button></div>' +
            '<div class="stat-row">' +
            '<div class="stat"><b>' + state.orders.length + '</b><span>Фармоиш</span></div>' +
            '<div class="stat"><b>' + itemsBought + '</b><span>Маҳсулоти харидашуда</span></div>' +
            '<div class="stat"><b>' + money(spent) + '</b><span>Ҳамагӣ хариҷ</span></div>' +
            '<div class="stat"><b>' + state.user.bonus + ' смн.</b><span>Бонус</span></div>' +
            '<div class="stat"><b>' + state.fav.length + '</b><span>Дӯстдошта</span></div>' +
            '</div></div>' +
          '<div class="profile-card"><h2 style="font-size:18px">Маълумоти ман</h2>' +
            '<div class="field-2"><div class="field"><label for="pName">Ном</label><input id="pName" value="' + esc(state.user.name) + '"></div>' +
            '<div class="field"><label for="pPhone">Телефон</label><input id="pPhone" value="' + esc(state.user.phone) + '" placeholder="+992 9X XXX XX XX"></div></div>' +
            '<div class="field"><label for="pCity">Шаҳр</label><input id="pCity" value="' + esc(state.user.city) + '"></div>' +
            '<button class="btn btn-primary" style="width:max-content" data-act="save-profile">' + ICONS.check + 'Захира кардан</button></div>' +
          '<div class="profile-card"><h2 style="font-size:18px">Огоҳномаҳо</h2>' +
            state.notifications.slice(0, 5).map(function (n) {
              return '<div class="row" style="display:flex;gap:10px;align-items:center;font-size:13.5px;font-weight:600;padding:8px 0;border-bottom:1px solid var(--border)">' +
                '<span class="notif__icon" style="width:32px;height:32px">' + ICONS[NOTIF_META[n.type].i] + '</span>' +
                '<span style="flex:1">' + esc(n.title) + '<br><span style="font-size:12px;color:var(--muted-fg)">' + timeAgo(n.time) + '</span></span></div>';
            }).join('') +
            '<a class="btn btn-ghost btn-sm" href="#/orders" style="width:max-content">Ҳамаи фармоишҳо</a></div>' +
        '</div></div></div>';
  }

  function viewNotFound() {
    return '<div class="container" style="padding:60px 20px"><div class="empty"><span class="empty__icon">' + ICONS.info +
      '</span><h3>Саҳифа ёфт нашуд</h3><p>Эҳтимол суроға иваз шудааст. Ба саҳифаи асосӣ баргардед.</p>' +
      '<a class="btn btn-primary btn-lg" href="#/">Асосӣ' + ICONS.arrowRight + '</a></div></div>';
  }

  /* ---------- afterRender: ҳодисаҳо ва эффектҳо ---------- */
  var heroTimer = null, heroIdx = 0;

  function afterRender(r) {
    renderBadges();
    renderCartDrawer();
    renderNotifBadge();
    renderNotifPanel();

    /* Hero carousel */
    var slider = $('#heroSlider');
    if (slider) {
      heroIdx = 0;
      var track = $('#heroTrack');
      var dots = $$('.hero-dot', slider);
      function go(i) {
        heroIdx = (i + DB.BANNERS.length) % DB.BANNERS.length;
        track.style.transform = 'translateX(-' + heroIdx * 100 + '%)';
        dots.forEach(function (d, k) { d.classList.toggle('is-active', k === heroIdx); });
      }
      slider.go = go;
      clearInterval(heroTimer);
      heroTimer = setInterval(function () { if (document.hidden) return; go(heroIdx + 1); }, 6000);
      slider.addEventListener('mouseenter', function () { clearInterval(heroTimer); });
      slider.addEventListener('mouseleave', function () {
        clearInterval(heroTimer);
        heroTimer = setInterval(function () { go(heroIdx + 1); }, 6000);
      });
      var sx = null;
      slider.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
      slider.addEventListener('touchend', function (e) {
        if (sx === null) return;
        var dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx) > 40) go(heroIdx + (dx < 0 ? 1 : -1));
        sx = null;
      });
    }

    /* Countdown */
    if ($('#cdH')) {
      var tick = function () {
        var now = new Date();
        var end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        var s = Math.max(0, Math.floor((end - now) / 1000));
        var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
        var p2 = function (v) { return (v < 10 ? '0' : '') + v; };
        if ($('#cdH')) $('#cdH').textContent = p2(h);
        if ($('#cdM')) $('#cdM').textContent = p2(m);
        if ($('#cdS')) $('#cdS').textContent = p2(sec);
      };
      tick();
      clearInterval(window.__cdTimer);
      window.__cdTimer = setInterval(tick, 1000);
    }

    /* Скелетон дар каталог */
    if (r.path === '/catalog' && catalogView.loading) {
      catalogView.loading = false;
      var res = $('#catalogResults');
      if (res) res.setAttribute('aria-busy', 'true');
    }

    /* Фокус ба ҷустуҷӯ */
    var si = $('#searchInput');
    if (si) si.value = (r.path === '/search' ? r.params.q : (parseHash().params.q || '')) || si.value;

    /* Тартибдодан */
    var ss = $('#sortSel');
    if (ss) ss.addEventListener('change', function () {
      var np = Object.assign({}, r.params);
      np.sort = ss.value;
      var qs = Object.keys(np).map(function (k) {
        var v = np[k];
        if (Array.isArray(v)) return v.length ? k + '=' + encodeURIComponent(v.join(',')) : '';
        return k + '=' + encodeURIComponent(v);
      }).filter(Boolean).join('&');
      location.hash = '#/catalog' + (qs ? '?' + qs : '');
    });

    /* Филтрҳо: навигария */
    $$('[data-act="fcat"], [data-act="fbrand"], [data-act="fdisc"], [data-act="fstock"]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var np = Object.assign({}, r.params);
        var kind = cb.getAttribute('data-act').slice(1);
        if (kind === 'fcat' || kind === 'fbrand') {
          var key = kind === 'fcat' ? 'cat' : 'brand';
          var arr = (np[key] || []).slice();
          var v = cb.value;
          if (cb.checked) { if (arr.indexOf(v) === -1) arr.push(v); }
          else arr = arr.filter(function (x) { return x !== v; });
          if (arr.length) np[key] = arr; else delete np[key];
        } else {
          var k2 = kind === 'fdisc' ? 'disc' : 'stock';
          if (cb.checked) np[k2] = '1'; else delete np[k2];
        }
        delete np.page;
        var qs = Object.keys(np).map(function (k) {
          var v = np[k];
          if (Array.isArray(v)) return v.length ? k + '=' + encodeURIComponent(v.join(',')) : '';
          return k + '=' + encodeURIComponent(v);
        }).filter(Boolean).join('&');
        location.hash = '#/catalog' + (qs ? '?' + qs : '');
      });
    });
  }

  /* ---------- Ҳодисаҳо (делегатсия) ---------- */
  document.addEventListener('click', function (e) {
    var go = e.target.closest('[data-go]');
    if (go) {
      var h = go.getAttribute('data-go');
      if (location.hash === h) render();
      return;
    }

    var t = e.target.closest('[data-act]');
    if (!t) {
      if (!e.target.closest('#notifPanel') && !e.target.closest('#bellBtn')) closeNotif();
      if (!e.target.closest('#suggest') && !e.target.closest('#searchForm')) hideSuggest();
      return;
    }
    var act = t.getAttribute('data-act');
    var id = t.getAttribute('data-id');

    switch (act) {
      case 'open':
        if (e.target.closest('.cart-item__media') || e.target.closest('.p-card__media') || e.target.closest('.p-card__name') || e.target.closest('.cart-item__name')) {
          location.hash = '#/product/' + id;
        }
        break;

      case 'sopen':
        hideSuggest();
        location.hash = '#/product/' + id;
        break;

      case 'fav': {
        var i = state.fav.indexOf(Number(id));
        if (i > -1) { state.fav.splice(i, 1); toast('Аз дӯстдоштаҳо ҳазф шуд', product(id).name); }
        else { state.fav.push(Number(id)); toast('Ба дӯстдоштаҳо илова шуд', product(id).name); }
        save(); renderBadges(); refreshCards();
        break;
      }
      case 'cmp': {
        var p2 = product(id);
        if (inCompare(id)) {
          state.compare = state.compare.filter(function (x) { return x !== Number(id); });
        } else {
          if (state.compare.length >= 4) { toast('Муқоиса пур аст', 'Ҳадди аксар 4 маҳсулот', 'warn'); break; }
          state.compare.push(Number(id));
          toast('Ба муқоиса илова шуд', p2.name);
        }
        save(); renderCompareBar(); refreshCards();
        break;
      }
      case 'cmp-clear':
        state.compare = []; save(); renderCompareBar(); render();
        toast('Муқоиса тоза шуд');
        break;

      case 'add': {
        var p3 = product(id);
        if (!p3) break;
        var qty = 1;
        var qEl = $('#pQty');
        if (qEl && t.closest('.p-info')) qty = clamp(Number(qEl.textContent) || 1, 1, 99);
        var variant = t.getAttribute('data-variant') ||
          ($('#varList') && $('#varList').querySelector('.is-on') ? $('#varList').querySelector('.is-on').textContent.trim() : '');
        addToCart(Number(id), qty, variant);
        if (qEl) { qEl.textContent = '1'; var pe = $('#pPrice'); if (pe) pe.textContent = money(p3.price); }
        break;
      }
      case 'add-all-fav':
        state.fav.forEach(function (f) { addToCart(f, 1, '', true); });
        render(); openCart();
        break;

      case 'buy': {
        var p4 = product(id);
        addToCart(Number(id), 1, '');
        checkout.step = 1;
        location.hash = '#/checkout';
        break;
      }

      case 'qinc': case 'qdec': {
        var pid = t.getAttribute('data-id') || (state.currentProduct);
        if (t.closest('.p-info')) {
          var q = $('#pQty'); var v = Number(q.textContent) + (act === 'qinc' ? 1 : -1);
          q.textContent = clamp(v, 1, 99);
          var pr = product(parseHash().id);
          var priceEl = $('#pPrice');
          if (priceEl && pr) priceEl.textContent = money(pr.price * Number(q.textContent));
        } else if (pid) {
          var c = find(state.cart, pid);
          if (c) {
            c.qty = clamp(c.qty + (act === 'qinc' ? 1 : -1), 1, 99);
            if (c.qty === 0) state.cart = state.cart.filter(function (x) { return x.id !== c.id; });
            save(); renderBadges(); renderCartDrawer();
            if (location.hash.indexOf('#/cart') === 0) render();
            if (location.hash.indexOf('#/checkout') === 0) render();
          }
        }
        break;
      }
      case 'rm': {
        var p5 = product(id);
        state.cart = state.cart.filter(function (x) { return String(x.id) !== String(id); });
        save(); renderBadges(); renderCartDrawer();
        if (location.hash.indexOf('#/cart') === 0 || location.hash.indexOf('#/checkout') === 0) render();
        toast('Аз сабад ҳазф шуд', p5 ? p5.name : '');
        break;
      }

      case 'promo': {
        var input = $('#promoInput');
        var code = (input.value || '').trim().toUpperCase();
        if (!code) { state.promo = null; save(); renderCartDrawer(); break; }
        if (DB.PROMO_CODES[code]) {
          state.promo = code; save(); renderCartDrawer();
          toast('Код қабул шуд', DB.PROMO_CODES[code].title);
        } else {
          toast('Код коркард нашуд', 'Коди «' + code + '» фаъол нест', 'err');
        }
        break;
      }

      case 'hero': {
        var sliderEl = $('#heroSlider');
        if (sliderEl && sliderEl.go) sliderEl.go(heroIdx + Number(t.getAttribute('data-dir')));
        break;
      }
      case 'hero-dot': {
        var s2 = $('#heroSlider');
        if (s2 && s2.go) s2.go(Number(t.getAttribute('data-i')));
        break;
      }

      case 'tab': {
        $$('.tab').forEach(function (x) { x.classList.remove('is-on'); x.setAttribute('aria-selected', 'false'); });
        t.classList.add('is-on'); t.setAttribute('aria-selected', 'true');
        $$('.panel').forEach(function (p) { p.classList.toggle('is-on', p.getAttribute('data-panel') === t.getAttribute('data-t')); });
        break;
      }
      case 'thumb': {
        $$('.gallery__thumb').forEach(function (x) { x.classList.remove('is-on'); });
        t.classList.add('is-on');
        var pr2 = product(parseHash().id);
        var main = $('#galleryMain');
        if (pr2 && main) main.innerHTML = t.getAttribute('data-i') === '0' ? ART[pr2.art]
          : '<span style="width:46%;color:var(--muted-fg)">' + [ICONS.box, ICONS.tag, ICONS.shield, ICONS.sparkle][Number(t.getAttribute('data-i'))] + '</span>';
        break;
      }
      case 'variant': {
        $$('#varList .var-btn').forEach(function (x) { x.classList.remove('is-on'); });
        t.classList.add('is-on');
        break;
      }
      case 'helpful':
        t.classList.toggle('is-on');
        break;

      case 'review': openReviewModal(id || parseHash().id); break;
      case 'close-modal': closeModal(); break;

      case 'clear-filters':
        location.hash = '#/catalog';
        break;
      case 'frating': {
        var np = Object.assign({}, parseHash().params);
        var val = t.getAttribute('data-v');
        if (val === '0') delete np.rating; else np.rating = val;
        location.hash = buildHash(np);
        break;
      }
      case 'apply-price': {
        var np2 = Object.assign({}, parseHash().params);
        var mn = Number($('#fMin').value), mx = Number($('#fMax').value);
        if (mn) np2.min = mn; else delete np2.min;
        if (mx) np2.max = mx; else delete np2.max;
        location.hash = buildHash(np2);
        break;
      }
      case 'open-filters': $('#filtersPanel').classList.add('is-open'); document.body.style.overflow = 'hidden'; break;
      case 'close-filters': $('#filtersPanel').classList.remove('is-open'); document.body.style.overflow = ''; break;
      case 'view': {
        var np3 = Object.assign({}, parseHash().params);
        np3.view = t.getAttribute('data-v');
        location.hash = buildHash(np3);
        break;
      }
      case 'more':
        catalogView.page++;
        render();
        break;

      case 'co-next': {
        checkout.name = $('#coName').value.trim();
        checkout.phone = $('#coPhone').value.trim();
        checkout.city = $('#coCity').value.trim();
        checkout.address = $('#coAddr').value.trim();
        checkout.comment = $('#coNote').value.trim();
        if (!checkout.name || !checkout.phone || !checkout.address) {
          toast('Маълумотро пурра кунед', 'Ном, телефон ва суроға ҳатмист', 'err');
          break;
        }
        if (!/^[\d+()\s-]{9,}$/.test(checkout.phone)) {
          toast('Рақами телефон нодуруст аст', 'Мисол: +992 44 600 00 00', 'err');
          break;
        }
        checkout.step = 2; render();
        break;
      }
      case 'co-back': checkout.step = 1; render(); break;
      case 'co-confirm': placeOrder(); break;
      case 'simulate': simulateOrder(id); break;

      case 'dmethod': case 'dpay': break;
      case 'notif': readNotif(id); break;
      case 'mark-all': break;
      case 'save-profile': {
        state.user.name = $('#pName').value.trim() || 'Меҳмон';
        state.user.phone = $('#pPhone').value.trim();
        state.user.city = $('#pCity').value.trim();
        save(); render();
        toast('Профил захира шуд', 'Маълумоти шумо навсозӣ шуд');
        break;
      }
      case 'edit-profile':
        var el = $('#pName'); if (el) el.focus();
        break;
      case 'logout':
        state.user = { name: 'Меҳмон', phone: '', city: 'Хуҷанд', bonus: state.user.bonus };
        save(); render();
        toast('Шумо баромадед', 'Дарёфти фармоишҳо захира шуд');
        break;
      case 'theme': toggleTheme(); break;
    }
  });

  /* radio-ҳо бо change */
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.getAttribute && t.getAttribute('data-act') === 'dmethod') {
      checkout.method = t.value; render();
    }
    if (t.getAttribute && t.getAttribute('data-act') === 'dpay') {
      checkout.pay = t.value; render();
    }
  });

  function buildHash(params) {
    var qs = Object.keys(params).map(function (k) {
      var v = params[k];
      if (Array.isArray(v)) return v.length ? k + '=' + encodeURIComponent(v.join(',')) : '';
      return k + '=' + encodeURIComponent(v);
    }).filter(Boolean).join('&');
    return '#/catalog' + (qs ? '?' + qs : '');
  }

  function addToCart(id, qty, variant, silent) {
    var p = product(id);
    if (!p) return;
    if (p.stock === 0) { toast('Мавҷуд нест', p.name, 'err'); return; }
    var c = find(state.cart, id);
    if (c) { c.qty = clamp(c.qty + qty, 1, 99); if (variant) c.variant = variant; }
    else state.cart.push({ id: Number(id), qty: qty, variant: variant || '' });
    save(); renderBadges(); renderCartDrawer();
    if (!silent) {
      toast('Ба сабад илова шуд', p.name + ' · ' + money(p.price * qty));
      openCart();
    }
    refreshCards();
  }

  function refreshCards() {
    if (location.hash.indexOf('#/product/') === 0) { render(); return; }
    $$('.p-card').forEach(function (card) {
      var id = card.querySelector('[data-act="fav"]');
      if (!id) return;
      var pid = id.getAttribute('data-id');
      var fav = inFav(pid), cmp = inCompare(pid);
      var fb = card.querySelector('.p-card__fav');
      fb.classList.toggle('is-on', fav);
      fb.setAttribute('aria-pressed', fav);
      fb.innerHTML = ICONS.heart(fav);
      var cb = card.querySelector('.p-card__compare');
      if (cb) {
        cb.classList.toggle('is-on', cmp);
        cb.textContent = cmp ? 'Дар муқоиса' : 'Муқоиса';
      }
    });
  }

  function placeOrder() {
    if (!state.cart.length) return;
    var num = 1000 + Math.floor(Math.random() * 8999);
    var methodText = checkout.method === 'courier' ? 'Курьер ба ҷой' : checkout.method === 'pickup' ? 'Пункти дарҷӯӣ' : 'Почта';
    var payText = checkout.pay === 'card' ? 'Корти онлайн' : checkout.pay === 'cash' ? 'Нақд' : 'Бонусҳо';
    var order = {
      id: num, items: state.cart.map(function (c) { return { id: c.id, qty: c.qty, variant: c.variant }; }),
      total: grandTotal(checkout.method), status: 'Қабул шуд', statusText: 'Қабул шуд',
      date: new Date().toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      method: checkout.method, methodText: methodText, payText: payText,
      address: checkout.city + ', ' + checkout.address
    };
    state.orders.unshift(order);
    state.cart = [];
    state.promo = null;
    checkout.step = 3;
    checkout.lastOrder = num;
    checkout.methodText = methodText;
    state.user.bonus += Math.round(order.total * 0.03);
    save();
    renderBadges();
    notify('order', 'Фармоиши #' + num + ' қабул шуд', methodText + ' · ' + money(order.total) + '. Мо ҳангоми ирсол хабар медиҳем.');
    render();
    setTimeout(function () {
      simulateOrder(num, true);
    }, 14000);
  }

  function simulateOrder(id, auto) {
    var o = find(state.orders, id);
    if (!o) return;
    var i = ORDER_STEPS.indexOf(o.status);
    if (i < ORDER_STEPS.length - 1) {
      o.status = ORDER_STEPS[i + 1];
      o.statusText = ORDER_STEPS[i + 1];
      save();
      if (location.hash.indexOf('#/order/') === 0) render();
      else if (location.hash.indexOf('#/orders') === 0) render();
      if (!auto) toast('Ҳолати фармоиш навсозӣ шуд', '#' + id + ' — ' + o.statusText);
      notify('order', 'Фармоиши #' + id + ': ' + o.statusText, 'Ҳолати навбатии супориши шумо.');
    } else if (!auto) {
      toast('Фармоиш расонида шуд', '#' + id);
    }
  }

  /* ---------- Модали шарҳ ---------- */
  var modalRating = 5;
  function openReviewModal(id) {
    var p = product(id);
    if (!p) return;
    modalRating = 5;
    $('#modalPanel').innerHTML =
      '<div class="drawer__head"><h2>Шарҳ ба «' + esc(p.name) + '»</h2><button class="icon-btn" data-act="close-modal" aria-label="Пӯшидан">' + ICONS.close + '</button></div>' +
      '<div class="drawer__body">' +
        '<div class="field"><label>Баҳои шумо</label><div class="f-stars" id="mStars" role="radiogroup" aria-label="Баҳо">' +
          [1, 2, 3, 4, 5].map(function (i) {
            return '<button data-act="mstar" data-v="' + i + '" style="background:none;border:0;padding:0;cursor:pointer" aria-label="' + i + ' ситора">' + ICONS.star(i <= modalRating) + '</button>';
          }).join('') + '</div></div>' +
        '<div class="field"><label for="mName">Номи шумо</label><input id="mName" placeholder="Мадина А." value="' + esc(state.user.name) + '"></div>' +
        '<div class="field"><label for="mText">Матни шарҳ</label><textarea id="mText" rows="5" placeholder="Сифат, ирсол, таҷрибаи истифода…"></textarea></div>' +
      '</div>' +
      '<div class="drawer__foot"><button class="btn btn-primary btn-lg btn-block" data-act="submit-review" data-id="' + p.id + '">' + ICONS.chat + 'Фиристодан</button></div>';
    $('#modal').classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() { $('#modal').classList.remove('is-open'); document.body.style.overflow = ''; }

  document.addEventListener('click', function (e) {
    var st = e.target.closest('[data-act="mstar"]');
    if (st) {
      modalRating = Number(st.getAttribute('data-v'));
      $$('#mStars button').forEach(function (b, i) { b.innerHTML = ICONS.star(i < modalRating); });
    }
    var sub = e.target.closest('[data-act="submit-review"]');
    if (sub) {
      var pid = sub.getAttribute('data-id');
      var text = $('#mText').value.trim();
      var name = $('#mName').value.trim() || 'Меҳмон';
      if (text.length < 10) { toast('Шарҳ кӯтоҳ аст', 'Ақалан 10 аломат нависед', 'err'); return; }
      state.reviews[pid] = state.reviews[pid] || [];
      state.reviews[pid].unshift({
        author: name, rating: modalRating, date: new Date().toLocaleDateString('ru-RU'),
        text: text, photos: 0, helpful: 0, mine: true
      });
      save(); closeModal(); render();
      toast('Раҳмат!', 'Шарҳи шумо илова шуд');
      notify('system', 'Шарҳи шумо қабул шуд', 'Ташаккур барои фикри шумо дар бораи маҳсулот.');
    }
  });

  /* ---------- Ҷустуҷӯ ---------- */
  function hideSuggest() { var s = $('#suggest'); if (s) { s.hidden = true; s.innerHTML = ''; } }

  function showSuggest(q) {
    var box = $('#suggest');
    var html = '';
    if (!q) {
      if (state.history.length) {
        html += '<div class="suggest-head">Ҷустуҷӯи қабилӣ <button data-act="clear-history" style="cursor:pointer;font-weight:800;color:var(--muted-fg)">тоза кардан</button></div>';
        html += state.history.slice(0, 5).map(function (h) {
          return '<button class="suggest-item" data-act="squery" data-q="' + esc(h) + '">' + ICONS.clock + '<span class="s-name">' + esc(h) + '</span></button>';
        }).join('');
      }
      html += '<div class="suggest-head">Машҳур</div>';
      html += ['тоба', 'блендер', 'корд', 'чайник', 'сервировка'].map(function (h) {
        return '<button class="suggest-item" data-act="squery" data-q="' + h + '">' + ICONS.search + '<span class="s-name">' + h + '</span></button>';
      }).join('');
    } else {
      var ql = q.toLowerCase();
      var prods = DB.PRODUCTS.filter(function (p) {
        return (p.name + ' ' + p.brand).toLowerCase().indexOf(ql) > -1;
      }).slice(0, 5);
      var cats = DB.CATEGORIES.filter(function (c) { return c.name.toLowerCase().indexOf(ql) > -1; });
      if (cats.length) {
        html += '<div class="suggest-head">Категория</div>' + cats.map(function (c) {
          return '<button class="suggest-item" data-go="#/catalog?cat=' + c.id + '">' + ART[c.icon] + '<span class="s-name">' + esc(c.name) + '</span></button>';
        }).join('');
      }
      html += '<div class="suggest-head">Маҳсулот</div>';
      html += prods.map(function (p) {
        return '<button class="suggest-item" data-act="sopen" data-id="' + p.id + '">' + ART[p.art] +
          '<span class="s-name">' + esc(p.name) + '</span><span class="s-meta">' + money(p.price) + '</span></button>';
      }).join('');
      if (!prods.length && !cats.length) {
        html = '<div style="padding:16px;text-align:center;color:var(--muted-fg);font-weight:700">«' + esc(q) + '» ёфт нашуд</div>';
      }
    }
    box.innerHTML = html;
    box.hidden = false;
  }

  document.addEventListener('click', function (e) {
    var q = e.target.closest('[data-act="squery"]');
    if (q) {
      var val = q.getAttribute('data-q');
      $('#searchInput').value = val;
      hideSuggest();
      if (state.history.indexOf(val) === -1) { state.history.unshift(val); state.history = state.history.slice(0, 8); save(); }
      location.hash = '#/search?q=' + encodeURIComponent(val);
      return;
    }
    if (e.target.closest('[data-act="clear-history"]')) {
      state.history = []; save(); showSuggest('');
    }
  });

  function initSearch() {
    var input = $('#searchInput'), form = $('#searchForm'), box = $('#suggest');
    input.addEventListener('input', function () { showSuggest(input.value.trim()); });
    input.addEventListener('focus', function () { showSuggest(input.value.trim()); });
    input.addEventListener('keydown', function (e) {
      var items = $$('.suggest-item', box);
      var cur = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); if (items.length) items[clamp(cur + 1, 0, items.length - 1)].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (items.length) items[clamp(cur - 1, 0, items.length - 1)].focus(); }
      else if (e.key === 'Escape') { hideSuggest(); input.blur(); }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.trim();
      hideSuggest();
      if (!v) return;
      if (state.history.indexOf(v) === -1) { state.history.unshift(v); state.history = state.history.slice(0, 8); save(); }
      location.hash = '#/search?q=' + encodeURIComponent(v);
    });
  }

  /* ---------- Мавзӯъ ---------- */
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    var b = $('#themeBtn');
    if (b) b.innerHTML = state.theme === 'dark' ? ICONS.sun : ICONS.moon;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', state.theme === 'dark' ? '#04231A' : '#059669');
  }
  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    save(); applyTheme(); render();
    toast(state.theme === 'dark' ? 'Мавзӯи торикӣ' : 'Мавзӯи равшанӣ', 'Захира шуд');
  }

  /* ---------- Инициализация ---------- */
  function init() {
    load();
    if (!state.notifications.length) { seedNotifications(); save(); }
    applyTheme();
    renderHeader();
    initSearch();
    render();

    window.addEventListener('hashchange', function () {
      catalogView.page = 1;
      checkout.step = checkout.step === 3 ? 1 : checkout.step;
      render();
    });

    $('#catalogBtn').addEventListener('click', openCatalog);
    $$('[data-close-catalog]').forEach(function (b) { b.addEventListener('click', closeCatalog); });
    $('#cartBtn').addEventListener('click', openCart);
    $$('[data-close-cart]').forEach(function (b) { b.addEventListener('click', closeCart); });
    $('#themeBtn').addEventListener('click', toggleTheme);
    $('#bellBtn').addEventListener('click', function (e) { e.stopPropagation(); toggleNotif(); });
    $('#markAllRead').addEventListener('click', function () {
      state.notifications.forEach(function (n) { n.read = true; });
      save(); renderNotifPanel(); renderNotifBadge();
      toast('Ҳамаи огоҳномаҳо хонда шуд');
    });
    $('#clearNotifs').addEventListener('click', function () {
      state.notifications = []; save(); renderNotifPanel(); renderNotifBadge();
      toast('Огоҳномаҳо тоза шудаанд');
    });
    $('#compareClear').addEventListener('click', function () {
      state.compare = []; save(); renderCompareBar(); refreshCards();
    });
    $('#fabTop').addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    $$('[data-close-modal]').forEach(function (b) { b.addEventListener('click', closeModal); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeCatalog(); closeCart(); closeModal(); closeNotif();
        var fp = $('#filtersPanel');
        if (fp) fp.classList.remove('is-open');
      }
      if (e.key === 'Enter' || e.key === ' ') {
        var t = e.target.closest && e.target.closest('[role="button"][data-act="open"]');
        if (t) {
          e.preventDefault();
          location.hash = '#/product/' + t.getAttribute('data-id');
        }
      }
    });

    var lastY = 0;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      $('#fabTop').classList.toggle('is-on', y > 600);
      $('#siteHeader').style.boxShadow = y > 10 ? 'var(--shadow)' : 'var(--shadow-sm)';
      lastY = y;
    }, { passive: true });

    /* Огоҳномаи тахфиф барои дӯстдошта */
    setTimeout(function () {
      if (state.fav.length) {
        var p = product(state.fav[0]);
        if (p) notify('price', 'Нархи «' + p.name + '» паст шуд', 'Аз ' + num(p.price) + ' смн. — тезтар харед!');
      }
    }, 45000);

    /* Огоҳномаи аксия */
    setTimeout(function () {
      notify('promo', 'Аксияи нав: тамоси 15%', 'Барои мусофирони нав бо коди NEW2026.');
    }, 90000);

    renderBadges();
    renderCompareBar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  /* API барои санҷиш */
  window.Oshxona = { state: state, render: render, money: money, toast: toast, notify: notify };
})();
