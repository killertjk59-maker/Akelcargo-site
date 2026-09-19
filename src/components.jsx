import React, { useEffect, useState } from 'react';
import { Icon } from './icons.jsx';

export function Glass({ className = '', children, onClick, style }) {
  return (
    <div className={'glass ' + className} onClick={onClick} style={style}>
      {children}
    </div>
  );
}

export function BackTitle({ title, onBack }) {
  return (
    <div className="screen-title">
      <button className="back-btn" onClick={onBack} aria-label="back">
        <Icon.Back />
      </button>
      <h2>{title}</h2>
    </div>
  );
}

export function Toast({ text, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [onDone, text]);
  if (!text) return null;
  return <div className="toast">{text}</div>;
}

export function Sheet({ title, onClose, children }) {
  return (
    <div className="sheet" onClick={onClose}>
      <div className="box glass-2" onClick={(e) => e.stopPropagation()}>
        <div className="handle" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: '0 0 8px' }}>{title}</h3>
          <button onClick={onClose}><Icon.Close /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Menu({ items, onPick }) {
  return (
    <Glass className="card" style={{ padding: '6px 14px' }}>
      {items.map((it) => (
        <button key={it.id} className="menu-item" onClick={() => onPick(it.id)} style={{ width: '100%', textAlign: 'left' }}>
          <div className="mi">{it.icon}</div>
          <span>{it.label}</span>
          {it.right ? <small className="muted">{it.right}</small> : null}
          <span className="chev"><Icon.Chevron size={18} /></span>
        </button>
      ))}
    </Glass>
  );
}

export function formatPhone(d) {
  const x = String(d || '').replace(/\D/g, '');
  if (x.startsWith('992') && x.length >= 12) {
    return `+992 ${x.slice(3, 5)} ${x.slice(5, 8)} ${x.slice(8, 12)}`;
  }
  if (x.length === 9) return `+992 ${x.slice(0, 2)} ${x.slice(2, 5)} ${x.slice(5, 9)}`;
  return '+' + x;
}

export function StatusBadge({ status, t }) {
  return <span className={'tag status-' + status}>{t('status_' + status)}</span>;
}

export function useClock() {
  const [n, setN] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setN(new Date()), 30000);
    return () => clearInterval(i);
  }, []);
  return n;
}
