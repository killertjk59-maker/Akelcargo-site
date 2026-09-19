import React, { useEffect, useState } from 'react';
import { api, setToken } from './api.js';
import { Icon } from './icons.jsx';
import { Glass } from './components.jsx';

const TABS = [
  ['dash', 'Дашборд', 'Chart'],
  ['tracks', 'Треккодҳо', 'Box'],
  ['news', 'Хабарҳо', 'Bell'],
  ['users', 'Корбарон', 'User'],
  ['lessons', 'Дарсҳо', 'Play'],
  ['warehouse', 'Суроғаи анбор', 'Pin'],
  ['tariffs', 'Нархҳо', 'Dollar'],
  ['hours', 'Ҷадвал', 'Clock'],
  ['delivery', 'Шартҳо', 'File'],
  ['prohibited', 'Манъ', 'Alert'],
  ['support', 'Дастгирӣ', 'Headset'],
  ['banners', 'Баннерҳо', 'Cam'],
  ['sms', 'SMS', 'Chat'],
  ['settings', 'Танзимот', 'Settings']
];

export default function Admin({ user, settings, setSettings, onExit }) {
  const [tab, setTab] = useState('dash');
  const [menu, setMenu] = useState(false);
  return (
    <div className="admin-app phone" style={{ maxWidth: '100%', height: '100%' }}>
      <div className="admin-shell">
        <aside className={'aside glass ' + (menu ? 'open' : '')}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 8px 18px' }}>
            <img src="/icon.png" width="36" height="36" style={{ borderRadius: 10 }} alt="" />
            <div><b>Akelcargo</b><div className="small">Admin</div></div>
          </div>
          {TABS.map(([id, label, ico]) => (
            <button key={id} className={tab === id ? 'on' : ''} onClick={() => { setTab(id); setMenu(false); }}>
              {Icon[ico] ? Icon[ico]({ size: 18 }) : null} {label}
            </button>
          ))}
          <button onClick={onExit}><Icon.Logout size={18} /> Ба барнома</button>
        </aside>
        <main className="admin-main">
          <div className="admin-top">
            <button className="icon-btn" onClick={() => setMenu((m) => !m)} style={{ display: 'grid' }}><Icon.Settings /></button>
            <h2 style={{ margin: 0 }}>{TABS.find((x) => x[0] === tab)?.[1]}</h2>
            <div className="small">{user.name}</div>
          </div>
          {tab === 'dash' && <Dash />}
          {tab === 'tracks' && <Tracks />}
          {tab === 'news' && <News />}
          {tab === 'users' && <Users />}
          {tab === 'lessons' && <LessonsAdmin />}
          {tab === 'warehouse' && <Warehouse settings={settings} setSettings={setSettings} />}
          {tab === 'tariffs' && <TariffsAdmin settings={settings} setSettings={setSettings} />}
          {tab === 'hours' && <HoursAdmin settings={settings} setSettings={setSettings} />}
          {tab === 'delivery' && <DeliveryAdmin settings={settings} setSettings={setSettings} />}
          {tab === 'prohibited' && <ProhibAdmin settings={settings} setSettings={setSettings} />}
          {tab === 'support' && <SupportAdmin settings={settings} setSettings={setSettings} />}
          {tab === 'banners' && <BannersAdmin settings={settings} setSettings={setSettings} />}
          {tab === 'sms' && <SmsAdmin settings={settings} setSettings={setSettings} />}
          {tab === 'settings' && <MiscAdmin settings={settings} setSettings={setSettings} />}
        </main>
      </div>
    </div>
  );
}

function Dash() {
  const [o, setO] = useState(null);
  useEffect(() => { api.admin.overview().then(setO); }, []);
  if (!o) return null;
  return (
    <div className="grid2">
      <Glass className="kpi"><div className="small">Корбарон</div><b>{o.users}</b></Glass>
      <Glass className="kpi"><div className="small">Посылкаҳо</div><b>{o.parcels}</b></Glass>
      <Glass className="kpi"><div className="small">Хабарҳо</div><b>{o.news}</b></Glass>
      <Glass className="kpi"><div className="small">Огоҳиномаҳо</div><b>{o.unread}</b></Glass>
    </div>
  );
}

function Tracks() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState({
    trackCode: '', userPhone: '', receivedDate: new Date().toISOString().slice(0, 10),
    status: 'accepted', branch: 'istaravshan', weight: '', volume: '', price: '', title: 'Посылка', comment: ''
  });
  const [edit, setEdit] = useState(null);
  const load = () => api.admin.parcels(q).then(setList);
  useEffect(() => { load(); }, [q]);
  const save = async () => {
    if (edit) await api.admin.saveParcel(edit, form);
    else await api.admin.addParcel(form);
    setEdit(null);
    setForm({ ...form, trackCode: '', comment: '' });
    load();
  };
  return (
    <>
      <Glass className="card form-grid">
        <b>{edit ? 'Таҳрири трек' : 'Иловаи треккод'}</b>
        <input placeholder="Треккод" value={form.trackCode} onChange={(e) => setForm({ ...form, trackCode: e.target.value })} />
        <input placeholder="Телефони муштарӣ +992..." value={form.userPhone} onChange={(e) => setForm({ ...form, userPhone: e.target.value })} />
        <input type="date" value={form.receivedDate} onChange={(e) => setForm({ ...form, receivedDate: e.target.value })} />
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="accepted">Қабул шуд (Чин)</option>
          <option value="in_transit">Дар роҳ</option>
          <option value="warehouse">Анбор ТҶ</option>
          <option value="delivery">Расонидан</option>
          <option value="received">Гирифта шуд</option>
        </select>
        <select value={form.branch || 'istaravshan'} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
          <option value="istaravshan">Истаравшан</option>
          <option value="nijoni">Ниҷонӣ</option>
        </select>
        <input placeholder="Вазн кг" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
        <input placeholder="Ҳаҷм м³" value={form.volume} onChange={(e) => setForm({ ...form, volume: e.target.value })} />
        <input placeholder="Нарх $" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <input placeholder="Ном" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <textarea placeholder="Эзоҳ / қайд барои тағйири статус" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
        <button className="btn" onClick={save}>{edit ? 'Навсозӣ' : 'Илова кардан'}</button>
      </Glass>
      <input className="input" style={{ paddingLeft: 16, margin: '10px 0' }} placeholder="Ҷустуҷӯ" value={q} onChange={(e) => setQ(e.target.value)} />
      <Glass className="card" style={{ overflow: 'auto' }}>
        <table className="table">
          <thead><tr><th>Трек</th><th>Телефон</th><th>Санаи қабул</th><th>Статус</th><th></th></tr></thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td><b>{p.trackCode}</b></td>
                <td>{p.userPhone}</td>
                <td>{p.receivedDate}</td>
                <td><span className="tag">{p.status}</span></td>
                <td>
                  <button onClick={() => { setEdit(p.id); setForm({ ...p, comment: '' }); }}><Icon.File size={16} /></button>
                  <button onClick={async () => { await api.admin.delParcel(p.id); load(); }}><Icon.Trash size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Glass>
    </>
  );
}

function News() {
  const [list, setList] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const load = () => api.news().then(setList);
  useEffect(() => { load(); }, []);
  return (
    <>
      <Glass className="card form-grid">
        <b>Хабар ба ҳамаи корбарон</b>
        <input placeholder="Сарлавҳа" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea rows={4} placeholder="Матн" value={body} onChange={(e) => setBody(e.target.value)} />
        <button className="btn" onClick={async () => { await api.admin.addNews({ title, body }); setTitle(''); setBody(''); load(); }}>Фиристодан</button>
      </Glass>
      {list.map((n) => (
        <Glass key={n.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <div><b>{n.title}</b><div className="small">{n.body}</div></div>
          <button onClick={async () => { await api.admin.delNews(n.id); load(); }}><Icon.Trash /></button>
        </Glass>
      ))}
    </>
  );
}

function Users() {
  const [list, setList] = useState([]);
  const load = () => api.admin.users().then(setList);
  useEffect(() => { load(); }, []);
  return (
    <Glass className="card" style={{ overflow: 'auto' }}>
      <table className="table">
        <thead><tr><th>Ном</th><th>Телефон</th><th>Хол</th><th>Админ</th></tr></thead>
        <tbody>
          {list.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.phone}</td>
              <td>
                <input style={{ width: 70 }} defaultValue={u.bonusPoints} onBlur={async (e) => { await api.admin.saveUser(u.id, { bonusPoints: Number(e.target.value) || 0 }); }} />
              </td>
              <td>
                <input type="checkbox" defaultChecked={u.isAdmin} onChange={async (e) => api.admin.saveUser(u.id, { isAdmin: e.target.checked })} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Glass>
  );
}

function LessonsAdmin() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ course: 'Pinduoduo', title: '', duration: '4:00', youtubeId: '', description: '' });
  const load = () => api.lessons().then(setList);
  useEffect(() => { load(); }, []);
  return (
    <>
      <Glass className="card form-grid">
        <input placeholder="Курс" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} />
        <input placeholder="Сарлавҳа" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input placeholder="Давомнокӣ 4:12" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
        <input placeholder="YouTube ID" value={form.youtubeId} onChange={(e) => setForm({ ...form, youtubeId: e.target.value })} />
        <textarea placeholder="Тавсиф" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button className="btn" onClick={async () => { await api.admin.addLesson(form); load(); }}>Илова</button>
      </Glass>
      {list.map((l) => (
        <Glass key={l.id} className="card" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div><b>{l.course}</b> — {l.title}<div className="small">{l.duration}</div></div>
          <button onClick={async () => { await api.admin.delLesson(l.id); load(); }}><Icon.Trash /></button>
        </Glass>
      ))}
    </>
  );
}

async function saveSettings(patch, setSettings) {
  const s = await api.admin.settings(patch);
  setSettings(await api.settings());
  return s;
}

function Warehouse({ settings, setSettings }) {
  const [w, setW] = useState(settings.warehouse || {});
  return (
    <Glass className="card form-grid">
      <input placeholder="Номи қабулкунанда" value={w.recipientName || ''} onChange={(e) => setW({ ...w, recipientName: e.target.value })} />
      <input placeholder="Телефони анбор" value={w.phone || ''} onChange={(e) => setW({ ...w, phone: e.target.value })} />
      <textarea placeholder="Суроғаи чинӣ" value={w.address || ''} onChange={(e) => setW({ ...w, address: e.target.value })} />
      <button className="btn" onClick={() => saveSettings({ warehouse: w }, setSettings)}>Захира</button>
    </Glass>
  );
}

function TariffsAdmin({ settings, setSettings }) {
  const [tr, setTr] = useState(JSON.parse(JSON.stringify(settings.tariffs || {})));
  return (
    <Glass className="card form-grid">
      <label>Нарх барои 1 м³ $</label>
      <input value={tr.perM3} onChange={(e) => setTr({ ...tr, perM3: Number(e.target.value) })} />
      <label>Нарх барои 1 кг $</label>
      <input value={tr.perKg} onChange={(e) => setTr({ ...tr, perKg: Number(e.target.value) })} />
      {(tr.tiers || []).map((x, i) => (
        <div key={i} className="grid2">
          <input value={x.min} onChange={(e) => { const t = [...tr.tiers]; t[i] = { ...t[i], min: Number(e.target.value) }; setTr({ ...tr, tiers: t }); }} />
          <input value={x.max} onChange={(e) => { const t = [...tr.tiers]; t[i] = { ...t[i], max: Number(e.target.value) }; setTr({ ...tr, tiers: t }); }} />
          <input value={x.tjs} onChange={(e) => { const t = [...tr.tiers]; t[i] = { ...t[i], tjs: Number(e.target.value) }; setTr({ ...tr, tiers: t }); }} />
          <input value={x.usd} onChange={(e) => { const t = [...tr.tiers]; t[i] = { ...t[i], usd: Number(e.target.value) }; setTr({ ...tr, tiers: t }); }} />
        </div>
      ))}
      <button className="btn" onClick={() => saveSettings({ tariffs: tr }, setSettings)}>Захира</button>
    </Glass>
  );
}

function HoursAdmin({ settings, setSettings }) {
  const [h, setH] = useState(JSON.parse(JSON.stringify(settings.hours || { days: {} })));
  const keys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  return (
    <Glass className="card form-grid">
      {keys.map((k) => (
        <label key={k}>{k}
          <input value={h.days?.[k] || ''} onChange={(e) => setH({ ...h, days: { ...h.days, [k]: e.target.value } })} />
        </label>
      ))}
      <button className="btn" onClick={() => saveSettings({ hours: h }, setSettings)}>Захира</button>
    </Glass>
  );
}

function DeliveryAdmin({ settings, setSettings }) {
  const [d, setD] = useState({ ...(settings.delivery || {}) });
  const fields = ['daysRu', 'daysTg', 'guaranteeRu', 'guaranteeTg', 'packRu', 'packTg', 'freeRu', 'freeTg'];
  return (
    <Glass className="card form-grid">
      {fields.map((f) => <textarea key={f} placeholder={f} value={d[f] || ''} onChange={(e) => setD({ ...d, [f]: e.target.value })} />)}
      <button className="btn" onClick={() => saveSettings({ delivery: d }, setSettings)}>Захира</button>
    </Glass>
  );
}

function ProhibAdmin({ settings, setSettings }) {
  const [list, setList] = useState(settings.prohibited || []);
  return (
    <Glass className="card form-grid">
      {list.map((p, i) => (
        <div key={i} className="form-grid">
          <input value={p.titleRu} onChange={(e) => { const n = [...list]; n[i] = { ...n[i], titleRu: e.target.value }; setList(n); }} />
          <input value={p.titleTg} onChange={(e) => { const n = [...list]; n[i] = { ...n[i], titleTg: e.target.value }; setList(n); }} />
          <textarea value={p.descRu} onChange={(e) => { const n = [...list]; n[i] = { ...n[i], descRu: e.target.value }; setList(n); }} />
          <textarea value={p.descTg} onChange={(e) => { const n = [...list]; n[i] = { ...n[i], descTg: e.target.value }; setList(n); }} />
        </div>
      ))}
      <button className="btn btn-ghost" onClick={() => setList([...list, { titleRu: '', titleTg: '', descRu: '', descTg: '' }])}>+ Банд</button>
      <button className="btn" onClick={() => saveSettings({ prohibited: list }, setSettings)}>Захира</button>
    </Glass>
  );
}

function SupportAdmin({ settings, setSettings }) {
  const [s, setS] = useState({ ...(settings.support || { phones: [] }), socials: { ...(settings.socials || {}) } });
  return (
    <Glass className="card form-grid">
      {(s.phones || []).map((p, i) => (
        <input key={i} value={p} onChange={(e) => { const n = [...s.phones]; n[i] = e.target.value; setS({ ...s, phones: n }); }} />
      ))}
      <button className="btn btn-ghost" onClick={() => setS({ ...s, phones: [...(s.phones || []), ''] })}>+ Рақам</button>
      <input placeholder="Email" value={s.email || ''} onChange={(e) => setS({ ...s, email: e.target.value })} />
      <input placeholder="Instagram" value={s.socials.instagram || ''} onChange={(e) => setS({ ...s, socials: { ...s.socials, instagram: e.target.value } })} />
      <input placeholder="Telegram" value={s.socials.telegram || ''} onChange={(e) => setS({ ...s, socials: { ...s.socials, telegram: e.target.value } })} />
      <button className="btn" onClick={() => saveSettings({ support: { phones: s.phones, email: s.email }, socials: s.socials }, setSettings)}>Захира</button>
    </Glass>
  );
}

function BannersAdmin({ settings, setSettings }) {
  const [list, setList] = useState(settings.banners || []);
  return (
    <Glass className="card form-grid">
      {list.map((b, i) => (
        <div key={b.id || i} className="form-grid">
          <input placeholder="image url" value={b.image} onChange={(e) => { const n = [...list]; n[i] = { ...n[i], image: e.target.value }; setList(n); }} />
          <input placeholder="title RU" value={b.titleRu} onChange={(e) => { const n = [...list]; n[i] = { ...n[i], titleRu: e.target.value }; setList(n); }} />
          <input placeholder="title TG" value={b.titleTg} onChange={(e) => { const n = [...list]; n[i] = { ...n[i], titleTg: e.target.value }; setList(n); }} />
          <input placeholder="sub RU" value={b.subRu} onChange={(e) => { const n = [...list]; n[i] = { ...n[i], subRu: e.target.value }; setList(n); }} />
          <input placeholder="sub TG" value={b.subTg} onChange={(e) => { const n = [...list]; n[i] = { ...n[i], subTg: e.target.value }; setList(n); }} />
        </div>
      ))}
      <button className="btn" onClick={() => saveSettings({ banners: list }, setSettings)}>Захира</button>
    </Glass>
  );
}

function SmsAdmin({ settings, setSettings }) {
  const [apiKey, setApiKey] = useState('');
  const [from, setFrom] = useState(settings.sms?.from || 'Akelcargo');
  const [testPhone, setTestPhone] = useState('992034392828');
  const [msg, setMsg] = useState('');
  const save = async () => {
    setMsg('…');
    try {
      await saveSettings({ sms: { from, ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}) } }, setSettings);
      setApiKey('');
      setMsg('Захира шуд ✓');
    } catch (e) {
      setMsg('Хато: ' + (e.data?.error || e.message));
    }
  };
  const test = async () => {
    setMsg('…');
    try {
      const r = await api.admin.smsTest(testPhone);
      setMsg(r.ok ? 'SMS фиристода шуд ✓' : 'Хато: ' + (r.error || 'fail'));
    } catch (e) {
      setMsg('Хато: ' + (e.data?.error || e.message));
    }
  };
  const balance = async () => {
    setMsg('…');
    try {
      const r = await api.admin.smsBalance();
      setMsg(r.ok ? 'Баланс: ' + r.balance + ' SMS' : 'Хато: ' + (r.error || 'fail'));
    } catch (e) {
      setMsg('Хато: ' + (e.data?.error || e.message));
    }
  };
  return (
    <Glass className="card form-grid">
      <p>Рамзи воридшавӣ бо <b>SMS</b> ба рақами муштарӣ тавассути <a href="https://www.easysendsms.com" target="_blank" rel="noreferrer">EasySendSMS</a> фиристода мешавад.</p>
      <p className="small">Ҳолат: <b>{settings.sms?.configured ? 'API-калид гузошта шудааст ✓' : 'API-калид нест'}</b></p>
      <input type="password" autoComplete="off" placeholder="EasySendSMS API key (барои иваз кардан)" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
      <input placeholder="Номи фиристанда (Sender ID, ҳадди аксар 11 ҳарф)" value={from} onChange={(e) => setFrom(e.target.value)} />
      <button className="btn" onClick={save}>Захира</button>
      <b>Тест</b>
      <input placeholder="Рақам барои тест" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} />
      <button className="btn btn-ghost" onClick={test}>Фиристодани SMS-и тест</button>
      <button className="btn btn-ghost" onClick={balance}>Санҷиши баланс</button>
      {msg && <p className="small">{msg}</p>}
    </Glass>
  );
}

function MiscAdmin({ settings, setSettings }) {
  const [s, setS] = useState({
    taglineRu: settings.taglineRu, taglineTg: settings.taglineTg,
    bonusRulesRu: settings.bonusRulesRu, bonusRulesTg: settings.bonusRulesTg,
    privacyRu: settings.privacyRu, privacyTg: settings.privacyTg
  });
  return (
    <Glass className="card form-grid">
      {Object.keys(s).map((k) => (
        <textarea key={k} placeholder={k} value={s[k] || ''} onChange={(e) => setS({ ...s, [k]: e.target.value })} />
      ))}
      <button className="btn" onClick={() => saveSettings(s, setSettings)}>Захира</button>
    </Glass>
  );
}

export function AdminLogin({ onOk }) {
  const [phone, setPhone] = useState('992034392828');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const go = async () => {
    try {
      const r = await api.adminLogin(phone, password);
      setToken(r.token);
      onOk(r.user);
    } catch {
      setErr('Рақам ё рамз нодуруст');
    }
  };
  return (
    <div className="login">
      <div className="brand-row">
        <img src="/icon.png" alt="" />
        <h2>Akelcargo Admin</h2>
      </div>
      <h1>Панели идоракунӣ</h1>
      <p className="muted">Треккод, нарх, суроға ва хабарҳоро аз ин ҷо идора кунед.</p>
      <div className="field"><label>Телефон</label>
        <input className="input" style={{ paddingLeft: 16 }} value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
      <div className="field"><label>Рамз</label>
        <input className="input" style={{ paddingLeft: 16 }} type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      {err && <p className="danger">{err}</p>}
      <button className="btn" onClick={go}>Ворид</button>
      <p className="small" style={{ marginTop: 14 }}>Рақам: 992034392828 · Рамз: MS MIRSAIDJON</p>
    </div>
  );
}
