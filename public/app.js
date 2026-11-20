/* Tanjiro — site application.
   Hash router, two shells (public site + dashboard), live stats, pairing flow.
   Every dynamic value that reaches the DOM through a template goes through esc(). */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k, d = '') { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};
const digits = (s) => String(s || '').replace(/\D/g, '').slice(0, 15);

/* ---------- state ---------- */
let L = store.get('l');
if (L !== 'ar' && L !== 'en') L = (navigator.language || '').toLowerCase().startsWith('ar') ? 'ar' : 'en';
let MO = store.get('m') !== '0' && !matchMedia('(prefers-reduced-motion:reduce)').matches;
let MY = digits(store.get('my'));
store.del('md');
let CD = 0;
let PAIRING = false;
const S = { st: null, at: 0 };
const x = (a, b) => (L === 'ar' ? b : a);

/* ---------- icons ---------- */
const I = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  shield: 'M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  users: 'M16 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 20v-2a4 4 0 0 0-3-3.9M16 3.1a3.5 3.5 0 0 1 0 6.8',
  bot: 'M12 8V4M8 4h8M5 8h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zM9 14v1M15 14v1',
  sl: 'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5M12 17h0',
  act: 'M3 12h4l3-8 4 16 3-8h4',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.7 3.7 5.7 3.7 9s-1.2 6.3-3.7 9c-2.5-2.7-3.7-5.7-3.7-9S9.5 5.7 12 3z',
  menu: 'M4 7h16M4 12h16M4 17h10',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  check: 'm5 12 5 5 9-10',
  copy: 'M9 9h10v11H9zM5 15V4h10',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  lock: 'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3',
  phone: 'M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2',
  plus: 'M12 5v14M5 12h14',
  chev: 'm6 9 6 6 6-6',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  server: 'M4 4h16v6H4zM4 14h16v6H4zM8 7h0M8 17h0',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M9 7h6',
  out: 'M15 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-4M10 17l-5-5 5-5M5 12h11',
  code: 'M8 9h8M8 15h8M10 3 8 21M16 3l-2 18',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
};
const ic = (n, c = '') => `<svg class="ic ${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${I[n]}"/></svg>`;
const J = async (u, o) => { try { const r = await fetch(u, o); return await r.json(); } catch { return null; } };
const JR = async (u, o) => { try { const r = await fetch(u, o); let data = null; try { data = await r.json(); } catch {} return { status: r.status, data }; } catch { return { status: 0, data: null }; } };
const ago = (t) => {
  const m = Math.max(0, Math.round((Date.now() - t) / 6e4));
  return m < 1 ? x('just now', 'الآن') : m < 60 ? x(m + ' min ago', 'قبل ' + m + ' د') : m < 1440 ? x(Math.round(m / 60) + ' h ago', 'قبل ' + Math.round(m / 60) + ' س') : x(Math.round(m / 1440) + ' d ago', 'قبل ' + Math.round(m / 1440) + ' يوم');
};
const fmtUp = (t) => { const d = Math.floor(t / 86400), h = Math.floor(t % 86400 / 3600), m = Math.floor(t % 3600 / 60); return d ? d + 'd ' + h + 'h' : h ? h + 'h ' + m + 'm' : m + 'm'; };

/* ---------- content ---------- */
const MODE_LABELS = 0;
const NAV = [['home', 'Home', 'الرئيسية'], ['how', 'How it works', 'كيف يعمل'], ['security', 'Security', 'الأمان'], ['faq', 'FAQ', 'الأسئلة'], ['status', 'Status', 'الحالة']];
const APP_NAV = [['dashboard', 'Overview', 'نظرة عامة', 'home'], ['install', 'Install', 'التنصيب', 'bolt'], ['bots', 'My bots', 'بوتاتي', 'bot'], ['stats', 'Statistics', 'الإحصائيات', 'chart'], ['help', 'Help', 'المساعدة', 'help'], ['settings', 'Settings', 'الإعدادات', 'sl']];
const LEGACY = { features: 'home', about: 'home', changelog: 'home', limits: 'security', 'app/live': 'app/stats', 'app/notifications': 'app/stats', 'app/guides': 'app/help', 'app/support': 'app/help', 'app/security': 'app/help', 'app/about': 'app/dashboard' };
const LAND = ['home', 'how', 'security', 'faq', 'status', 'privacy', 'terms'];
const APP = APP_NAV.map((p) => p[0]);

const FEAT = () => [
  ['bolt', x('Instant pairing', 'ربط فوري'), x('Get a real WhatsApp pairing code and link your number in seconds.', 'احصل على كود ربط حقيقي من واتساب واربط رقمك خلال ثوانٍ.')],
  ['shield', x('Private by design', 'خصوصية بالتصميم'), x('Public pages show masked numbers only. You can unlink at any time.', 'الصفحات العامة تعرض أرقاماً مخفية جزئياً، ويمكنك فك الربط متى شئت.')],
  ['act', x('Live monitoring', 'مراقبة مباشرة'), x('Watch online visitors and connected bots in real time.', 'تابع الزوار المتصلين والبوتات المتصلة مباشرة.')],
  ['chart', x('Real statistics', 'إحصائيات حقيقية'), x('Every number on this site is read from the running bot.', 'كل رقم في هذا الموقع مقروء من البوت أثناء تشغيله.')],
  ['globe', x('English and Arabic', 'عربي وإنجليزي'), x('Switch language and direction instantly.', 'بدّل اللغة والاتجاه فوراً.')],
  ['clock', x('Always restored', 'يعود تلقائياً'), x('Linked bots reconnect automatically after a server restart.', 'البوتات المربوطة تعيد الاتصال تلقائياً بعد إعادة تشغيل السيرفر.')],
];
const STEPS = () => [
  [x('Enter your number', 'أدخل رقمك'), x('Use the international format, without a plus sign or leading zeros.', 'بالصيغة الدولية، بدون علامة + أو أصفار في البداية.')],
  [x('Receive a pairing code', 'استلم كود الربط'), x('A real eight-character code is generated by WhatsApp for your number.', 'يولّد واتساب كوداً حقيقياً من ثمانية رموز لرقمك.')],
  [x('Link in WhatsApp', 'اربط في واتساب'), x('Open Linked devices, choose Link with phone number, and type the code.', 'افتح الأجهزة المرتبطة، اختر الربط برقم الهاتف، واكتب الكود.')],
  [x('You are live', 'أصبح بوتك يعمل'), x('This site confirms the connection as soon as the bot is online.', 'يؤكد الموقع الاتصال فور ظهور البوت متصلاً.')],
];
/* [category, question EN, question AR, answer EN, answer AR] */
const QA = () => [
  ['start', 'What is Tanjiro?', 'ما هو Tanjiro؟', 'A simple way to run your own WhatsApp bot. You link your number with a pairing code and the bot runs for you.', 'طريقة بسيطة لتشغيل بوت واتساب خاص بك. تربط رقمك بكود ربط ويعمل البوت لك.'],
  ['start', 'Which number format should I use?', 'ما صيغة الرقم المطلوبة؟', 'The international format, digits only: no plus sign, no spaces and no leading zeros.', 'الصيغة الدولية، أرقام فقط: بدون علامة + أو مسافات أو أصفار في البداية.'],
  ['code', 'Is the code real?', 'هل الكود حقيقي؟', 'Yes. It is generated by WhatsApp for your number through the official linking flow.', 'نعم، يولّده واتساب لرقمك عبر آلية الربط الرسمية.'],
  ['code', 'How long is the code valid?', 'كم مدة صلاحية الكود؟', 'A few minutes. If it expires, request a new one.', 'دقائق قليلة. إن انتهت اطلب كوداً جديداً.'],
  ['code', 'Where do I type the code?', 'أين أكتب الكود؟', 'In WhatsApp open Linked devices, choose Link a device, then Link with phone number instead, and type the code.', 'في واتساب افتح الأجهزة المرتبطة، اختر ربط جهاز، ثم الربط برقم الهاتف بدلاً من ذلك، واكتب الكود.'],
  ['code', 'The code was rejected. What now?', 'الكود مرفوض، ماذا أفعل؟', 'Check the number format, then request a new code.', 'تحقق من صيغة الرقم ثم اطلب كوداً جديداً.'],
  ['manage', 'How do I unlink my bot?', 'كيف أفك الربط؟', 'WhatsApp, Linked devices, then log out of the device.', 'واتساب، الأجهزة المرتبطة، ثم تسجيل الخروج من الجهاز.'],
  ['manage', 'The bot server is unavailable.', 'سيرفر البوت غير متاح.', 'The server may be restarting. Try again in a minute.', 'قد يكون السيرفر يعيد التشغيل. حاول بعد دقيقة.'],
  ['manage', 'Will my bot reconnect after a restart?', 'هل يعود بوتي بعد إعادة التشغيل؟', 'Yes. Linked bots reconnect automatically after a server restart.', 'نعم، البوتات المربوطة تعيد الاتصال تلقائياً بعد إعادة تشغيل السيرفر.'],
  ['privacy', 'How many code requests can I make?', 'كم طلب كود يمكنني إرساله؟', 'Up to 5 requests every 10 minutes per visitor, and one request per number at a time.', 'حتى 5 طلبات كل 10 دقائق لكل زائر، وطلب واحد لكل رقم في الوقت نفسه.'],
  ['privacy', 'What do you store about me?', 'ماذا تخزّنون عني؟', 'The number you link and its WhatsApp session files, on the bot server. Nothing else is needed to keep your bot running.', 'الرقم الذي تربطه وملفات جلسة واتساب الخاصة به على سيرفر البوت. لا شيء آخر مطلوب لتشغيل بوتك.'],
  ['privacy', 'Are phone numbers shown publicly?', 'هل تظهر الأرقام للعامة؟', 'Only partly hidden. Public pages never show a full phone number.', 'تظهر مخفية جزئياً فقط. الصفحات العامة لا تعرض رقماً كاملاً أبداً.'],
];
const CATS = () => [
  ['start', 'bolt', x('Getting started', 'البداية'), x('Numbers, codes and basics', 'الأرقام والأكواد والأساسيات')],
  ['code', 'code', x('Pairing code', 'كود الربط'), x('Requesting and entering it', 'طلبه وإدخاله')],
  ['manage', 'link', x('Managing your bot', 'إدارة البوت'), x('Unlinking and restarts', 'فك الربط وإعادة التشغيل')],
  ['privacy', 'lock', x('Limits and privacy', 'الحدود والخصوصية'), x('What is stored and shown', 'ما يُخزَّن وما يظهر')],
];

/* ---------- helpers that build markup ---------- */
const sec = (inner, cls = '') => `<section class="sec ${cls}"><div class="wrap">${inner}</div></section>`;
const pageHead = (ey, title, lead, cls = '') => `<header class="ph ${cls}"><div class="wrap"><span class="ey rv">${ey}</span><h1 class="rv">${title}</h1>${lead ? `<p class="lead rv">${lead}</p>` : ''}</div></header>`;
const secHead = (ey, title, lead = '') => `<div class="sec-h rv"><span class="ey">${ey}</span><h2>${title}</h2>${lead ? `<p class="lead">${lead}</p>` : ''}</div>`;
const cardsHtml = (a, cls = '') => `<div class="grid ${cls}">${a.map(([i, t, d]) => `<article class="card rv">${ic(i, 'ci')}<h3>${t}</h3><p>${d}</p></article>`).join('')}</div>`;
const stat = (k, l, i, suf = '') => `<div class="magic-bento-card magic-bento-card--border-glow"><div class="magic-bento-card__header"><span class="magic-bento-card__label">${l}</span>${ic(i)}</div><div class="magic-bento-card__content"><div class="num" data-s="${k}" data-suf="${suf}">—</div></div></div>`;
const bentoWrap = (cards, cls = '') => `<div class="bento-section rv"><div class="card-grid ${cls}">${cards.join('')}</div></div>`;
const featBento = () => bentoWrap(FEAT().map((f, i) => `<div class="magic-bento-card magic-bento-card--border-glow"><div class="magic-bento-card__header"><span class="magic-bento-card__label">0${i + 1}</span>${ic(f[0])}</div><div class="magic-bento-card__content"><h3 class="magic-bento-card__title">${f[1]}</h3><p class="magic-bento-card__description">${f[2]}</p></div></div>`), 'c3');
const stepsRow = () => `<div class="steps">${STEPS().map((s, i) => `<div class="stp rv"><b>0${i + 1}</b><h3>${s[0]}</h3><p>${s[1]}</p></div>`).join('')}</div>`;
const stepsCol = () => `<div class="steps col">${STEPS().map((s, i) => `<div class="stp rv"><b>0${i + 1}</b><div><h3>${s[0]}</h3><p>${s[1]}</p></div></div>`).join('')}</div>`;
const accordion = (items) => `<div class="acc">${items.map(([, q, a]) => `<div class="acc-i"><button type="button" aria-expanded="false"><span>${q}</span><i>${ic('chev')}</i></button><div class="acc-p"><div><p>${a}</p></div></div></div>`).join('')}</div>`;
const qaItems = () => QA().map(([c, qe, qa, ae, aa]) => [c, x(qe, qa), x(ae, aa)]);
const cta = () => `<div class="cta rv"><div><h2>${x('Ready to link your number?', 'جاهز لربط رقمك؟')}</h2><p>${x('It takes about a minute.', 'يستغرق الأمر دقيقة تقريباً.')}</p></div><a class="btn" href="#/app/install">${x('Install now', 'ثبّت الآن')}${ic('arrow', 'go')}</a></div>`;
const bars = (d) => d && d.length ? `<div class="bars">${d.map((o) => `<div class="bc"><b>${esc(o.n)}</b><i style="height:calc((100% - 46px) * ${Math.max(.02, (+o.n || 0) / Math.max(1, ...d.map((z) => +z.n || 0))).toFixed(3)})"></i><span class="ltr">${esc(o.d)}</span></div>`).join('')}</div>` : `<p class="empty" style="margin-top:14px">${x('Statistics are unavailable right now.', 'الإحصائيات غير متاحة حالياً.')}</p>`;
const rec = () => S.st?.recent?.length ? S.st.recent.map((r) => `<div class="rw"><span class="ltr">${esc(r.n)}</span><span>${ago(+r.t)}</span></div>`).join('') : `<p class="empty">${x('No installs recorded yet.', 'لا توجد عمليات تنصيب مسجّلة بعد.')}</p>`;
const CAT = `<svg class="nf-cat" viewBox="0 0 220 190" role="img" aria-label="Cat"><g fill="#0A0A0A" stroke="none"><g class="cat-tail"><path d="M148 168c34 2 52-16 46-44-3-14 6-24 16-22" fill="none" stroke="#0A0A0A" stroke-width="13" stroke-linecap="round"/></g><path d="M62 178c-12-48 6-86 48-86s60 38 46 86z"/><g class="cat-head"><g class="cat-ear l"><path d="M80 52 76 12l28 22z"/><path d="M84 44 83 26l12 9z" fill="#fff"/></g><g class="cat-ear r"><path d="M140 52l4-40-28 22z"/><path d="M136 44l1-18-12 9z" fill="#fff"/></g><circle cx="110" cy="68" r="38"/><g class="cat-eyes"><ellipse cx="96" cy="66" rx="7" ry="9" fill="#fff"/><ellipse cx="124" cy="66" rx="7" ry="9" fill="#fff"/><g class="cat-pupils"><rect x="94.5" y="59" width="3" height="14" rx="1.5"/><rect x="122.5" y="59" width="3" height="14" rx="1.5"/></g></g><path d="M106 79h8l-4 5z" fill="#fff"/><g stroke="#0A0A0A" stroke-width="1.6" stroke-linecap="round"><path d="M74 78 46 72M74 83 44 86M146 78l28-6M146 83l30 3"/></g></g><ellipse cx="94" cy="178" rx="15" ry="8"/><ellipse cx="128" cy="178" rx="15" ry="8"/></g><path d="M20 186h180" stroke="#0A0A0A" stroke-opacity=".25" stroke-width="1.5" stroke-linecap="round"/></svg>`;
const NOT_FOUND = () => `<main class="nf"><div class="nf-in"><div class="nf-brand"><i>T</i><span>Tanjiro Bot</span></div>${CAT}<div class="nf-code">ERROR 404</div><h1>${x('Page not found', 'الصفحة غير موجودة')}</h1><p>${x('We couldn’t find the page you’re looking for on Tanjiro Bot.', 'لم نتمكن من العثور على الصفحة التي تبحث عنها في Tanjiro Bot.')}</p><p class="sub">${x('The link may be wrong, or the page may have been moved or deleted. Check the address and try again.', 'قد يكون الرابط غير صحيح، أو أن الصفحة تم نقلها أو حذفها. تحقق من عنوان الصفحة وحاول الوصول إليها مرة أخرى.')}</p><div class="nf-pill"><span class="dot off"></span>${x('Link unavailable', 'الرابط غير متاح')}</div><a class="btn" href="#/home">${x('Back to home', 'العودة للرئيسية')}</a></div></main>`;


/* ---------- segmented control, visual guide, country picker ---------- */
const seg = (id, items, on, act = '') => `<div class="seg" id="${id}" role="tablist" style="--n:${items.length};--i:${Math.max(0, items.findIndex((i) => i[0] === on))}"><i class="seg-i"></i>${items.map(([k, t]) => `<button type="button" role="tab" data-k="${k}" ${act ? `data-a="${act}" data-v="${k}"` : ''} class="${k === on ? 'on' : ''}" aria-selected="${k === on}">${t}</button>`).join('')}</div>`;
const vguide = () => {
  const sc = [
    [x('Open Settings', 'افتح الإعدادات'), 'WhatsApp', [x('Chats', 'المحادثات'), x('Updates', 'التحديثات'), x('Settings', 'الإعدادات')], 2],
    [x('Linked devices', 'الأجهزة المرتبطة'), x('Settings', 'الإعدادات'), [x('Account', 'الحساب'), x('Privacy', 'الخصوصية'), x('Linked devices', 'الأجهزة المرتبطة')], 2],
    [x('Link with phone number', 'الربط برقم الهاتف'), x('Linked devices', 'الأجهزة المرتبطة'), [x('Link a device', 'ربط جهاز'), x('Link with phone number instead', 'الربط برقم الهاتف بدلاً من ذلك')], 1],
    [x('Type the code', 'اكتب الكود'), x('Enter code', 'أدخل الكود'), [], -1],
  ];
  return `<div class="vg" id="vg"><div class="vg-t">${sc.map((s, i) => `<button type="button" data-g="${i}" class="${i ? '' : 'on'}"><b>[0${i + 1}]</b>${s[0]}</button>`).join('')}</div>
  <div class="vg-p"><div class="vg-ph">${sc.map((s, i) => `<div class="vg-s ${i ? '' : 'on'}"><h4>${s[1]}</h4>${s[2].map((r, j) => `<div class="vg-r ${j === s[3] ? 'hl' : ''}">${r}</div>`).join('')}${i === 3 ? '<div class="vg-c">' + '<i></i>'.repeat(8) + '</div>' : ''}</div>`).join('')}</div></div>
  <p class="vg-cap" id="vgc">${sc[0][0]}</p></div>`;
};
let CC = null;
const ccList = () => COUNTRIES.slice().sort((a, b) => (L === 'ar' ? a.ar.localeCompare(b.ar, 'ar') : a.en.localeCompare(b.en)));
const ccPick = () => {
  const saved = store.get('cc'), reg = ((navigator.language || '').split('-')[1] || '').toUpperCase();
  return COUNTRIES.find((c) => c.iso === saved) || COUNTRIES.find((c) => c.iso === reg) || COUNTRIES.find((c) => c.iso === 'SA');
};

/* ---------- public pages ---------- */
const P = {
  home: () => `
<section class="kh" id="kh" aria-labelledby="kh-t">
  <canvas class="kh-canvas" aria-hidden="true"></canvas>
  <div class="kh-copy">
    <h1 id="kh-t"><span class="kh-m">${x('Your WhatsApp bot,', 'بوتك على واتساب،')}</span> <span class="kh-s">${x('live in a minute.', 'يعمل خلال دقيقة.')}</span></h1>
    <p>${x('Enter your number, get a real pairing code, and link it. No setup.', 'أدخل رقمك، احصل على كود ربط حقيقي، واربطه. بلا إعدادات.')}</p>
    <div class="kh-cta"><a href="#/app/install">${x('Install bot', 'تنصيب البوت')}</a></div>
  </div>
  <ul class="kh-chips" aria-label="${esc(x('What you get', 'ما ستحصل عليه'))}">${[['bolt', x('Instant pairing', 'ربط فوري')], ['shield', x('Masked numbers', 'أرقام مخفية')], ['act', x('Live status', 'حالة مباشرة')], ['clock', x('Auto-reconnect', 'إعادة اتصال تلقائية')], ['globe', x('English and Arabic', 'عربي وإنجليزي')]].map(([i, t]) => `<li>${ic(i)}${t}</li>`).join('')}</ul>
</section>
${sec(`<div class="strip-h rv"><h2>${x('Live numbers', 'أرقام مباشرة')}</h2><p class="lead" style="font-size:16px">${x('Read from the running bot, never estimated.', 'مقروءة من البوت أثناء تشغيله، وليست مقدّرة.')}</p></div>
<div class="strip rv">${[['total', x('Bots installed', 'بوتات منصّبة')], ['today', x('Installs today', 'تنصيبات اليوم')], ['online', x('Online now', 'متصلون الآن')], ['active', x('Active bots', 'بوتات نشطة')]].map(([k, l]) => `<div><div class="num" data-s="${k}">—</div><div class="lb">${l}</div></div>`).join('')}</div>`)}
${sec(secHead(x('How it works', 'كيف يعمل'), x('Four steps to a live bot.', 'أربع خطوات إلى بوت يعمل.')) + stepsRow() + `<div class="rv" style="margin-top:44px"><a class="btn o" href="#/how">${x('See the full guide', 'شاهد الشرح الكامل')}${ic('arrow', 'go')}</a></div>`)}
${sec(secHead(x('Why Tanjiro', 'لماذا Tanjiro'), x('Built to feel effortless.', 'مصمم ليكون سهلاً.')) + featBento())}
${sec(cta())}`,

  how: () => pageHead('01', x('Four steps.', 'أربع خطوات.'), x('From a phone number to a running bot.', 'من رقم هاتف إلى بوت يعمل.')) + '<div class="band" aria-hidden="true"></div>'
    + sec(stepsCol(), 'first')
    + sec(secHead(x('Inside WhatsApp', 'داخل واتساب'), x('Where to tap.', 'أين تضغط.')) + `<div class="card rv" style="max-width:720px">${vguide()}</div>`)
    + sec(cta()),

  security: () => pageHead('02', x('Security first.', 'الأمان أولاً.'), x('How linking and your data are handled, and the limits that keep the service stable.', 'كيف نتعامل مع الربط وبياناتك، والحدود التي تُبقي الخدمة مستقرة.'))
    + sec(`<div class="sec-h rv"><h2>${x('How we protect you', 'كيف نحميك')}</h2></div>` + cardsHtml([
      ['lock', x('Official linking', 'ربط رسمي'), x('Uses WhatsApp’s own pairing-code flow.', 'يعتمد آلية كود الربط الرسمية في واتساب.')],
      ['eye', x('Masked numbers', 'أرقام مخفية'), x('Public pages never show a full phone number.', 'الصفحات العامة لا تعرض رقماً كاملاً أبداً.')],
      ['shield', x('Validated requests', 'طلبات مُتحقَّق منها'), x('Every request is checked on the server before it reaches the bot, and strict browser security headers are enforced.', 'يُفحص كل طلب على الخادم قبل وصوله إلى البوت، وتُطبَّق ترويسات أمان صارمة على المتصفح.')],
      ['link', x('You stay in control', 'أنت المتحكم'), x('Unlink from WhatsApp whenever you like.', 'فك الربط من واتساب في أي وقت.')],
    ], 'g2'), 'first')
    + sec(`<div class="sec-h rv"><h2>${x('Fair-use limits', 'حدود الاستخدام العادل')}</h2><p class="lead">${x('Limits that keep the service stable for everyone.', 'حدود تُبقي الخدمة مستقرة للجميع.')}</p></div>
      <div class="facts rv">${[
        [x('5 requests / 10 min', '5 طلبات / 10 دقائق'), x('Pairing-code requests per visitor.', 'طلبات الكود لكل زائر.')],
        [x('One request per number', 'طلب واحد لكل رقم'), x('A new request waits until the previous one finishes.', 'ينتظر الطلب الجديد انتهاء السابق.')],
        [x('Capacity cap', 'حد السعة'), x('The server accepts a limited number of linked bots at once.', 'يقبل السيرفر عدداً محدوداً من البوتات المربوطة في الوقت نفسه.')],
      ].map(([a, b]) => `<div><b>${a}</b><span>${b}</span></div>`).join('')}</div>`)
    + sec(`<div class="cta rv"><div><h2>${x('Read the details.', 'اقرأ التفاصيل.')}</h2><p>${x('What we keep, and the rules for using the service.', 'ما نحتفظ به، وقواعد استخدام الخدمة.')}</p></div><div style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn o" href="#/privacy">${x('Privacy', 'الخصوصية')}</a><a class="btn o" href="#/terms">${x('Terms', 'الشروط')}</a></div></div>`),

  faq: () => `<header class="ph center"><div class="wrap"><span class="ey rv">FAQ</span><h1 class="rv">${x('Frequently asked questions.', 'الأسئلة الشائعة.')}</h1><p class="lead rv">${x('Answers about pairing, linking, limits and privacy.', 'إجابات عن الربط والحدود والخصوصية.')}</p>
    <div class="faq-s rv">${ic('search')}<input id="fq" type="search" placeholder="${esc(x('Search the questions', 'ابحث في الأسئلة'))}" autocomplete="off" aria-label="${esc(x('Search the questions', 'ابحث في الأسئلة'))}"></div></div></header>
    <section class="wrap" style="padding-bottom:clamp(60px,9vw,112px)">
      <div class="cats rv" id="cats">${CATS().map(([k, i, t, d]) => `<button type="button" class="cat" data-c="${k}" aria-pressed="false"><i>${ic(i)}</i><span><strong>${t}</strong><small>${QA().filter((q) => q[0] === k).length} ${x('answers', 'إجابات')} · ${d}</small></span></button>`).join('')}</div>
      <div id="acc">${accordion(qaItems())}</div><p class="acc-none" id="none" hidden>${x('No questions match your search.', 'لا توجد أسئلة مطابقة لبحثك.')}</p>
    </section>`,

  status: () => pageHead('03', x('System status.', 'حالة النظام.'), x('Read live from the bot server. Refreshes every few seconds.', 'تُقرأ مباشرة من سيرفر البوت وتتحدث كل بضع ثوانٍ.'))
    + sec(`<div class="stat-hero rv" id="stc"></div><div class="strip rv" style="margin-top:16px;grid-template-columns:repeat(4,1fr)">${[['active', x('Active bots', 'البوتات النشطة')], ['online', x('Online visitors', 'الزوار المتصلون')], ['uptime', x('Server uptime', 'مدة التشغيل')], ['ms', x('Response time', 'زمن الاستجابة')]].map(([k, l]) => `<div><div class="num" data-s="${k}" data-suf="${k==='ms'?' ms':''}">—</div><div class="lb">${l}</div></div>`).join('')}</div>`, 'first'),

  privacy: () => pageHead(x('Legal', 'قانوني'), x('Privacy.', 'الخصوصية.'), x('What we keep, and why.', 'ما نحتفظ به ولماذا.'))
    + sec(`<div class="doc"><aside class="doc-side rv"><span class="ey">${x('In short', 'باختصار')}</span><p>${x('We keep only what is needed to run your bot. Public pages show masked numbers.', 'نحتفظ بما يلزم لتشغيل بوتك فقط. الصفحات العامة تعرض أرقاماً مخفية.')}</p></aside>
      <div class="doc-body">${[
        [x('What we store', 'ما نخزّنه'), x('To keep your bot running we store the number you link and its WhatsApp session files on the bot server.', 'لإبقاء بوتك يعمل نخزّن الرقم الذي تربطه وملفات جلسة واتساب على سيرفر البوت.')],
        [x('What public pages show', 'ما تعرضه الصفحات العامة'), x('Public pages display masked numbers only, never a full phone number.', 'الصفحات العامة تعرض أرقاماً مخفية فقط، ولا تعرض رقماً كاملاً أبداً.')],
        [x('Visitor counting', 'عدّ الزوار'), x('The visitor counter uses a random anonymous identifier stored in your browser. It is not linked to your number.', 'يعتمد عدّاد الزوار على معرّف عشوائي مجهول في متصفحك، ولا يرتبط برقمك.')],
        [x('Ending the session', 'إنهاء الجلسة'), x('Unlinking from WhatsApp ends the session. You can also clear your saved number from Settings.', 'فك الربط من واتساب ينهي الجلسة. ويمكنك أيضاً مسح رقمك المحفوظ من الإعدادات.')],
      ].map(([t, d], i) => `<section class="rv"><h3><small>0${i + 1}</small>${t}</h3><p>${d}</p></section>`).join('')}</div></div>`, 'first'),

  terms: () => pageHead(x('Legal', 'قانوني'), x('Terms of use.', 'شروط الاستخدام.'), x('Plain rules for using the service.', 'قواعد واضحة لاستخدام الخدمة.'))
    + sec(`<div class="doc"><aside class="doc-side rv"><span class="ey">${x('In short', 'باختصار')}</span><p>${x('Use your own number, do not abuse the service, and leave whenever you want.', 'استخدم رقمك الخاص، ولا تسئ استخدام الخدمة، وغادر متى شئت.')}</p></aside>
      <div class="doc-body">${[
        [x('Your own number', 'رقمك أنت'), x('Link only a number you own or have permission to use.', 'اربط فقط رقماً تملكه أو لديك إذن باستخدامه.')],
        [x('No abuse', 'لا إساءة استخدام'), x('Bots used for spam or abuse may be disconnected.', 'قد يُفصل أي بوت يُستخدم في الإزعاج أو الإساءة.')],
        [x('As is', 'كما هي'), x('The service is provided without guarantees of uptime.', 'تُقدَّم الخدمة دون ضمان لمدة التشغيل.')],
        [x('Leave any time', 'اخرج متى شئت'), x('Unlink from WhatsApp and the session ends.', 'فك الربط من واتساب لتنتهي الجلسة.')],
      ].map(([t, d], i) => `<section class="rv"><h3><small>0${i + 1}</small>${t}</h3><p>${d}</p></section>`).join('')}</div></div>`, 'first'),
};

/* ---------- dashboard pages ---------- */
const AH = (t, s) => `<div class="ap-h rv"><h1>${t}</h1><p>${s}</p></div>`;
const A = {
  dashboard: () => AH(x('Overview', 'نظرة عامة'), x('A live look at the service.', 'نظرة مباشرة على الخدمة.'))
    + bentoWrap([stat('today', x('Installs today', 'تنصيبات اليوم'), 'bolt'), stat('total', x('Total installs', 'إجمالي التنصيبات'), 'bot'), stat('online', x('Online now', 'متصلون الآن'), 'users'), stat('active', x('Active bots', 'بوتات نشطة'), 'server')])
    + `<div class="two"><div class="card rv"><h3 class="sm">${x('Last 7 days', 'آخر 7 أيام')}</h3><div id="bz">${bars(S.st?.days)}</div></div><div class="card rv"><h3 class="sm">${x('Recent installs', 'آخر التنصيبات')}</h3><div id="rc">${rec()}</div></div></div>`
    + `<div class="quick">${[['bolt', 'install', x('Install a bot', 'تنصيب بوت'), x('Link a number now.', 'اربط رقماً الآن.')], ['chart', 'stats', x('Statistics', 'الإحصائيات'), x('See the full numbers.', 'شاهد الأرقام كاملة.')], ['help', 'help', x('Help', 'المساعدة'), x('Quick fixes and answers.', 'حلول سريعة وإجابات.')]].map(([i, h, t, d]) => `<a href="#/app/${h}" class="card rv">${ic(i, 'ci')}<h3 class="sm">${t}</h3><p>${d}</p></a>`).join('')}</div>`,

  install: () => { CC = CC || ccPick(); return AH(x('Install', 'التنصيب'), x('Choose your country, enter your number, and get your pairing code.', 'اختر دولتك وأدخل رقمك واحصل على كود الربط.'))
    + `<div class="install"><div class="card rv" id="ic">
      <ol class="stepper" id="stp">${[x('Number', 'الرقم'), x('Code', 'الكود'), x('Linked', 'الربط')].map((t, i) => `<li class="${i ? '' : 'on'}"><b>[0${i + 1}]</b><span>${t}</span></li>`).join('')}</ol>
      <div id="fm">
        <div class="phone-row"><div class="cc" id="cc"><button type="button" class="cc-b" id="ccb" aria-haspopup="listbox" aria-expanded="false" aria-label="${esc(x('Country', 'الدولة'))}"><span id="ccf">${CC.flag}</span><span class="ltr" id="ccd">+${CC.dial}</span>${ic('chev')}</button><div class="cc-p" id="ccp" hidden><input id="ccs" type="search" autocomplete="off" placeholder="${esc(x('Search country or code', 'ابحث بالدولة أو الرمز'))}" aria-label="${esc(x('Search country or code', 'ابحث بالدولة أو الرمز'))}"><ul class="cc-l" id="ccl" role="listbox"></ul></div></div>
          <div class="fc"><input id="num" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="18" placeholder=" "><label for="num">${L === 'ar' ? `<span>${x('Phone number', 'رقم الهاتف')}</span>` : [...'Phone number'].map((c, i) => `<span style="transition-delay:${i * 35}ms">${c === ' ' ? '&nbsp;' : c}</span>`).join('')}</label></div></div>
        <p class="hint">${x('Leading zeros are removed automatically. We will generate a real pairing code you type into WhatsApp.', 'تتم إزالة الأصفار الزائدة تلقائياً. سننشئ كود ربط حقيقياً تكتبه في واتساب.')}</p>
        <button class="btn full" id="go" type="button" style="margin-top:22px"><span id="gol">${x('Get pairing code', 'احصل على كود الربط')}</span>${ic('arrow', 'go')}</button></div>
      <div id="rs" hidden></div><div class="er" id="er" role="alert"></div></div>
      <div class="card rv">${vguide()}</div></div>`; },

  bots: () => AH(x('My bots', 'بوتاتي'), x('Your number and the latest bots linked through this site. Numbers are partly hidden.', 'رقمك وأحدث البوتات المربوطة عبر الموقع. الأرقام مخفية جزئياً.'))
    + `<div class="card rv"><div class="set"><div><b>${x('Your number', 'رقمك')}</b><small class="ltr">${esc(MY) || '—'}</small></div><span class="tag" id="my">${MY ? x('Checking...', 'جارٍ الفحص...') : x('Install a bot first', 'نصّب بوتاً أولاً')}</span></div>${MY ? '' : `<div class="set"><span class="empty">${x('You have not linked a number on this device yet.', 'لم تربط رقماً على هذا الجهاز بعد.')}</span><a class="btn sm" href="#/app/install">${x('Install', 'تنصيب')}</a></div>`}</div>`
    + bentoWrap([stat('total', x('Total installed', 'إجمالي المنصّبين'), 'bot'), stat('registered', x('Registered numbers', 'الأرقام المسجّلة'), 'users'), stat('active', x('Active now', 'نشط الآن'), 'server')], 'c3')
    + `<div class="card rv"><h3 class="sm">${x('Latest bots', 'أحدث البوتات')}</h3><div id="rc" style="margin-top:8px">${rec()}</div></div>`,

  stats: () => AH(x('Statistics', 'الإحصائيات'), x('Real figures from the running bot. Nothing is estimated.', 'أرقام حقيقية من البوت أثناء تشغيله. لا شيء مقدَّر.'))
    + bentoWrap([stat('today', x('Installs today', 'تنصيبات اليوم'), 'bolt'), stat('total', x('Installs overall', 'إجمالي التنصيبات'), 'bot'), stat('registered', x('Registered numbers', 'الأرقام المسجّلة'), 'users'), stat('rate', x('Link success rate', 'نسبة نجاح الربط'), 'check', '%')])
    + `<div class="card rv mk" id="mk" data-l="${L}"></div>`
    + `<div class="two"><div class="card rv"><h3 class="sm">${x('Installs per day', 'التنصيبات يومياً')}</h3><div id="bz">${bars(S.st?.days)}</div></div><div class="card rv"><h3 class="sm">${x('Latest installs', 'أحدث التنصيبات')}</h3><div id="rc">${rec()}</div></div></div>`
    + `<div class="ap-h rv"><h2 style="font-size:26px">${x('Live', 'مباشر')}</h2><p>${x('Updated every few seconds.', 'تتحدث كل بضع ثوانٍ.')}</p></div>`
    + bentoWrap([stat('online', x('Visitors online', 'زوار متصلون'), 'users'), stat('active', x('Bots connected', 'بوتات متصلة'), 'server'), stat('uptime', x('Server uptime', 'مدة التشغيل'), 'clock'), stat('ms', x('Response time', 'زمن الاستجابة'), 'act', ' ms')], 'c3')
    + `<p class="hint rv">${x('Registered numbers requested a code. Installs completed the link.', 'الأرقام المسجّلة طلبت كوداً. التنصيبات أكملت الربط.')}</p>`,

  help: () => AH(x('Help', 'المساعدة'), x('Quick fixes, safety tips and answers.', 'حلول سريعة ونصائح أمان وإجابات.'))
    + cardsHtml([
      ['phone', x('Code rejected', 'الكود مرفوض'), x('Check the number format, then request a new code.', 'تحقق من صيغة الرقم ثم اطلب كوداً جديداً.')],
      ['clock', x('Code expired', 'انتهى الكود'), x('Codes last a few minutes. Request another.', 'يدوم الكود دقائق. اطلب غيره.')],
      ['server', x('Bot unavailable', 'البوت غير متاح'), x('The server may be restarting. Try again in a minute.', 'قد يكون السيرفر يعيد التشغيل. حاول بعد دقيقة.')],
    ])
    + `<div class="ap-h rv"><h2 style="font-size:26px">${x('Keep your number safe', 'حافظ على رقمك آمناً')}</h2></div>`
    + cardsHtml([
      ['lock', x('Keep your code private', 'أبقِ الكود سرياً'), x('Never share your pairing code. Anyone with it can link your number.', 'لا تشارك كود الربط أبداً. من يملكه يستطيع ربط رقمك.')],
      ['link', x('Unlink a device', 'فك ربط جهاز'), x('WhatsApp, Linked devices, choose the device, then log out.', 'واتساب، الأجهزة المرتبطة، اختر الجهاز ثم سجّل الخروج.')],
      ['shield', x('Check linked devices', 'راجع الأجهزة المرتبطة'), x('Review the list regularly and remove any you do not recognise.', 'راجع القائمة بانتظام واحذف أي جهاز لا تعرفه.')],
    ])
    + `<div class="card rv"><h3 class="sm">${x('Frequently asked', 'أسئلة شائعة')}</h3>${accordion(qaItems().slice(0, 5))}<a class="btn o sm" href="#/faq" style="margin-top:18px">${x('All questions', 'كل الأسئلة')}${ic('arrow', 'go')}</a></div>`,

  settings: () => AH(x('Settings', 'الإعدادات'), x('Personalise your experience.', 'خصص تجربتك.'))
    + `<div class="card rv" style="max-width:640px"><div class="set"><div><b>${x('Language', 'اللغة')}</b><small>${x('Switches the text and the direction.', 'يغيّر النص والاتجاه.')}</small></div>${seg('lgs', [['en', 'English'], ['ar', 'العربية']], L, 'setlang')}</div>
      <div class="set"><div><b>${x('Smooth motion', 'الحركة السلسة')}</b><small>${x('Gentle transitions and reveals.', 'انتقالات وظهور هادئ.')}</small></div><button class="sw ${MO ? 'on' : ''}" type="button" role="switch" aria-checked="${MO}" aria-label="${esc(x('Smooth motion', 'الحركة السلسة'))}" data-a="mo"></button></div>
      <div class="set"><div><b>${x('Saved number', 'الرقم المحفوظ')}</b><small>${x('Stored only in this browser.', 'محفوظ في هذا المتصفح فقط.')}</small></div><button class="btn o sm" type="button" data-a="fg">${x('Clear', 'مسح')}</button></div>
      <div class="set"><div><b>${x('My links', 'روابطي')}</b><small>${x('Channels, groups and contact.', 'القنوات والمجموعات والتواصل.')}</small></div><button class="btn o sm" type="button" data-a="links">${x('Open', 'فتح')}</button></div></div>`,
};

/* ---------- shells ---------- */
let mode = '', MENU = null, PN = null, WT = [], BN = null, IO = null;
const root = $('#root');
const langBtn = (c = 'ib') => `<button class="${c}" type="button" data-a="lg" aria-label="${esc(x('Switch to Arabic', 'التبديل إلى الإنجليزية'))}">${L === 'ar' ? 'EN' : 'AR'}</button>`;
const logo = (href = '#/home') => `<a class="brand" href="${href}"><img src="/media/tanjiro-logo.png" alt="" width="34" height="34">Tanjiro</a>`;
const foot = () => `<footer class="ft"><div class="ft-dots" aria-hidden="true"><i></i></div><div class="wrap">
  <div class="ft-top"><h2>${x('Your own WhatsApp bot, linked in minutes.', 'بوت واتساب خاص بك، يرتبط خلال دقائق.')}</h2>
    <nav class="ft-col" aria-label="${x('Product', 'المنتج')}"><h4>${x('Product', 'المنتج')}</h4><a href="#/app/install">${x('Install', 'التنصيب')}</a><a href="#/how">${x('How it works', 'كيف يعمل')}</a><a href="#/status">${x('Status', 'الحالة')}</a></nav>
    <nav class="ft-col" aria-label="${x('Legal', 'قانوني')}"><h4>${x('Legal', 'قانوني')}</h4><a href="#/security">${x('Security', 'الأمان')}</a><a href="#/privacy">${x('Privacy', 'الخصوصية')}</a><a href="#/terms">${x('Terms', 'الشروط')}</a></nav>
    <nav class="ft-col" aria-label="${x('Support', 'الدعم')}"><h4>${x('Support', 'الدعم')}</h4><a href="#/faq">${x('FAQ', 'الأسئلة')}</a><button type="button" data-a="links">${x('My links', 'روابطي')}</button><a href="#/app/dashboard">${x('Dashboard', 'لوحة التحكم')}</a></nav></div>
  <a class="ft-brand" href="#/home" aria-label="Tanjiro"><img src="/media/tanjiro-logo.png" alt="" width="120" height="120"><span>Tanjiro</span></a>
  <div class="ft-legal"><span>© ${new Date().getFullYear()} Tanjiro. ${x('Built for WhatsApp.', 'مصمم لواتساب.')}</span><span>${x('Not affiliated with WhatsApp.', 'غير تابع لواتساب.')}</span></div></div></footer>`;

function mountNav() {
  MENU && MENU(); MENU = null;
  PN && PN.dispose(); PN = null;
  if (mode !== 'land') return;
  const host = $('#pn');
  if (host && window.mountPillNav && window.gsap) PN = mountPillNav(host, { logo: '<span></span>', items: NAV.map((p) => ({ href: '#/' + p[0], label: x(p[1], p[2]) })), vars: { base: '#0A0A0A', pill: '#fff', text: '#0A0A0A', hover: '#fff' } });
  if (matchMedia('(max-width:899px)').matches && window.mountStaggeredMenu && window.gsap) {
    MENU = mountStaggeredMenu({
      items: NAV.map((p) => ({ label: x(p[1], p[2]), link: '#/' + p[0] })).concat([{ label: x('Dashboard', 'لوحة التحكم'), link: '#/app/dashboard' }]),
      logo: logo(), extra: langBtn(), menu: x('Menu', 'القائمة'), close: x('Close', 'إغلاق'), accent: '#0A0A0A', colors: ['#0A0A0A', '#fff'],
      foot: `<a class="btn full" href="#/app/install">${x('Install bot', 'تنصيب البوت')}${ic('arrow', 'go')}</a>`,
    });
  }
  setActive();
}
function setActive() {
  const h = location.hash.replace(/^#\//, '') || 'home';
  PN && PN.setActive('#/' + h);
}
function shell(m) {
  mode = m;
  if (m === 'land') {
    root.innerHTML = `<header class="hd"><div class="wrap">${logo()}<div id="pn"></div><div class="hd-r">${langBtn()}<a class="btn sm" href="#/app/dashboard">${x('Dashboard', 'لوحة التحكم')}</a></div></div></header><main class="land" id="pg"></main>${foot()}`;
  } else if (m === 'app') {
    root.innerHTML = `<div class="app"><aside class="side" id="sd">${logo()}<nav aria-label="${esc(x('Dashboard', 'لوحة التحكم'))}">${APP_NAV.map((p) => `<a class="nv" href="#/app/${p[0]}" data-p="${p[0]}">${ic(p[3])}${x(p[1], p[2])}</a>`).join('')}</nav><div class="side-b"><a class="nv" href="#/home">${ic('out')}${x('Back to site', 'العودة للموقع')}</a><button class="nv" type="button" data-a="links">${ic('link')}${x('My links', 'روابطي')}</button></div></aside><div class="sc" id="sc" data-a="sd"></div>
    <div class="amain"><div class="tb"><button class="ib mb" type="button" data-a="sd" aria-label="${esc(x('Menu', 'القائمة'))}">${ic('menu')}</button><h3 id="tt"></h3><span class="tag"><span class="dot" id="dt"></span><span id="on">—</span></span>${langBtn()}</div><main class="ap" id="pg"></main></div></div>`;
  } else {
    root.innerHTML = `<div id="pg">${NOT_FOUND()}</div>`;
  }
  mountNav();
}

/* ---------- router ---------- */
function cleanup() {
  WT.forEach((f) => f && f()); WT = [];
  if (BN) { BN(); BN = null; }
  if (IO) { IO.disconnect(); IO = null; }
  clearPairPolling(); INT.forEach(clearInterval); INT = [];
}
const every = (f, ms) => { const i = setInterval(f, ms); INT.push(i); return i; };
let INT = [];
function route() {
  let h = location.hash.replace(/^#\/?/, '').replace(/\/+$/, '') || 'home';
  if (LEGACY[h]) { location.replace('#/' + LEGACY[h]); return; }
  const app = h.startsWith('app/'), k = app ? h.slice(4) : h;
  const view = app ? (APP.includes(k) ? A[k] : null) : (LAND.includes(k) ? P[k] : null);
  cleanup();
  const m = !view ? 'nf' : app ? 'app' : 'land';
  if (mode !== m) shell(m);
  document.title = (view ? (app ? x(...APP_NAV.find((p) => p[0] === k).slice(1, 3)) : x(...(NAV.find((p) => p[0] === k) || ['', k === 'privacy' ? 'Privacy' : 'Terms', k === 'privacy' ? 'الخصوصية' : 'الشروط']).slice(1, 3))) + ' — Tanjiro' : x('Page not found', 'الصفحة غير موجودة') + ' — Tanjiro');
  if (!view) { $('#pg').innerHTML = NOT_FOUND(); scrollTo(0, 0); return; }
  $('#pg').innerHTML = view();
  if (app) {
    $$('[data-p]').forEach((a) => a.classList.toggle('on', a.dataset.p === k));
    const f = APP_NAV.find((p) => p[0] === k);
    $('#tt').textContent = f ? x(f[1], f[2]) : '';
    $('#sd')?.classList.remove('o'); $('#sc')?.classList.remove('o');
  }
  setActive();
  scrollTo(0, 0);
  post(k, app);
}

/* ---------- after-render hooks ---------- */
function post(k, app) {
  document.body.classList.toggle('nomo', !MO);
  setS(); status();
  if ($('#my') && MY) J('/api/status?number=' + MY).then((d) => { const e = $('#my'); if (e) e.innerHTML = `<span class="dot ${d?.connected === true ? '' : 'off'}"></span>${d ? (PairingState.isConnected(d) ? x('Linked and online', 'مربوط ويعمل') : x('Not linked', 'غير مربوط')) : x('Server unreachable', 'السيرفر غير متاح') }`; });
  const tg = $('.band'); if (tg && window.mountTiltedGrid) WT.push(mountTiltedGrid(tg, { images: ['a1', 'a5', 'a2', 'a3', 'a6', 'a4', 'a8'].map((n) => `/media/ascii/${n}.jpg`), speed: MO ? 5 : 100000, curve: 78, tileHeight: 64 }));
  const kh = $('#kh'); if (kh && window.mountHeroHands) WT.push(mountHeroHands(kh, { sheet: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261030_025250_100df7b8-31fd-4614-aa4a-c1b7d5b6b273.png&w=1600&q=85', animate: MO, avoid: () => $$('.kh-copy h1, .kh-copy p, .kh-cta, .kh-chips', kh) }));
  // reveal on scroll
  const rv = $$('.rv');
  if (!MO || !('IntersectionObserver' in window)) rv.forEach((e) => e.classList.add('in'));
  else { IO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); IO.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: 0.05 }); rv.forEach((e) => IO.observe(e)); }
  // accordions (one open at a time)
  $$('.acc').forEach((acc) => acc.addEventListener('click', (e) => {
    const b = e.target.closest('.acc-i>button'); if (!b) return;
    const item = b.parentElement, open = item.classList.contains('o');
    $$('.acc-i.o', acc).forEach((i) => { i.classList.remove('o'); $('button', i).setAttribute('aria-expanded', 'false'); });
    if (!open) { item.classList.add('o'); b.setAttribute('aria-expanded', 'true'); }
  }));
  if (k === 'faq') faqInit();
  if (k === 'install') installInit();
  vgInit();
  if (MO && matchMedia('(hover:hover)').matches) $$('.btn').forEach((b) => { b.addEventListener('mousemove', (e) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${((e.clientX - r.left) / r.width - .5) * 8}px,${((e.clientY - r.top) / r.height - .5) * 6}px)`; }); b.addEventListener('mouseleave', () => { b.style.transform = ''; }); });
}
function faqInit() {
  const inp = $('#fq'), box = $('#acc'), none = $('#none'), cats = $$('.cat'), all = qaItems();
  let cat = '';
  const draw = () => {
    const q = inp.value.trim().toLowerCase();
    const list = all.filter((it) => (!cat || it[0] === cat) && (!q || (it[1] + ' ' + it[2]).toLowerCase().includes(q)));
    box.innerHTML = list.length ? accordion(list) : '';
    none.hidden = list.length > 0;
    const first = $('.acc-i', box); if (first && (q || cat)) { first.classList.add('o'); $('button', first).setAttribute('aria-expanded', 'true'); }
  };
  inp.addEventListener('input', draw);
  cats.forEach((c) => c.addEventListener('click', () => { cat = cat === c.dataset.c ? '' : c.dataset.c; cats.forEach((o) => { const on = o.dataset.c === cat; o.classList.toggle('on', on); o.setAttribute('aria-pressed', on); }); draw(); }));
  box.addEventListener('click', (e) => {
    const b = e.target.closest('.acc-i>button'); if (!b) return;
    const item = b.parentElement, open = item.classList.contains('o');
    $$('.acc-i.o', box).forEach((i) => { i.classList.remove('o'); $('button', i).setAttribute('aria-expanded', 'false'); });
    if (!open) { item.classList.add('o'); b.setAttribute('aria-expanded', 'true'); }
  });
  const first = $('.acc-i', box); if (first) { first.classList.add('o'); $('button', first).setAttribute('aria-expanded', 'true'); }
}

/* ---------- live data ---------- */
function setS() {
  $$('[data-s]').forEach((e) => {
    const v = S.st?.[e.dataset.s];
    if (v == null) { e.textContent = '—'; return; }
    if (e.dataset.s === 'uptime') { e.textContent = fmtUp(v); return; }
    const from = +e.dataset.v || 0; e.dataset.v = v;
    if (!MO || !window.gsap || from === v) { e.textContent = Math.round(v).toLocaleString('en-US') + (e.dataset.suf || ''); return; }
    const o = { n: from };
    gsap.to(o, { n: v, duration: 1.1, ease: 'power2.out', onUpdate: () => { e.textContent = Math.round(o.n).toLocaleString('en-US') + (e.dataset.suf || ''); } });
  });
  const ok = !!S.st;
  const txt = ok ? S.st.online + ' ' + x('online', 'متصل') + ' · ' + S.st.ms + ' ms' : x('offline', 'غير متصل');
  $$('#on,[data-online-text]').forEach((e) => { e.textContent = txt; });
  $('#dt')?.classList.toggle('off', !ok); $$('[data-dot]').forEach((e) => e.classList.toggle('off', !ok));
  $('#bz') && ($('#bz').innerHTML = bars(S.st?.days));
  $$('#rc').forEach((e) => { e.innerHTML = rec(); });
}
function status() {
  const e = $('#stc'); if (!e) return;
  const ok = !!S.st, t = S.at ? new Date(S.at).toLocaleTimeString(L === 'ar' ? 'ar' : 'en', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
  e.innerHTML = `<div><h2>${ok ? x('All systems operational', 'كل الأنظمة تعمل') : x('Bot server unreachable', 'سيرفر البوت غير متاح')}</h2><small>${x('Last checked', 'آخر فحص')} ${t ? `<span class="ltr">${esc(t)}</span>` : '—'}</small></div><span class="tag"><span class="dot ${ok ? '' : 'off'}"></span>${ok ? x('Operational', 'يعمل') : x('Offline', 'متوقف')}</span>`;
}
async function load() {
  const t0 = performance.now();
  const d = await J('/api/stats');
  S.st = d && d.ok ? d : null; S.at = Date.now();
  if (S.st) S.st.ms = Math.max(1, Math.round(performance.now() - t0));
  if (S.st && S.st.registered) S.st.rate = Math.round(S.st.total / S.st.registered * 100);
  setS(); status();
  try { window.dispatchEvent(new CustomEvent('tb:stats', { detail: S.st })); } catch {}
}

/* ---------- pairing (success only when status says connected:true) ---------- */
let pairTimer = null, pairAttempt = 0, EXP = 0, TTL = 120;
const BOX = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function clearPairPolling() { pairAttempt++; if (pairTimer) { clearInterval(pairTimer); pairTimer = null; } }
function setStage(n) { $$('#stp li').forEach((li, i) => li.classList.toggle('on', i < n)); }
const cdLeft = () => Math.max(0, Math.ceil((CD - Date.now()) / 1000));
function cdTick() {
  const b = $('#go'); if (!b) return;
  const l = cdLeft(), t = $('#gol');
  b.disabled = PAIRING || l > 0;
  if (t) t.textContent = PAIRING ? x('Generating pairing code...', 'جارٍ توليد كود الربط...') : l > 0 ? x('Wait ' + l + 's', 'انتظر ' + l + ' ث') : x('Get pairing code', 'احصل على كود الربط');
}
function ccDraw() {
  const q = ($('#ccs').value || '').trim().toLowerCase().replace(/^\+/, '');
  const l = ccList().filter((c) => !q || c.en.toLowerCase().includes(q) || c.ar.includes(q) || c.dial.startsWith(q) || c.iso.toLowerCase() === q);
  $('#ccl').innerHTML = l.map((c) => `<li role="option" data-i="${c.iso}" aria-selected="${c.iso === CC.iso}"><span>${c.flag}</span><span>${esc(L === 'ar' ? c.ar : c.en)}<small>${esc(L === 'ar' ? c.en : c.ar)}</small></span><span class="ltr">+${c.dial}</span></li>`).join('') || `<li>${x('No match', 'لا توجد نتيجة')}</li>`;
}
function ccSet(iso) { CC = COUNTRIES.find((c) => c.iso === iso) || CC; store.set('cc', CC.iso); $('#ccf').textContent = CC.flag; $('#ccd').textContent = '+' + CC.dial; ccClose(); }
function ccClose() { const p = $('#ccp'); if (p) p.hidden = true; $('#ccb')?.setAttribute('aria-expanded', 'false'); }
function installInit() {
  PAIRING = false;
  cdTick(); every(cdTick, 500);
  $('#go').onclick = pair;
  $('#num').addEventListener('keydown', (e) => { if (e.key === 'Enter') pair(); });
  $('#num').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, '').replace(/^0+/, ''); });
  $('#ccb').addEventListener('click', () => { const p = $('#ccp'), open = p.hidden; p.hidden = !open; $('#ccb').setAttribute('aria-expanded', open); if (open) { $('#ccs').value = ''; ccDraw(); $('#ccs').focus(); $('#ccl [aria-selected=true]')?.scrollIntoView({ block: 'center' }); } });
  $('#ccs').addEventListener('input', ccDraw);
  $('#ccs').addEventListener('keydown', (e) => { if (e.key === 'Escape') { ccClose(); $('#ccb').focus(); } if (e.key === 'Enter') { const f = $('#ccl li[data-i]'); if (f) ccSet(f.dataset.i); } });
  $('#ccl').addEventListener('click', (e) => { const li = e.target.closest('li[data-i]'); if (li) ccSet(li.dataset.i); });
  document.addEventListener('click', ccOutside);
}
function ccOutside(e) { if (!$('#cc')) { document.removeEventListener('click', ccOutside); return; } if (!e.target.closest('#cc')) ccClose(); }
function confirmPair() {
  const rs = $('#rs'); if (!rs) return;
  clearPairPolling(); setStage(3); $('#fm').hidden = true; rs.hidden = false;
  rs.innerHTML = `<div class="pair-success" role="status" aria-live="polite">${ic('check')}<h3>${x('Linked successfully', 'تم الربط بنجاح')}</h3><p>${x('Your bot is connected and ready.', 'بوتك متصل وجاهز للاستخدام.')}</p><a class="btn" href="#/app/bots" style="margin-top:22px">${x('View my bots', 'عرض بوتاتي')}${ic('arrow', 'go')}</a></div>`;
  load();
}
function roll() {
  $$('#bx .bx b').forEach((b, i) => {
    const fin = b.dataset.c;
    if (!MO) { b.innerHTML = `<u>${esc(fin)}</u>`; return; }
    const n = 6 + (i % 3), rnd = Array.from({ length: n }, () => BOX[Math.floor(Math.random() * BOX.length)]);
    b.innerHTML = [...rnd, fin].map((c) => `<u>${esc(c)}</u>`).join('');
    b.style.transition = 'none'; b.style.transform = 'translateY(0)'; void b.offsetHeight;
    b.style.transition = `transform ${0.9 + i * 0.09}s cubic-bezier(.2,.8,.2,1)`; b.style.transform = `translateY(-${(n / (n + 1)) * 100}%)`;
  });
}
function showResult(d) {
  const rs = $('#rs'); $('#fm').hidden = true; rs.hidden = false; setStage(2);
  TTL = +d.expiresIn > 0 ? +d.expiresIn : 120; EXP = Date.now() + TTL * 1000;
  const chars = String(d.code || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 12);
  const body = `<p class="hint" style="text-align:center">${x('Your pairing code', 'كود الربط الخاص بك')}</p><div class="boxes" id="bx" aria-label="${esc(chars)}">${[...chars].map((c, i) => `<span class="bx ${chars.length === 8 && i === 4 ? 'gap' : ''}"><b data-c="${c}"></b></span>`).join('')}</div><div class="rowc"><button class="btn o sm" id="cp" type="button" data-mag>${ic('copy')}${x('Copy code', 'انسخ الكود')}</button>`;
  rs.innerHTML = body + `<span class="timer"><svg class="ring" viewBox="0 0 48 48" aria-hidden="true"><circle class="rb" cx="24" cy="24" r="22"/><circle class="rf" id="rf" cx="24" cy="24" r="22" pathLength="100"/></svg><b id="tm">--:--</b></span></div>
    <p class="copy-feedback" id="cpm" role="status" aria-live="polite"></p>
    <p class="tag" id="wt" style="margin-top:8px"><span class="dot"></span>${x('Waiting for link', 'بانتظار الربط')}</p>
    <ol class="step-n"><li><b>01</b><span>${x('Open WhatsApp, then Linked devices.', 'افتح واتساب ثم الأجهزة المرتبطة.')}</span></li><li><b>02</b><span>${x('Choose Link with phone number instead, and type the code.', 'اختر الربط برقم الهاتف بدلاً من ذلك واكتب الكود.')}</span></li></ol>
    <button class="btn o sm" id="again" type="button" style="margin-top:18px">${x('Start over', 'ابدأ من جديد')}</button>`;
  $('#again').onclick = () => { clearPairPolling(); $('#rs').hidden = true; $('#fm').hidden = false; setStage(1); cdTick(); };
  roll();
  $('#cp').onclick = async () => {
    const m = $('#cpm');
    try { if (!navigator.clipboard?.writeText) throw new Error('x'); await navigator.clipboard.writeText(chars); m.textContent = x('Code copied. Paste it in WhatsApp.', 'تم نسخ الكود. الصقه في واتساب.'); }
    catch { m.textContent = x('Clipboard unavailable. Copy the code manually.', 'الحافظة غير متاحة. انسخ الكود يدوياً.'); }
  };
  const tick = () => {
    const left = Math.max(0, EXP - Date.now()), f = $('#rf'), t = $('#tm');
    if (!f) return;
    f.style.strokeDashoffset = String(100 * (1 - left / (TTL * 1000)));
    const s = Math.ceil(left / 1000); t.textContent = left > 0 ? Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') : x('Expired', 'انتهى');
    if (left <= 0) { clearPairPolling(); $('#wt')?.remove(); const cp = $('#cp'); if (cp) cp.disabled = true; }
  };
  tick(); every(tick, 250);
}
async function requestPair(n) {
  let res = await JR('/api/pair', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ number: n }) });
  if (!res.data || (res.status >= 502 && res.status <= 504)) {
    await new Promise((r) => setTimeout(r, 1200));
    res = await JR('/api/pair', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ number: n }) });
  }
  return res.data;
}
async function pair() {
  const er = $('#er'); er.textContent = '';
  if (PAIRING || cdLeft() > 0) return;
  const local = ($('#num').value || '').replace(/\D/g, '').replace(/^0+/, '');
  const n = digits(CC.dial + local);
  if (!local || !/^\d{8,15}$/.test(n)) { er.textContent = x('Enter a valid number.', 'أدخل رقماً صحيحاً.'); return; }
  clearPairPolling();
  const attempt = pairAttempt, b = $('#go');
  PAIRING = true; cdTick();
  const d = await requestPair(n);
  PAIRING = false;
  if (attempt !== pairAttempt || !b.isConnected) return;
  if (!d || !d.ok) { CD = 0; cdTick(); er.textContent = d?.error || x('Could not reach the bot server. Please try again.', 'تعذر الاتصال بسيرفر البوت. حاول مرة أخرى.'); return; }
  MY = n; store.set('my', n);
  if (PairingState.isConnected(d)) { CD = 0; cdTick(); confirmPair(); return; }
  if (!d.code) { CD = 0; cdTick(); er.textContent = x('No code was returned. Try again.', 'لم يتم إرجاع كود. حاول مجدداً.'); return; }
  CD = Date.now() + 8000; cdTick();
  showResult(d);
  let checking = false;
  pairTimer = setInterval(async () => {
    if (checking) return;
    if (!$('#wt')) { clearPairPolling(); return; }
    checking = true;
    const s = await J('/api/status?number=' + n);
    checking = false;
    if (attempt !== pairAttempt) return;
    if (PairingState.isConnected(s)) { clearPairPolling(); confirmPair(); }
  }, 3000);
}
function vgInit() {
  const g = $('#vg'); if (!g) return;
  const tabs = $$('[data-g]', g), scr = $$('.vg-s', g), cap = $('#vgc'); let cur = 0, auto = true;
  const go = (i) => { cur = i; tabs.forEach((t, k) => t.classList.toggle('on', k === i)); scr.forEach((s2, k) => s2.classList.toggle('on', k === i)); cap.textContent = tabs[i].textContent.replace(/^\[0\d\]/, ''); };
  tabs.forEach((t, i) => t.addEventListener('click', () => { auto = false; go(i); }));
  if (MO) every(() => { if (auto && g.isConnected) go((cur + 1) % tabs.length); }, 3200);
}

/* ---------- actions ---------- */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  const a = el.dataset.a;
  if (a === 'lg' || a === 'setlang') {
    const next = a === 'lg' ? (L === 'ar' ? 'en' : 'ar') : el.dataset.v;
    if (next === L) return;
    L = next; store.set('l', L); applyLang(); mode = ''; route();
  }
  if (a === 'sd') { $('#sd')?.classList.toggle('o'); $('#sc')?.classList.toggle('o'); }
  if (a === 'mo') { MO = !MO; store.set('m', MO ? '1' : '0'); mode = ''; route(); }
  if (a === 'fg') { MY = ''; store.del('my'); route(); }
  if (a === 'links') { $('#sd')?.classList.remove('o'); $('#sc')?.classList.remove('o'); window.openCommunity?.(); }
});
function applyLang() {
  document.documentElement.lang = L;
  document.documentElement.dir = L === 'ar' ? 'rtl' : 'ltr';
}
// rebuild the mobile menu when crossing the breakpoint
matchMedia('(max-width:899px)').addEventListener('change', () => { if (mode === 'land') mountNav(); });

/* ---------- boot ---------- */
applyLang();
addEventListener('hashchange', route);
route();
load(); setInterval(load, 12000);
const hide = () => { const ld = $('#ld'); if (!ld) return; ld.classList.add('off'); setTimeout(() => ld.remove(), 700); };
Promise.race([document.fonts?.ready || Promise.resolve(), new Promise((r) => setTimeout(r, 1500))]).then(() => setTimeout(hide, 700));
// anonymous visitor id for the live counter
const rid = () => { const a = new Uint8Array(12); crypto.getRandomValues(a); return [...a].map((b) => b.toString(36).padStart(2, '0')).join('').slice(0, 24); };
let VID = store.get('vid'); if (!/^[a-z0-9]{8,64}$/i.test(VID)) { VID = rid(); store.set('vid', VID); }
const ping = () => J('/api/ping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: VID }) });
ping(); setInterval(ping, 25000);
})();
