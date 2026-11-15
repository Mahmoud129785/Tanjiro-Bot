/* Reusable bilingual visual guide block for the Tanjiro pairing flow. */
(function () {
  window.createGuideSection = function (x, context = 'home') {
    const isApp = context === 'app';
    const isInstall = context === 'install';
    return `
      <section class="guide-section ${isApp || isInstall ? 'guide-section-app' : ''}" aria-labelledby="pairing-guide-title">
        <div class="guide-heading">
          <span class="ey">${x('Quick visual guide', 'شرح مرئي سريع')}</span>
          <h2 id="pairing-guide-title">${x('Copy the code. Link your bot.', 'انسخ الرمز. اربط البوت.')}</h2>
          <p class="lead">${x('Watch the exact flow from requesting a pairing code to entering it in WhatsApp.', 'شاهد الخطوات من طلب رمز الربط حتى إدخاله في واتساب.')}</p>
        </div>
        <div class="guide-layout">
          <div class="guide-player-card">
            <div class="guide-player-top"><span class="guide-live-dot"></span>${x('Tanjiro · pairing walkthrough', 'Tanjiro · دليل ربط البوت')}</div>
            <div class="guide-player">
              <video controls playsinline preload="metadata" poster="/media/tutorial-poster.jpg" aria-label="${x('Video showing how to copy and enter a pairing code in WhatsApp', 'فيديو يوضح نسخ رمز الربط وإدخاله في واتساب')}">
                <source src="/media/copy-and-link-tanjiro.mp4" type="video/mp4">
                ${x('Your browser does not support embedded video.', 'متصفحك لا يدعم تشغيل الفيديو المضمّن.')}
              </video>
            </div>
            <p class="guide-caution">${x('The code shown in the video is only an example. Use the code generated for your number.', 'الرمز الظاهر في الفيديو توضيحي فقط. استخدم الرمز الذي يُنشأ لرقمك.')}</p>
          </div>
          <div class="guide-aside">
            <div class="guide-copy-card">
              <span class="guide-step-chip">${x('3 simple steps', '3 خطوات بسيطة')}</span>
              <h3>${x('From the site to WhatsApp', 'من الموقع إلى واتساب')}</h3>
              <ol class="guide-mini-steps">
                <li><b>01</b><span>${x('Request your pairing code on Tanjiro.', 'اطلب رمز الربط من Tanjiro.')}</span></li>
                <li><b>02</b><span>${x('Tap “Copy code”.', 'اضغط «نسخ الرمز».')}</span></li>
                <li><b>03</b><span>${x('In WhatsApp, open Linked devices and paste the code.', 'في واتساب افتح «الأجهزة المرتبطة» والصق الرمز.')}</span></li>
              </ol>
              ${isInstall ? '' : `<a class="btn mag guide-cta" href="#/app/install">${x('Get a pairing code', 'احصل على رمز الربط')} ${'<span aria-hidden="true">↗</span>'}</a>`}
            </div>
            <div class="guide-art-grid">
              <figure><img src="/media/pairing-flow-art.webp" alt="${x('Illustration of a pairing code moving from a site to a phone', 'رسم توضيحي لانتقال رمز الربط من الموقع إلى الهاتف')}" loading="lazy"><figcaption>${x('Copy from Tanjiro', 'انسخ من Tanjiro')}</figcaption></figure>
              <figure><img src="/media/connected-device-art.webp" alt="${x('Illustration of a phone being securely connected', 'رسم توضيحي لربط الهاتف بأمان')}" loading="lazy"><figcaption>${x('Link in WhatsApp', 'اربط في واتساب')}</figcaption></figure>
            </div>
          </div>
        </div>
      </section>`;
  };
})();
