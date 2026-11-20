/* Bilingual visual guide block for the Tanjiro pairing flow (video + three steps). */
(function () {
  window.createGuideSection = function (x, context = 'page') {
    const embed = context === 'install';
    return `
      <section class="guide ${embed ? 'guide-embed' : ''}" aria-labelledby="guide-title">
        <div class="guide-v">
          <div class="guide-vt"><span class="dot"></span>${x('Pairing walkthrough', 'شرح ربط البوت')}</div>
          <div class="guide-p">
            <video controls playsinline preload="metadata" poster="/media/tutorial-poster.jpg" aria-label="${x('Video: copy the pairing code and enter it in WhatsApp', 'فيديو: نسخ رمز الربط وإدخاله في واتساب')}">
              <source src="/media/copy-and-link-tanjiro.mp4" type="video/mp4">
              ${x('Your browser does not support embedded video.', 'متصفحك لا يدعم تشغيل الفيديو المضمّن.')}
            </video>
          </div>
          <p class="guide-c">${x('The code in the video is only an example. Use the code generated for your own number.', 'الرمز الظاهر في الفيديو توضيحي فقط. استخدم الرمز الذي يُنشأ لرقمك.')}</p>
        </div>
        <div>
          <span class="ey">${x('Visual guide', 'شرح مرئي')}</span>
          <h2 id="guide-title">${x('Copy the code. Link your bot.', 'انسخ الرمز. اربط البوت.')}</h2>
          <p class="lead">${x('Watch the exact flow, from requesting a pairing code to entering it in WhatsApp.', 'شاهد الخطوات من طلب رمز الربط حتى إدخاله في واتساب.')}</p>
          <ol class="step-n">
            <li><b>01</b><span>${x('Request your pairing code on Tanjiro.', 'اطلب رمز الربط من Tanjiro.')}</span></li>
            <li><b>02</b><span>${x('Tap “Copy code”.', 'اضغط «نسخ الرمز».')}</span></li>
            <li><b>03</b><span>${x('In WhatsApp, open Linked devices and paste the code.', 'في واتساب افتح «الأجهزة المرتبطة» والصق الرمز.')}</span></li>
          </ol>
          ${embed ? '' : `<a class="btn" href="#/app/install">${x('Get a pairing code', 'احصل على رمز الربط')}<svg class="ic go" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>`}
        </div>
      </section>`;
  };
})();
