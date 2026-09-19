import React from 'react';

const S = ({ children, size = 22, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    {children}
  </svg>
);

export const Icon = {
  Home: (p) => <S {...p}><path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" /></S>,
  Box: (p) => <S {...p}><path d="M21 8 12 3 3 8l9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></S>,
  Chat: (p) => <S {...p}><path d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 1 1 18 0z" /></S>,
  User: (p) => <S {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></S>,
  Scan: (p) => <S {...p} size={p.size || 26}><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" /><path d="M7 12h10" /></S>,
  Bell: (p) => <S {...p}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" /><path d="M10 20a2 2 0 0 0 4 0" /></S>,
  Back: (p) => <S {...p}><path d="M15 5 8 12l7 7" /></S>,
  Phone: (p) => <S {...p}><path d="M6 3h4l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z" /></S>,
  Mail: (p) => <S {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></S>,
  Pin: (p) => <S {...p}><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></S>,
  Shop: (p) => <S {...p}><path d="M4 10h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" /><path d="M4 10 6 4h12l2 6" /><path d="M9 14v6M15 14v6" /></S>,
  Chart: (p) => <S {...p}><path d="M4 19h16M7 16v-5M12 16V8M17 16v-8" /></S>,
  Dollar: (p) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v10M15 9.5C14.5 8 10 8 10 10.5s5 1.5 5 4-4.5 2.2-5 .7" /></S>,
  Alert: (p) => <S {...p}><path d="M12 9v4M12 17h.01" /><path d="M10.3 4.9 2.8 18a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.9a2 2 0 0 0-3.4 0z" /></S>,
  Clock: (p) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v6l4 2" /></S>,
  File: (p) => <S {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></S>,
  Lang: (p) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" /></S>,
  Moon: (p) => <S {...p}><path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z" /></S>,
  Calc: (p) => <S {...p}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" /></S>,
  Headset: (p) => <S {...p}><path d="M4 13a8 8 0 1 1 16 0" /><path d="M4 13v5a2 2 0 0 0 2 2h2v-7H6a2 2 0 0 0-2 2zM16 13v7h2a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-2z" /></S>,
  Copy: (p) => <S {...p}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M4 16V6a2 2 0 0 1 2-2h10" /></S>,
  Ext: (p) => <S {...p}><path d="M14 4h6v6M20 4 11 13" /><path d="M10 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-4" /></S>,
  Play: (p) => <S {...p}><polygon points="8,5 19,12 8,19" fill="currentColor" stroke="none" /></S>,
  Cam: (p) => <S {...p}><path d="M15 8 12 4H8L5 8H3v12h18V8z" /><circle cx="12" cy="13" r="4" /></S>,
  Gift: (p) => <S {...p}><rect x="3" y="10" width="18" height="11" rx="2" /><path d="M12 10v11M3 10h18M12 10s-2-6 2-6 3 4-2 6c-5-2-4-6 0-6s2 6-2 6" /></S>,
  Shield: (p) => <S {...p}><path d="M12 3 5 6v6c0 5 3.5 8 7 9 3.5-1 7-4 7-9V6z" /></S>,
  Check: (p) => <S {...p}><path d="M5 12.5 9.5 17 19 7" /></S>,
  Ban: (p) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="m6 6 12 12" /></S>,
  Chevron: (p) => <S {...p}><path d="m9 6 6 6-6 6" /></S>,
  Logout: (p) => <S {...p}><path d="M9 6H5v12h4M10 12h10M16 8l4 4-4 4" /></S>,
  Plus: (p) => <S {...p}><path d="M12 5v14M5 12h14" /></S>,
  Trash: (p) => <S {...p}><path d="M4 7h16M9 7V5h6v2M8 7l1 13h6l1-13" /></S>,
  Send: (p) => <S {...p}><path d="M22 2 11 13M22 2 15 22l-4-9-9-4z" /></S>,
  Search: (p) => <S {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" /></S>,
  Scale: (p) => <S {...p}><path d="M12 4v3M8 21h8M7 10l5 11 5-11M3 10h18" /></S>,
  Truck: (p) => <S {...p}><path d="M3 7h11v10H3zM14 11h5l3 4v2h-8" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></S>,
  Info: (p) => <S {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 8h.01" /></S>,
  Star: (p) => <S {...p}><path d="m12 3 2.5 6.5L21 10l-5 4.2L17.5 21 12 17.5 6.5 21 8 14.2 3 10l6.5-.5z" /></S>,
  Close: (p) => <S {...p}><path d="M6 6l12 12M18 6 6 18" /></S>,
  Ig: (p) => <S {...p}><rect x="4" y="4" width="16" height="16" rx="5" /><circle cx="12" cy="12" r="3.5" /><circle cx="17" cy="7" r="0.8" fill="currentColor" /></S>,
  Tg: (p) => <S {...p}><path d="M21 5 3 12.5l6 1.8L11 21l3-5 5 3z" /></S>,
  Settings: (p) => <S {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a8 8 0 0 0 .1-6l2-1.2-2-3.4-2.3.7a8 8 0 0 0-5.2-2L11.4 1h-4l-.6 2.1A8 8 0 0 0 1.6 5.3L.3 3.9.1 7.5l2 1.2a8 8 0 0 0 0 6.1l-2 1.2 2 3.5 2.3-.7a8 8 0 0 0 5.2 2l.6 2.1h4l.6-2.1a8 8 0 0 0 5.2-2l2.3.7 2-3.5-2-1.2z" /></S>
};
