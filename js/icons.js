/* Иконкаҳои UI ва расмҳои маҳсулот (SVG, бе эмодзи) */
(function () {
  'use strict';

  var S = function (inner, sw) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' +
      (sw || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      inner + '</svg>';
  };

  window.ICONS = {
    search: S('<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.2-4.2"/>'),
    cart: S('<circle cx="9.5" cy="20" r="1.4"/><circle cx="17.5" cy="20" r="1.4"/><path d="M2.5 3h2.3l2.4 12.1a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L21 7.2H5.4"/>'),
    heart: function (filled) {
      return '<svg viewBox="0 0 24 24" fill="' + (filled ? 'currentColor' : 'none') +
        '" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 20.4 4.7 13a4.8 4.8 0 0 1 6.8-6.8l.5.5.5-.5A4.8 4.8 0 0 1 19.3 13z"/></svg>';
    },
    bell: S('<path d="M18 8.5a6 6 0 1 0-12 0c0 6.5-2.8 7.7-2.8 7.7h17.6S18 15 18 8.5"/><path d="M10.3 20.5a2.1 2.1 0 0 0 3.4 0"/>'),
    user: S('<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5c0-3.8 3.4-6 7.5-6s7.5 2.2 7.5 6"/>'),
    menu: S('<path d="M4 6.5h16M4 12h16M4 17.5h16"/>'),
    close: S('<path d="M6 6l12 12M18 6 6 18"/>'),
    chevron: S('<path d="m9 5.5 6.5 6.5L9 18.5"/>'),
    chevronDown: S('<path d="m5.5 9 6.5 6.5L18.5 9"/>'),
    star: function (filled) {
      return '<svg viewBox="0 0 24 24" fill="' + (filled ? 'currentColor' : 'none') +
        '" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m12 3.6 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.8l5.9-.8z"/></svg>';
    },
    plus: S('<path d="M12 5.5v13M5.5 12h13"/>'),
    minus: S('<path d="M5.5 12h13"/>'),
    trash: S('<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l.8 13a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7"/>'),
    truck: S('<path d="M2.5 6.5h10v9h-10z"/><path d="M12.5 10h4l3 3v2.5h-7z"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/>'),
    shield: S('<path d="M12 3 5 5.8v5.4c0 4.3 3 8 7 9.3 4-1.3 7-5 7-9.3V5.8z"/><path d="m9 12 2.2 2.2L15.5 10"/>'),
    refresh: S('<path d="M20 11.5A8 8 0 0 0 6.3 6.3L4 8.5"/><path d="M4 4.5v4h4"/><path d="M4 12.5a8 8 0 0 0 13.7 5.2L20 15.5"/><path d="M20 19.5v-4h-4"/>'),
    wallet: S('<rect x="2.5" y="6" width="19" height="13" rx="3"/><path d="M2.5 10.5h19"/><circle cx="17" cy="14.5" r="1.3"/>'),
    tag: S('<path d="M12.6 3H20a1 1 0 0 1 1 1v7.4a2 2 0 0 1-.6 1.4l-8.6 8.6a2 2 0 0 1-2.8 0l-6.4-6.4a2 2 0 0 1 0-2.8l8.6-8.6a2 2 0 0 1 1.4-.6z"/><circle cx="16.8" cy="7.2" r="1.4"/>'),
    filter: S('<path d="M3.5 5.5h17l-6.6 7.8v6.2l-3.8-2v-4.2z"/>'),
    sort: S('<path d="M4 7h12M4 12h9M4 17h6"/><path d="M17.5 13.5 20 16l2.5-2.5" transform="translate(-3 0)"/>'),
    grid: S('<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>'),
    list: S('<rect x="3.5" y="4.5" width="17" height="5" rx="1.6"/><rect x="3.5" y="14.5" width="17" height="5" rx="1.6"/>'),
    compare: S('<path d="M9 4v12a3 3 0 0 0 3 3h4"/><path d="m13 16 3 3 3-3"/><path d="M15 4v12a3 3 0 0 1-3 3H8"/><path d="m11 16-3 3-3-3"/>'),
    sun: S('<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"/>'),
    moon: S('<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>'),
    check: S('<path d="m4.5 12.5 5 5 10-11"/>'),
    clock: S('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3.2 2"/>'),
    home: S('<path d="m3.5 10.5 8.5-7 8.5 7"/><path d="M6 9.8V20h12V9.8"/><path d="M10 20v-5.5h4V20"/>'),
    box: S('<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>'),
    phone: S('<path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5z"/>'),
    mail: S('<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>'),
    pin: S('<path d="M12 21s6.5-6 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 15 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.4"/>'),
    info: S('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8h.01"/>'),
    gift: S('<rect x="3" y="8.5" width="18" height="12" rx="2"/><path d="M3 13h18M12 8.5V20.5"/><path d="M12 8.5S10.5 3 7.5 3.6C4.8 4.1 5.2 8.5 8 8.5zM12 8.5S13.5 3 16.5 3.6C19.2 4.1 18.8 8.5 16 8.5z"/>'),
    percent: S('<path d="M6.5 6.5 17.5 17.5"/><circle cx="7.5" cy="7.5" r="2.6"/><circle cx="16.5" cy="16.5" r="2.6"/>'),
    logout: S('<path d="M9.5 20.5H5.5a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2h4"/><path d="M15.5 7.5 20 12l-4.5 4.5M20 12H9"/>'),
    chat: S('<path d="M20.5 12.5a7.5 7.5 0 0 1-8 7.5 8.6 8.6 0 0 1-3.2-.6L4 21l1.3-4.2A7.5 7.5 0 0 1 12.5 4a7.5 7.5 0 0 1 8 8.5z"/>'),
    eye: S('<path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="3"/>'),
    sparkle: S('<path d="M12 3.5 13.7 9 19 10.7 13.7 12.4 12 18 10.3 12.4 5 10.7 10.3 9z"/><path d="M18.5 16.5 19.3 18.7 21.5 19.5 19.3 20.3 18.5 22.5 17.7 20.3 15.5 19.5 17.7 18.7z"/>'),
    bolt: S('<path d="M13.5 2.5 5 13.5h5l-1.5 8L18 10.5h-5z"/>'),
    arrowRight: S('<path d="M4.5 12h15M13.5 6l6 6-6 6"/>'),
    arrowUp: S('<path d="M12 19.5v-15M6 10.5l6-6 6 6"/>')
  };

  /* ---------- Расмҳои маҳсулот (200x200) ---------- */
  var A = function (inner) {
    return '<svg class="art" viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="4" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + inner + '</svg>';
  };

  window.ART = {
    knife: A('<path d="M22 128 100 50l16 16-62 84-22-12z"/><path d="M100 50 128 22l24 24-28 28"/><path d="M34 116l14 10"/>'),
    pan: A('<ellipse cx="86" cy="106" rx="48" ry="33"/><path d="M134 96l44-10a5 5 0 0 1 4 9l-42 15"/><path d="M56 80a48 33 0 0 1 60 0"/><path d="M86 73v-11"/>'),
    tag: A('<path d="M104 34 166 96 100 166 34 96z"/><circle cx="100" cy="100" r="15"/><path d="M100 85v30M85 100h30"/>'),
    pot: A('<path d="M52 92h96v40a34 34 0 0 1-34 34H86a34 34 0 0 1-34-34z"/><path d="M52 92V82h96v10"/><path d="M34 96H24a4 4 0 0 0-4 4v14a4 4 0 0 0 4 4h10"/><path d="M166 96h10a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4h-10"/><rect x="84" y="64" width="32" height="10" rx="5"/><path d="M78 54c-5-6 5-8 0-16M100 48c-5-6 5-8 0-16M122 54c-5-6 5-8 0-16"/>'),
    wok: A('<circle cx="86" cy="104" r="46"/><path d="M126 96l48-10a5 5 0 0 1 4 9.4l-46 13"/><path d="M56 74a46 46 0 0 1 30-24"/><path d="M70 130a46 46 0 0 0 32 10"/>'),
    saucepan: A('<path d="M56 90h88v42a30 30 0 0 1-30 30H86a30 30 0 0 1-30-30z"/><path d="M56 90a44 44 0 0 1 88 0"/><path d="M38 96H26a5 5 0 0 0-5 5v12a5 5 0 0 0 5 5h12"/><path d="M162 96h12a5 5 0 0 1 5 5v12a5 5 0 0 1-5 5h-12"/><rect x="86" y="62" width="28" height="10" rx="5"/>'),
    deg: A('<path d="M40 84h120v40a40 40 0 0 1-40 40H80a40 40 0 0 1-40-40z"/><path d="M30 80h140"/><path d="M36 84H26a5 5 0 0 0-5 5v16a5 5 0 0 0 5 5h10"/><path d="M164 84h10a5 5 0 0 1 5 5v16a5 5 0 0 1-5 5h-10"/><path d="M70 110v30M100 110v30M130 110v30" stroke-dasharray="2 10"/>'),
    board: A('<rect x="32" y="72" width="136" height="78" rx="14"/><circle cx="150" cy="88" r="7"/><path d="M52 100h96M52 122h72"/>'),
    grater: A('<rect x="50" y="54" width="100" height="98" rx="14"/><path d="M50 78h100M50 102h100M50 126h100"/><circle cx="150" cy="66" r="9"/><path d="M66 66h50"/>'),
    blender: A('<path d="M70 40h64l-6 78H76z"/><path d="M84 116h36v12H84z"/><path d="M80 128h44v32a14 14 0 0 1-14 14H94a14 14 0 0 1-14-14z"/><path d="M134 62h16a11 11 0 0 1 0 22h-16"/><rect x="90" y="138" width="26" height="8" rx="4"/>'),
    handblender: A('<path d="M84 34h32a20 20 0 0 1 20 20v22H84z"/><path d="M92 76v34M108 76v34"/><path d="M84 112h32v34a14 14 0 0 1-14 14H98a14 14 0 0 1-14-14z"/><path d="M100 34V22"/>'),
    kettle: A('<path d="M62 78h64v50a32 32 0 0 1-32 32 32 32 0 0 1-32-32z"/><path d="M62 78a32 32 0 0 1 64 0"/><path d="M126 96l30 18a9 9 0 0 1-9 15l-25-13"/><path d="M62 94H44a6 6 0 0 0-6 6v18a6 6 0 0 0 6 6h12"/><rect x="80" y="58" width="28" height="9" rx="4.5"/>'),
    microwave: A('<rect x="24" y="62" width="152" height="92" rx="14"/><rect x="38" y="76" width="86" height="64" rx="9"/><path d="M136 82h28M136 96h28M136 110h28"/><circle cx="150" cy="130" r="9"/>'),
    toaster: A('<rect x="46" y="78" width="108" height="76" rx="16"/><path d="M76 78V64h48v14"/><path d="M132 96h16v22h-16z"/><circle cx="150" cy="132" r="7"/>'),
    mixer: A('<path d="M62 52h50a26 26 0 0 1 26 26v16H62z"/><path d="M86 94v20M98 94v20"/><path d="M60 130h84a12 12 0 0 1 12 12v6H48v-6a12 12 0 0 1 12-12z"/><path d="M74 52V40h26v12"/>'),
    coffeemachine: A('<path d="M52 66h96v56a24 24 0 0 1-24 24H76a24 24 0 0 1-24-24z"/><path d="M52 66a48 48 0 0 1 96 0"/><path d="M148 92h20a10 10 0 0 1 0 20h-20"/><path d="M84 122h32"/><path d="M100 146v18"/>'),
    scale: A('<rect x="30" y="134" width="140" height="20" rx="8"/><path d="M62 134V96h76v38"/><rect x="74" y="58" width="52" height="38" rx="9"/><path d="M86 77h28"/><path d="M62 96h76"/>'),
    plate: A('<circle cx="100" cy="100" r="58"/><circle cx="100" cy="100" r="42"/><circle cx="100" cy="100" r="22"/>'),
    bowl: A('<path d="M30 92h140c0 41-31 68-70 68s-70-27-70-68z"/><path d="M20 88h160"/><path d="M56 122c14 10 30 14 44 14s30-4 44-14"/>'),
    glass: A('<path d="M60 50h80l-9 62a31 31 0 0 1-62 0z"/><path d="M100 142v22M76 168h48"/><path d="M70 62h60"/>'),
    cutlery: A('<path d="M52 42v28M64 42v28M58 42v28M58 70v88"/><path d="M104 42c11 10 11 30 0 40v78"/><path d="M150 42a15 17 0 0 1 0 34v82"/>'),
    container: A('<rect x="40" y="76" width="120" height="80" rx="14"/><rect x="32" y="58" width="136" height="20" rx="10"/><path d="M64 96v46M100 96v46M136 96v46" stroke-dasharray="2 12"/>'),
    jar: A('<path d="M60 86h80v58a22 22 0 0 1-22 22H82a22 22 0 0 1-22-22z"/><rect x="54" y="60" width="92" height="24" rx="9"/><path d="M72 112h56"/>'),
    colander: A('<path d="M36 84h128c0 41-29 68-64 68s-64-27-64-68z"/><path d="M24 80h152"/><circle cx="70" cy="106" r="6"/><circle cx="100" cy="116" r="6"/><circle cx="130" cy="106" r="6"/>'),
    spices: A('<rect x="56" y="96" width="34" height="64" rx="7"/><rect x="52" y="80" width="42" height="18" rx="7"/><rect x="112" y="110" width="30" height="50" rx="7"/><rect x="108" y="94" width="38" height="18" rx="7"/>'),
    apron: A('<path d="M72 52h56l14 22-18 10v76a14 14 0 0 1-14 14H90a14 14 0 0 1-14-14V84L58 74z"/><path d="M78 104h44M78 128h44"/>'),
    mitt: A('<rect x="62" y="80" width="70" height="76" rx="26"/><path d="M132 106h16a13 13 0 0 1 13 13v20a13 13 0 0 1-13 13h-16"/><path d="M78 104v34M100 104v34M122 104v34" stroke-dasharray="2 10"/>'),
    towel: A('<rect x="38" y="70" width="124" height="70" rx="9"/><path d="M38 70v-9a9 9 0 0 1 9-9h106a9 9 0 0 1 9 9v9"/><path d="M58 90v34M84 90v34M110 90v34M136 90v34"/>'),
    teapot: A('<path d="M56 96h88v30a44 44 0 0 1-88 0z"/><path d="M56 96a44 44 0 0 1 88 0"/><rect x="88" y="60" width="24" height="11" rx="5.5"/><path d="M144 106l30 8a9 9 0 0 1-4 17l-28-9"/><path d="M56 106H36a9 9 0 0 0-9 9v14a9 9 0 0 0 9 9h16"/>'),
    frenchpress: A('<path d="M64 80h72v64a26 26 0 0 1-26 26H90a26 26 0 0 1-26-26z"/><rect x="58" y="60" width="84" height="18" rx="7"/><path d="M100 60V32M86 32h28"/><path d="M64 112h72"/>'),
    cup: A('<path d="M54 74h92l-9 62a25 25 0 0 1-25 21H88a25 25 0 0 1-25-21z"/><path d="M146 88h17a15 15 0 0 1 0 30h-17"/><path d="M44 170h112"/>'),
    baking: A('<path d="M42 92h116l-11 58a13 13 0 0 1-13 11H66a13 13 0 0 1-13-11z"/><path d="M30 92h140"/><path d="M92 92V70a10 10 0 0 1 20 0v22"/><path d="M62 118h76"/>'),
    yogurtmaker: A('<path d="M58 70h84v56a28 28 0 0 1-28 28H86a28 28 0 0 1-28-28z"/><rect x="52" y="54" width="96" height="18" rx="8"/><circle cx="80" cy="104" r="9"/><circle cx="120" cy="104" r="9"/><path d="M74 130h52"/>'),
    grill: A('<path d="M46 96h108v46a22 22 0 0 1-22 22H68a22 22 0 0 1-22-22z"/><path d="M46 96a54 54 0 0 1 108 0"/><path d="M66 118h68M66 134h68"/><path d="M154 104h20v34h-20z"/>')
  };
})();
