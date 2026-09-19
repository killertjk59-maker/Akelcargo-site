import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api.js';
import { Icon } from './icons.jsx';
import { BackTitle, Glass, Menu, Sheet, StatusBadge, Toast, formatPhone } from './components.jsx';

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export default function UserApp({ user, setUser, settings, setSettings, t, lang, theme, toast, showToast }) {
  const [tab, setTab] = useState('home');
  const [stack, setStack] = useState([]);
  const [sheet, setSheet] = useState(null);
  const [parcels, setParcels] = useState([]);
  const [news, setNews] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [stats, setStats] = useState(null);
  const [bonuses, setBonuses] = useState({ points: 0 });
  const [q, setQ] = useState('');
  const [banner, setBanner] = useState(0);

  const screen = stack[stack.length - 1] || null;
  const push = (id, extra) => setStack((s) => [...s, extra ? { id, ...extra } : { id }]);
  const back = () => setStack((s) => s.slice(0, -1));
  const goTab = (id) => { setStack([]); setTab(id); };

  const load = async () => {
    try {
      const [p, n, nt, l, st, b] = await Promise.all([
        api.parcels(), api.news(), api.notifications(), api.lessons(), api.stats(), api.bonuses()
      ]);
      setParcels(p); setNews(n); setNotifs(nt); setLessons(l); setStats(st); setBonuses(b);
    } catch {}
  };

  useEffect(() => { load(); const i = setInterval(load, 12000); return () => clearInterval(i); }, []);

  useEffect(() => {
    const banners = settings.banners || [];
    if (!banners.length) return;
    const i = setInterval(() => setBanner((x) => (x + 1) % banners.length), 4200);
    return () => clearInterval(i);
  }, [settings.banners]);

  const unread = notifs.filter((n) => !n.read).length;

  const copyAll = async () => {
    const w = settings.warehouse || {};
    const text = `${w.recipientName || user.name}\n${w.phone}\n${w.address}`;
    try { await navigator.clipboard.writeText(text); showToast(t('copied')); } catch { showToast(t('copied')); }
  };

  const setLang = async (l) => {
    const u = await api.updateMe({ language: l });
    setUser(u);
    setSheet(null);
  };
  const setTheme = async (th) => {
    const u = await api.updateMe({ theme: th });
    setUser(u);
    document.documentElement.setAttribute('data-theme', th);
    setSheet(null);
  };

  let body = null;
  if (!screen && tab === 'home') {
    body = (
      <Home
        t={t} user={user} settings={settings} lang={lang}
        banner={banner} setBanner={setBanner}
        copyAll={copyAll} push={push} goNotif={() => push('notifications')} unread={unread}
      />
    );
  } else if (!screen && tab === 'orders') {
    body = <Orders t={t} parcels={parcels} q={q} setQ={setQ} push={push} />;
  } else if (!screen && tab === 'scan') {
    body = <Scan t={t} push={push} showToast={showToast} />;
  } else if (!screen && tab === 'messages') {
    body = <Messages t={t} settings={settings} onSupport={() => setSheet('support')} />;
  } else if (!screen && tab === 'profile') {
    body = (
      <Profile
        t={t} user={user} lang={lang} theme={theme} push={push}
        openLang={() => setSheet('lang')} openTheme={() => setSheet('theme')} openSupport={() => setSheet('support')}
      />
    );
  }

  if (screen?.id === 'account') body = <Account t={t} user={user} setUser={setUser} back={back} showToast={showToast} />;
  if (screen?.id === 'branch') body = <Branch t={t} user={user} setUser={setUser} settings={settings} lang={lang} back={back} />;
  if (screen?.id === 'stats') body = <Stats t={t} stats={stats} back={back} />;
  if (screen?.id === 'tariffs') body = <Tariffs t={t} settings={settings} back={back} />;
  if (screen?.id === 'prohibited') body = <Prohibited t={t} settings={settings} lang={lang} back={back} />;
  if (screen?.id === 'hours') body = <Hours t={t} settings={settings} back={back} />;
  if (screen?.id === 'delivery') body = <Delivery t={t} settings={settings} lang={lang} back={back} />;
  if (screen?.id === 'calc') body = <Calc t={t} back={back} />;
  if (screen?.id === 'bonuses') body = <Bonuses t={t} bonuses={bonuses} lang={lang} back={back} />;
  if (screen?.id === 'about') body = <About t={t} settings={settings} lang={lang} back={back} />;
  if (screen?.id === 'lessons') body = <Lessons t={t} lessons={lessons} back={back} push={push} />;
  if (screen?.id === 'course') body = <Course t={t} lessons={lessons} course={screen.course} back={back} push={push} />;
  if (screen?.id === 'lesson') body = <Lesson t={t} item={lessons.find((x) => x.id === screen.lid)} settings={settings} back={back} />;
  if (screen?.id === 'notifications') body = <Notifs t={t} news={news} notifs={notifs} back={back} reload={load} />;
  if (screen?.id === 'parcel') body = <Parcel t={t} id={screen.pid} back={back} />;
  if (screen?.id === 'addresses') body = <Addresses t={t} settings={settings} user={user} copyAll={copyAll} back={back} />;
  if (screen?.id === 'howaddr') body = <HowAddr t={t} settings={settings} back={back} />;

  return (
    <>
      <div className={'page ' + (screen ? 'stack-in' : '')}>{body}</div>
      {!screen && (
        <nav className="nav glass-2">
          <button className={tab === 'home' ? 'on' : ''} onClick={() => goTab('home')}><Icon.Home size={20} />{t('home')}</button>
          <button className={tab === 'orders' ? 'on' : ''} onClick={() => goTab('orders')}><Icon.Box size={20} />{t('orders')}</button>
          <button onClick={() => goTab('scan')} aria-label="scan"><div className="fab"><Icon.Scan /></div></button>
          <button className={tab === 'messages' ? 'on' : ''} onClick={() => goTab('messages')}><Icon.Chat size={20} />{t('messages')}</button>
          <button className={tab === 'profile' ? 'on' : ''} onClick={() => goTab('profile')}><Icon.User size={20} />{t('profile')}</button>
        </nav>
      )}
      {sheet === 'lang' && (
        <Sheet title={t('language')} onClose={() => setSheet(null)}>
          <button className={'opt ' + (lang === 'ru' ? 'on' : '')} onClick={() => setLang('ru')}>{t('ru')} {lang === 'ru' && <Icon.Check />}</button>
          <button className={'opt ' + (lang === 'tg' ? 'on' : '')} onClick={() => setLang('tg')}>{t('tg')} {lang === 'tg' && <Icon.Check />}</button>
        </Sheet>
      )}
      {sheet === 'theme' && (
        <Sheet title={t('theme')} onClose={() => setSheet(null)}>
          <button className={'opt ' + (theme === 'light' ? 'on' : '')} onClick={() => setTheme('light')}>{t('light')} {theme === 'light' && <Icon.Check />}</button>
          <button className={'opt ' + (theme === 'dark' ? 'on' : '')} onClick={() => setTheme('dark')}>{t('dark')} {theme === 'dark' && <Icon.Check />}</button>
        </Sheet>
      )}
      {sheet === 'support' && <SupportSheet t={t} settings={settings} onClose={() => setSheet(null)} showToast={showToast} />}
    </>
  );
}

function Home({ t, user, settings, lang, banner, setBanner, copyAll, push, goNotif, unread }) {
  const banners = settings.banners || [];
  const w = settings.warehouse || {};
  const b = banners[banner] || banners[0];
  return (
    <>
      <div className="top">
        <button className="user-chip" onClick={() => push('account')}>
          <div className="av">{(user.name || 'A')[0]}</div>
          <div>
            <b>{user.name || t('client')}</b>
            <small>{t('myProfile')}</small>
          </div>
          <Icon.Chevron size={16} />
        </button>
        <button className="icon-btn" onClick={goNotif}>
          <Icon.Bell />
          {unread > 0 && <i className="dot" />}
        </button>
      </div>
      {b && (
        <>
          <div className="banners" onClick={() => setBanner((banner + 1) % banners.length)}>
            {banners.map((x, i) => (
              <div className="banner" key={x.id} style={{ minWidth: i === banner ? '100%' : 0, display: i === banner ? 'block' : 'none' }}>
                <img src={x.image} alt="" />
                <div className="cap">
                  <b>{lang === 'tg' ? x.titleTg : x.titleRu}</b>
                  <span>{lang === 'tg' ? x.subTg : x.subRu}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="dots">{banners.map((x, i) => <i key={x.id} className={i === banner ? 'on' : ''} />)}</div>
        </>
      )}
      <Glass className="card">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
          <div className="mi"><Icon.Pin size={18} /></div>
          <div>
            <h3 style={{ margin: 0 }}>{t('addressTitle')}</h3>
            <div className="small">{t('addressSub')}</div>
          </div>
        </div>
        <div className="row"><span className="chip">收件人</span><div><div className="small">{t('recipient')}</div><div className="addr-val">{w.recipientName || user.name}</div></div></div>
        <div className="row"><span className="chip">手机号</span><div><div className="small">{t('whPhone')}</div><div className="addr-val">{w.phone}</div></div></div>
        <div className="row"><span className="chip">详细地址</span><div><div className="small">{t('address')}</div><div className="addr-val">{w.address}</div></div></div>
        <button className="btn" style={{ marginTop: 12 }} onClick={copyAll}><Icon.Copy size={16} /> &nbsp;{t('copyAll')}</button>
      </Glass>
      <div className="sec">{t('markets')} <button style={{ color: 'var(--red)', fontWeight: 800 }} onClick={() => window.open((settings.marketplaces || [])[0]?.url, '_blank')}>{t('go')}</button></div>
      {(settings.marketplaces || []).map((m) => (
        <button key={m.id} className="market" style={{ background: `linear-gradient(90deg, ${m.color}, ${m.color}cc)` }} onClick={() => window.open(m.url, '_blank')}>
          <div className="m-ico">{m.name[0]}</div>
          <div style={{ textAlign: 'left' }}>{m.name}<div style={{ fontWeight: 500, fontSize: 12, opacity: 0.85 }}>{m.id}</div></div>
          <span style={{ marginLeft: 'auto' }}><Icon.Ext size={18} /></span>
        </button>
      ))}
      <Glass className="link-row" onClick={() => push('howaddr')} style={{ cursor: 'pointer' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><div className="mi"><Icon.Pin size={18} /></div><b>{t('howAddr')}</b></div>
        <Icon.Chevron />
      </Glass>
      <Glass className="link-row" onClick={() => push('lessons')} style={{ cursor: 'pointer' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><div className="mi"><Icon.Play size={18} /></div><b>{t('videos')}</b></div>
        <Icon.Chevron />
      </Glass>
    </>
  );
}

function Orders({ t, parcels, q, setQ, push }) {
  const list = parcels.filter((p) => !q || p.trackCode.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className="top"><h1>{t('orders')}</h1></div>
      <Glass className="search"><Icon.Search size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('searchOrder')} /></Glass>
      {list.length === 0 ? (
        <Glass className="empty"><img src="/empty-box.png" alt="" /><p>{t('emptyOrders')}</p></Glass>
      ) : list.map((p) => (
        <Glass key={p.id} className="card" onClick={() => push('parcel', { pid: p.id })} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <b>{p.trackCode}</b>
            <StatusBadge status={p.status} t={t} />
          </div>
          <div className="small" style={{ marginTop: 6 }}>{p.title} · {p.receivedDate}</div>
          <div className="small">{t('acceptedOn', { date: p.receivedDate })}</div>
        </Glass>
      ))}
    </>
  );
}

function Scan({ t, push, showToast }) {
  const [code, setCode] = useState('');
  const find = async () => {
    if (!code.trim()) return;
    try {
      const p = await api.track(code.trim());
      push('parcel', { pid: p.id });
    } catch {
      showToast(t('notFound'));
    }
  };
  return (
    <>
      <div className="top"><h1>{t('scan')}</h1></div>
      <div className="scan-box"><div className="scan-frame" /></div>
      <p className="muted" style={{ textAlign: 'center' }}>{t('scanHint')}</p>
      <div className="field">
        <div className="input-wrap">
          <span className="input-ico"><Icon.Box size={18} /></span>
          <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('trackPh')} />
        </div>
      </div>
      <button className="btn" onClick={find}>{t('find')}</button>
    </>
  );
}

function Messages({ t, settings, onSupport }) {
  const ig = settings.socials?.instagram || '';
  const tg = settings.socials?.telegram || '';
  return (
    <>
      <div className="top"><h1>{t('supportTitle')}</h1></div>
      <Glass className="card" style={{ textAlign: 'center', padding: 24 }}>
        <div className="mi" style={{ margin: '0 auto 12px', width: 56, height: 56 }}><Icon.Headset /></div>
        <h3>{t('supportHint')}</h3>
        <p className="muted">{t('supportInProfile')}</p>
        <button className="btn" onClick={onSupport}>{t('goSupport')}</button>
      </Glass>
      <div className="sec">{t('socials')}</div>
      <p className="small" style={{ marginTop: -6, marginBottom: 10 }}>{t('socialHint')}</p>
      <div className="grid2">
        <Glass className="card" style={{ cursor: 'pointer' }} onClick={() => window.open('https://instagram.com/' + ig.replace('@', ''), '_blank')}>
          <div className="mi"><Icon.Ig /></div>
          <b>Instagram</b>
          <div className="small">{ig}</div>
        </Glass>
        <Glass className="card" style={{ cursor: 'pointer' }} onClick={() => window.open('https://t.me/' + tg.replace('@', ''), '_blank')}>
          <div className="mi"><Icon.Tg /></div>
          <b>Telegram</b>
          <div className="small">{tg}</div>
        </Glass>
      </div>
    </>
  );
}

function Profile({ t, user, lang, theme, push, openLang, openTheme, openSupport }) {
  return (
    <>
      <Glass className="card" onClick={() => push('account')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="av" style={{ width: 52, height: 52 }}>{(user.name || 'A')[0]}</div>
        <div style={{ flex: 1 }}>
          <b>{user.name || t('client')}</b>
          <div className="small">{formatPhone(user.phone)}</div>
        </div>
        <Icon.Chevron />
      </Glass>
      <div className="sec">{t('general')}</div>
      <Menu
        onPick={push}
        items={[
          { id: 'addresses', label: t('myAddresses'), icon: <Icon.Pin size={18} /> },
          { id: 'branch', label: t('branch'), icon: <Icon.Shop size={18} /> },
          { id: 'stats', label: t('stats'), icon: <Icon.Chart size={18} /> },
          { id: 'tariffs', label: t('tariffs'), icon: <Icon.Dollar size={18} /> },
          { id: 'prohibited', label: t('prohibited'), icon: <Icon.Alert size={18} /> },
          { id: 'hours', label: t('hours'), icon: <Icon.Clock size={18} /> },
          { id: 'delivery', label: t('delivery'), icon: <Icon.File size={18} /> }
        ]}
      />
      <div className="sec">{t('view')}</div>
      <Menu
        onPick={(id) => id === 'language' ? openLang() : openTheme()}
        items={[
          { id: 'language', label: t('language'), icon: <Icon.Lang size={18} />, right: lang === 'tg' ? t('tg') : t('ru') },
          { id: 'theme', label: t('theme'), icon: <Icon.Moon size={18} />, right: theme === 'dark' ? t('dark') : t('light') }
        ]}
      />
      <div className="sec">{t('services')}</div>
      <Menu
        onPick={(id) => id === 'tech' ? openSupport() : push(id)}
        items={[
          { id: 'calc', label: t('calc'), icon: <Icon.Calc size={18} /> },
          { id: 'tech', label: t('techSupport'), icon: <Icon.Headset size={18} /> },
          { id: 'bonuses', label: t('bonuses'), icon: <Icon.Gift size={18} /> },
          { id: 'lessons', label: t('freeLessons'), icon: <Icon.Play size={18} /> },
          { id: 'about', label: t('about'), icon: <Icon.Info size={18} /> }
        ]}
      />
    </>
  );
}

function Account({ t, user, setUser, back, showToast }) {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState('edit');
  const [code, setCode] = useState(['', '', '', '']);
  const save = async () => {
    const u = await api.updateMe({ name, email });
    setUser(u); showToast(t('saved'));
  };
  const startPhone = async () => {
    const r = await api.changePhone({ phone });
    setStep('otp');
    if (r.previewCode) showToast(r.previewCode);
  };
  const verifyPhone = async () => {
    const u = await api.changePhone({ phone, code: code.join('') });
    setUser(u); setStep('edit'); showToast(t('saved'));
  };
  const logout = async () => { await api.logout(); location.reload(); };
  const del = async () => {
    if (!confirm(t('confirmDelete'))) return;
    await api.deleteMe(); location.reload();
  };
  return (
    <>
      <BackTitle title={t('account')} onBack={back} />
      <Glass className="card">
        <div className="field"><label>{t('name')}</label>
          <div className="input-wrap"><span className="input-ico"><Icon.User size={18} /></span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div></div>
        <div className="field"><label>{t('email')}</label>
          <div className="input-wrap"><span className="input-ico"><Icon.Mail size={18} /></span>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('enterEmail')} /></div></div>
        <button className="btn" onClick={save}>{t('save')}</button>
      </Glass>
      <Glass className="card">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="mi"><Icon.Phone size={18} /></div>
          <div><div className="small">{t('phoneLabel')}</div><b>{formatPhone(user.phone)}</b></div>
        </div>
        {step === 'edit' ? (
          <>
            <div className="field" style={{ marginTop: 12 }}>
              <div className="input-wrap"><span className="input-ico"><Icon.Phone size={18} /></span>
                <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+992 90 000 0000" /></div>
            </div>
            <button className="btn btn-ghost" onClick={startPhone}>{t('changePhoneBtn')}</button>
          </>
        ) : (
          <>
            <Otp code={code} setCode={setCode} />
            <button className="btn" onClick={verifyPhone}>{t('ok')}</button>
          </>
        )}
      </Glass>
      <button className="btn" style={{ marginTop: 8 }} onClick={logout}><Icon.Logout size={16} /> &nbsp;{t('logout')}</button>
      <button className="danger" onClick={del}>{t('deleteAcc')}</button>
    </>
  );
}

function Otp({ code, setCode }) {
  const refs = useRef([]);
  return (
    <div className="otp-boxes">
      {code.map((c, i) => (
        <input key={i} ref={(el) => (refs.current[i] = el)} inputMode="numeric" maxLength={1} value={c}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(-1);
            const n = [...code]; n[i] = v; setCode(n);
            if (v && refs.current[i + 1]) refs.current[i + 1].focus();
          }}
          onKeyDown={(e) => { if (e.key === 'Backspace' && !code[i] && refs.current[i - 1]) refs.current[i - 1].focus(); }}
        />
      ))}
    </div>
  );
}

function Branch({ t, user, setUser, settings, lang, back }) {
  const pick = async (id) => { const u = await api.updateMe({ branchId: id }); setUser(u); };
  return (
    <>
      <BackTitle title={t('branch')} onBack={back} />
      <p className="muted">{t('branchHint')}</p>
      {(settings.branches || []).map((b) => (
        <Glass key={b.id} className="card" onClick={() => pick(b.id)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="mi"><Icon.Shop size={18} /></div>
          <div style={{ flex: 1 }}>
            <b>{lang === 'tg' ? b.nameTg : b.nameRu}</b>
            <div className="small">{b.city}</div>
          </div>
          <div style={{ width: 22, height: 22, borderRadius: 99, border: '2px solid var(--red)', display: 'grid', placeItems: 'center' }}>
            {user.branchId === b.id && <div style={{ width: 12, height: 12, borderRadius: 99, background: 'var(--red)' }} />}
          </div>
        </Glass>
      ))}
    </>
  );
}

function Stats({ t, stats, back }) {
  const s = stats || { count: 0, weight: 0, volume: 0, amount: 0, deliveries: 0, warehouse: 0, delivery: 0, received: 0 };
  return (
    <>
      <BackTitle title={t('stats')} onBack={back} />
      <div className="hero-red">
        <div className="small" style={{ opacity: 0.85 }}>{t('totalParcels')}</div>
        <b>{s.count}</b>
        <p>{t('statsHero')}</p>
      </div>
      <div className="grid2">
        <Glass className="stat"><div className="mi"><Icon.Box size={18} /></div><b>{s.count}</b><small>{t('totalParcels')}</small></Glass>
        <Glass className="stat"><div className="mi"><Icon.Scale size={18} /></div><b>{s.weight} кг</b><small>{t('totalWeight')}</small></Glass>
        <Glass className="stat"><div className="mi"><Icon.Box size={18} /></div><b>{s.volume} м³</b><small>{t('totalVol')}</small></Glass>
        <Glass className="stat"><div className="mi"><Icon.Dollar size={18} /></div><b>{s.amount} $</b><small>{t('totalSum')}</small></Glass>
      </div>
      <Glass className="stat" style={{ marginTop: 10 }}><div className="mi"><Icon.Truck size={18} /></div><b>{s.deliveries}</b><small>{t('deliveries')}</small></Glass>
      <div className="sec">{t('stages')}</div>
      <p className="small" style={{ marginTop: -8 }}>{t('stagesHint')}</p>
      <Glass className="card">
        {[['istaravshan', t('whIstaravshan'), s.istaravshan || s.warehouse], ['nijoni', t('whNijoni'), s.nijoni || 0], ['delivery', t('onDelivery'), s.delivery], ['received', t('received'), s.received]].map((x) => (
          <div className="hours-row" key={x[0]}><span style={{ display: 'flex', gap: 10, alignItems: 'center' }}><div className="mi"><Icon.Shop size={16} /></div>{x[1]}</span><b>{x[2]}</b></div>
        ))}
      </Glass>
    </>
  );
}

function Tariffs({ t, settings, back }) {
  const tr = settings.tariffs || { perM3: 240, perKg: 2.5, tiers: [] };
  return (
    <>
      <BackTitle title={t('tariffs')} onBack={back} />
      <Glass className="card">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><div className="mi"><Icon.Dollar /></div><div><h3 style={{ margin: 0 }}>{t('tariffHero')}</h3><div className="small">{t('tariffHeroSub')}</div></div></div>
        <div className="grid2" style={{ marginTop: 12 }}>
          <div className="glass" style={{ padding: 14, textAlign: 'center' }}><div className="small">{t('perM3')}</div><b style={{ color: 'var(--red)', fontSize: 24 }}>{tr.perM3} $</b></div>
          <div className="glass" style={{ padding: 14, textAlign: 'center' }}><div className="small">{t('perKg')}</div><b style={{ color: 'var(--red)', fontSize: 24 }}>{tr.perKg} $</b></div>
        </div>
      </Glass>
      <div className="sec">{t('byWeight')}</div>
      <p className="small" style={{ marginTop: -8 }}>{t('byWeightSub')}</p>
      {(tr.tiers || []).map((x, i) => (
        <Glass className="card" key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><b style={{ color: 'var(--red)' }}>{x.min}-{x.max} кг</b><div className="small">{t('perKgShort')}</div></div>
          <div style={{ textAlign: 'right' }}><div className="pill">TJS {x.tjs}</div><div className="pill" style={{ marginTop: 6 }}>USD {x.usd}</div></div>
        </Glass>
      ))}
    </>
  );
}

function Prohibited({ t, settings, lang, back }) {
  return (
    <>
      <BackTitle title={t('prohibited')} onBack={back} />
      <Glass className="card">
        <div style={{ display: 'flex', gap: 10 }}><div className="mi"><Icon.Alert /></div><div><h3 style={{ margin: 0 }}>{t('cannotSend')}</h3><p className="muted" style={{ margin: '6px 0 0' }}>{t('cannotSendSub')}</p></div></div>
      </Glass>
      {(settings.prohibited || []).map((p, i) => (
        <Glass className="card" key={i}>
          <div style={{ display: 'flex', gap: 10 }}><div className="mi"><Icon.Ban /></div>
            <div><h3 style={{ margin: 0 }}>{lang === 'tg' ? p.titleTg : p.titleRu}</h3>
              <p className="muted" style={{ margin: '6px 0 0' }}>{lang === 'tg' ? p.descTg : p.descRu}</p></div></div>
        </Glass>
      ))}
    </>
  );
}

function Hours({ t, settings, back }) {
  const h = settings.hours || { days: {} };
  const today = DAY_KEYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  const cur = h.days?.[today];
  const open = cur && cur !== 'off';
  return (
    <>
      <BackTitle title={t('hours')} onBack={back} />
      <Glass className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><div className="mi"><Icon.Clock size={18} /></div><b>{t('byWeek')}</b></div>
          <span className="pill" style={{ background: open ? '#dcfce7' : undefined, color: open ? '#15803d' : undefined }}>{open ? '● ' + t('open') : t('closed')}</span>
        </div>
        <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, margin: '10px 0 4px' }}>{open ? cur : t('closed')}</div>
        <div className="small">{t('hoursHint')}</div>
      </Glass>
      <Glass className="card">
        <b>{t('weekSchedule')}</b>
        {DAY_KEYS.map((d) => (
          <div className="hours-row" key={d}>
            <span>{t(d)}</span>
            {h.days?.[d] === 'off' ? <span className="pill off">{t('closed')}</span> : <span className="pill">{h.days?.[d]}</span>}
          </div>
        ))}
      </Glass>
    </>
  );
}

function Delivery({ t, settings, lang, back }) {
  const d = settings.delivery || {};
  const L = lang === 'tg';
  const items = [
    [t('termDays'), L ? d.daysTg : d.daysRu],
    [t('guarantee'), L ? d.guaranteeTg : d.guaranteeRu],
    [t('packing'), L ? d.packTg : d.packRu],
    [t('freeShip'), L ? d.freeTg : d.freeRu]
  ];
  return (
    <>
      <BackTitle title={t('delivery')} onBack={back} />
      {items.map((x) => (
        <Glass className="card" key={x[0]}><h3>{x[0]}</h3><p className="muted" style={{ margin: 0 }}>{x[1]}</p></Glass>
      ))}
    </>
  );
}

function Calc({ t, back }) {
  const [w, setW] = useState('');
  const [v, setV] = useState('');
  const [r, setR] = useState(null);
  const go = async () => setR(await api.calculate(w, v));
  return (
    <>
      <BackTitle title={t('calc')} onBack={back} />
      <Glass className="card">
        <div style={{ display: 'flex', gap: 10 }}><div className="mi"><Icon.Calc /></div><div><h3 style={{ margin: 0 }}>{t('calcTitle')}</h3><p className="small">{t('calcSub')}</p></div></div>
        <div className="field"><label>{t('weight')}</label>
          <div className="input-wrap"><span className="input-ico"><Icon.Scale size={18} /></span>
            <input className="input" value={w} onChange={(e) => setW(e.target.value)} placeholder={t('weightPh')} /></div></div>
        <div className="field"><label>{t('volume')}</label>
          <div className="input-wrap"><span className="input-ico"><Icon.Box size={18} /></span>
            <input className="input" value={v} onChange={(e) => setV(e.target.value)} placeholder={t('volPh')} /></div></div>
        <button className="btn" onClick={go}>{t('doCalc')}</button>
      </Glass>
      {r ? (
        <Glass className="card" style={{ textAlign: 'center' }}>
          <div className="small">{t('result')}</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--red)' }}>{r.usd} $</div>
          <div className="muted">{r.tjs} TJS · {r.used === 'weight' ? t('usedWeight') : t('usedVol')}</div>
        </Glass>
      ) : (
        <Glass className="empty"><div className="mi" style={{ margin: '0 auto 10px', width: 56, height: 56 }}><Icon.Chart /></div><p>{t('calcEmpty')}</p></Glass>
      )}
    </>
  );
}

function Bonuses({ t, bonuses, lang, back }) {
  return (
    <>
      <BackTitle title={t('bonuses')} onBack={back} />
      <div className="hero-red" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><div className="small">{t('yourBalance')}</div><b>{bonuses.points || 0} {t('points')}</b></div>
        <img src="/bonus.png" alt="" style={{ width: 72, height: 72, objectFit: 'contain' }} />
      </div>
      <h3>{t('howPoints')}</h3>
      <p className="muted">{t('pointRules')}</p>
      <Glass className="card"><p style={{ margin: 0 }}>{lang === 'tg' ? bonuses.rulesTg : bonuses.rulesRu}</p></Glass>
    </>
  );
}

function About({ t, settings, lang, back }) {
  return (
    <>
      <BackTitle title={t('about')} onBack={back} />
      <Glass className="card">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <img src="/icon.png" width="48" height="48" style={{ borderRadius: 12 }} alt="" />
          <div><b>Akelcargo</b><div className="pill" style={{ display: 'inline-block', marginTop: 4 }}>{t('version')} {settings.version}</div></div>
        </div>
        <p className="muted">{lang === 'tg' ? settings.taglineTg : settings.taglineRu}</p>
      </Glass>
      <Glass className="card"><div style={{ display: 'flex', gap: 10 }}><div className="mi"><Icon.File /></div><div><h3 style={{ margin: 0 }}>{t('docs')}</h3><p className="muted">{t('docsSub')}</p></div></div></Glass>
      <Glass className="card"><div style={{ display: 'flex', gap: 10 }}><div className="mi"><Icon.Shield /></div><div><h3 style={{ margin: 0 }}>{t('privacy')}</h3><p className="muted">{lang === 'tg' ? settings.privacyTg : settings.privacyRu}</p></div></div></Glass>
      <Glass className="card"><div style={{ display: 'flex', gap: 10 }}><div className="mi"><Icon.Check /></div><div><h3 style={{ margin: 0 }}>{t('terms')}</h3><p className="muted">{t('termsSub')}</p></div></div>
        <button className="btn" style={{ marginTop: 8 }}>{t('openTerms')}</button>
      </Glass>
    </>
  );
}

function Lessons({ t, lessons, back, push }) {
  const courses = useMemo(() => {
    const m = {};
    for (const l of lessons) { (m[l.course] = m[l.course] || []).push(l); }
    return m;
  }, [lessons]);
  return (
    <>
      <BackTitle title={t('freeLessons')} onBack={back} />
      <Glass className="card">
        <div className="mi" style={{ marginBottom: 8 }}><Icon.Cam /></div>
        <h3>{t('lessonsHero')}</h3>
        <p className="muted">{t('lessonsSub')}</p>
      </Glass>
      <Glass className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div><b style={{ color: 'var(--red)' }}>Дарси Ройгон аз Akelcargo</b><div className="small">{t('freeVideos')}</div></div>
          <span className="pill">{Object.keys(courses).length} {t('courses')}</span>
        </div>
        {Object.keys(courses).map((c) => (
          <button key={c} className="menu-item" style={{ width: '100%' }} onClick={() => push('course', { course: c })}>
            <img src="/icon.png" width="36" height="36" style={{ borderRadius: 8 }} alt="" />
            <div style={{ flex: 1, textAlign: 'left' }}><b>{c}</b><div className="small">{courses[c].length} {t('lessonsN')}</div></div>
            <Icon.Chevron />
          </button>
        ))}
      </Glass>
    </>
  );
}

function Course({ t, lessons, course, back, push }) {
  const list = lessons.filter((l) => l.course === course);
  return (
    <>
      <BackTitle title={course} onBack={back} />
      <Glass className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div className="mi" style={{ width: 48, height: 48 }}><Icon.Box /></div>
        <div><b>{course}</b><div className="small">{list.length} {t('lessonsN')}</div></div>
      </Glass>
      {list.map((l) => (
        <Glass key={l.id} className="card" onClick={() => push('lesson', { lid: l.id })} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/icon.png" width="40" height="40" style={{ borderRadius: 8 }} alt="" />
          <div style={{ flex: 1 }}><b>{l.title}</b><div className="small">{l.duration}</div></div>
          <div className="mi"><Icon.Play size={16} /></div>
        </Glass>
      ))}
    </>
  );
}

function Lesson({ t, item, settings, back }) {
  if (!item) return null;
  return (
    <>
      <BackTitle title={t('videos')} onBack={back} />
      <div className="video-thumb">
        <img src={(settings.banners || [])[0]?.image || '/banner1.jpg'} alt="" />
        <div className="play"><Icon.Play /></div>
      </div>
      {item.youtubeId ? (
        <iframe title={item.title} src={`https://www.youtube.com/embed/${item.youtubeId}`} style={{ width: '100%', height: 200, border: 0, borderRadius: 16 }} allow="autoplay; encrypted-media" />
      ) : null}
      <Glass className="card">
        <h3 style={{ marginTop: 0 }}>{item.title}</h3>
        <div className="small">{t('duration')}: {item.duration}</div>
        <p className="muted">{item.description}</p>
      </Glass>
    </>
  );
}

function Notifs({ t, news, notifs, back, reload }) {
  const [tab, setTab] = useState('news');
  useEffect(() => { api.readNotif().then(reload).catch(() => {}); }, []);
  return (
    <>
      <BackTitle title={t('notifications')} onBack={back} />
      <div className="seg">
        <button className={tab === 'parcels' ? 'on' : ''} onClick={() => setTab('parcels')}>{t('parcelsTab')}</button>
        <button className={tab === 'news' ? 'on' : ''} onClick={() => setTab('news')}>{t('newsTab')} {news.length ? '· ' + news.length : ''}</button>
      </div>
      {tab === 'news' && (news.length ? news.map((n) => (
        <Glass key={n.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><b>{n.title}</b><span className="small">{(n.createdAt || '').slice(11, 16)}</span></div>
          <p className="muted" style={{ marginBottom: 0 }}>{n.body}</p>
        </Glass>
      )) : <Glass className="empty"><p>{t('noNews')}</p></Glass>)}
      {tab === 'parcels' && (notifs.filter((n) => n.type === 'parcel').length ? notifs.filter((n) => n.type === 'parcel').map((n) => (
        <Glass key={n.id} className="card"><b>{n.title}</b><p className="muted" style={{ margin: 0 }}>{n.body}</p></Glass>
      )) : <Glass className="empty"><div className="mi" style={{ margin: '0 auto 8px', width: 56, height: 56 }}><Icon.Mail /></div><p>{t('noNotif')}</p></Glass>)}
    </>
  );
}

function Parcel({ t, id, back }) {
  const [p, setP] = useState(null);
  useEffect(() => { api.parcel(id).then(setP).catch(() => {}); }, [id]);
  if (!p) return <BackTitle title="..." onBack={back} />;
  return (
    <>
      <BackTitle title={p.trackCode} onBack={back} />
      <Glass className="card">
        <StatusBadge status={p.status} t={t} />
        <h2 style={{ margin: '8px 0 4px' }}>{p.title}</h2>
        <p>{t('acceptedOn', { date: p.receivedDate })}</p>
        <div className="grid2">
          <div><div className="small">{t('weight')}</div><b>{p.weight} кг</b></div>
          <div><div className="small">{t('volume')}</div><b>{p.volume} м³</b></div>
        </div>
        {p.price ? <div style={{ marginTop: 8 }}><div className="small">{t('totalSum')}</div><b>{p.price} $</b></div> : null}
      </Glass>
      <div className="sec">{t('timeline')}</div>
      <Glass className="card">
        <div className="timeline">
          {(p.history || []).map((h, i) => (
            <div className="tl" key={i}>
              <b>{t('status_' + h.status)}</b>
              <span>{h.date} · {h.noteTg || h.noteRu}</span>
            </div>
          ))}
        </div>
      </Glass>
    </>
  );
}

function Addresses({ t, settings, user, copyAll, back }) {
  const w = settings.warehouse || {};
  return (
    <>
      <BackTitle title={t('myAddresses')} onBack={back} />
      <Glass className="card">
        <h3>{t('addressTitle')}</h3>
        <div className="row"><span className="chip">收件人</span><div className="addr-val">{w.recipientName || user.name}</div></div>
        <div className="row"><span className="chip">手机号</span><div className="addr-val">{w.phone}</div></div>
        <div className="row"><span className="chip">详细地址</span><div className="addr-val">{w.address}</div></div>
        <button className="btn" onClick={copyAll}>{t('copyAll')}</button>
      </Glass>
    </>
  );
}

function HowAddr({ t, settings, back }) {
  const w = settings.warehouse || {};
  return (
    <>
      <BackTitle title={t('howAddr')} onBack={back} />
      <Glass className="card">
        <ol style={{ paddingLeft: 18, lineHeight: 1.6, fontWeight: 600 }}>
          <li>Pinduoduo → 收货地址 → 添加地址</li>
          <li>收件人: <b>{w.recipientName}</b></li>
          <li>手机号: <b>{w.phone}</b></li>
          <li>详细地址: <b>{w.address}</b></li>
        </ol>
      </Glass>
    </>
  );
}

function SupportSheet({ t, settings, onClose, showToast }) {
  const copy = async (x) => { try { await navigator.clipboard.writeText(x); showToast(t('copied')); } catch {} };
  return (
    <Sheet title={t('techSupport')} onClose={onClose}>
      <div className="mi" style={{ margin: '0 auto 8px', width: 56, height: 56 }}><Icon.Headset /></div>
      <p className="muted" style={{ textAlign: 'center' }}>{t('pickNumber')}</p>
      {(settings.support?.phones || []).map((p) => (
        <button key={p} className="opt" onClick={() => { copy(p); window.location.href = 'tel:' + p.replace(/\s/g, ''); }}>{p}</button>
      ))}
      <button className="opt" onClick={() => copy(settings.support?.email)}>{settings.support?.email}</button>
      <button className="btn" style={{ marginTop: 8 }} onClick={onClose}>{t('close')}</button>
    </Sheet>
  );
}

export { Otp };
