/* Standalone "My links" dialog. Kept in its own asset so navigation rebuilds never remove it.
   Open it from anywhere with window.openCommunity(). */
(function () {
  const ar = () => document.documentElement.lang === 'ar';
  const text = (en, a) => (ar() ? a : en);
  const links = [
    ['WhatsApp channel', 'قناة الواتساب', 'https://whatsapp.com/channel/0029VbEBX75LSmbRtZ6jbo1U', 'whatsapp.com'],
    ['Support group', 'جروب الدعم', 'https://chat.whatsapp.com/HOYLDFxCie67MlfyQTUOHK?s=cl&p=a&iam=2', 'WhatsApp'],
    ['Support group 2', 'جروب الدعم 2', 'https://chat.whatsapp.com/KcLzu10RzTnFnhH62ubGrV?s=cl&p=a&iam=2', 'WhatsApp'],
    ['API platform', 'منصة API', 'https://johan-vex-apis.vercel.app', 'johan-vex-apis.vercel.app'],
    ['My portfolio', 'موقعي الشخصي', 'https://zzzzz-five.vercel.app', 'zzzzz-five.vercel.app'],
    ['Telegram channel', 'قناة التليجرام', 'https://t.me/TanjiroBotSup', '@TanjiroBotSup'],
    ['Contact on Telegram', 'تواصل تليجرام', 'https://t.me/Mahmoud_devv', '@Mahmoud_devv'],
  ];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safe = (u) => { try { return new URL(u).protocol === 'https:' ? u : '#'; } catch { return '#'; } };
  const icon = (p) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${p}"/></svg>`;
  const dialog = document.createElement('dialog');
  dialog.className = 'community-dialog';
  dialog.setAttribute('aria-labelledby', 'community-title');
  function render() {
    dialog.innerHTML = `<header class="community-head"><img src="/media/tanjiro-logo.png" alt="" width="34" height="34"><h2 id="community-title">${text('My links', 'روابطي')}</h2><button class="ib" type="button" aria-label="${text('Close', 'إغلاق')}">${icon('M6 6l12 12M18 6 6 18')}</button></header>
      <div class="community-links">${links.map(([en, a, url, detail]) => `<a class="community-link" href="${esc(safe(url))}" target="_blank" rel="noopener noreferrer"><span><strong>${esc(text(en, a))}</strong><small dir="ltr">${esc(detail)}</small></span>${icon('M7 17 17 7M7 7h10v10')}</a>`).join('')}</div>`;
    dialog.querySelector('button').onclick = () => dialog.close();
  }
  dialog.addEventListener('click', (e) => {
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
  });
  document.body.append(dialog);
  window.openCommunity = () => { render(); if (!dialog.open) dialog.showModal(); };
})();
