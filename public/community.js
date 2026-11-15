(function(){
  const ar=()=>document.documentElement.lang==='ar';
  const text=(en,arabic)=>ar()?arabic:en;
  const links=[
    ['WhatsApp channel','قناة الواتساب','https://whatsapp.com/channel/0029VbEBX75LSmbRtZ6jbo1U','whatsapp.com'],
    ['Support group','جروب الدعم','https://chat.whatsapp.com/HOYLDFxCie67MlfyQTUOHK?s=cl&p=a&iam=2','WhatsApp'],
    ['Support group 2','جروب الدعم 2','https://chat.whatsapp.com/KcLzu10RzTnFnhH62ubGrV?s=cl&p=a&iam=2','WhatsApp'],
    ['API platform','منصة API','https://johan-vex-apis.vercel.app','johan-vex-apis.vercel.app'],
    ['My portfolio','موقعي الشخصي','https://zzzzz-five.vercel.app','zzzzz-five.vercel.app'],
    ['Telegram channel','قناة التليجرام','https://t.me/TanjiroBotSup','@TanjiroBotSup'],
    ['Contact on Telegram','تواصل تليجرام','https://t.me/Mahmoud_devv','@Mahmoud_devv']
  ];
  const icon=(path)=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
  const arrow=icon('M7 17 17 7M7 7h10v10');
  const trigger=document.createElement('button');trigger.className='community-trigger';trigger.type='button';trigger.setAttribute('aria-haspopup','dialog');
  const dialog=document.createElement('dialog');dialog.className='community-dialog';dialog.setAttribute('aria-labelledby','community-title');
  function render(){
    trigger.innerHTML=icon('M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7')+text('My links','روابطي');
    dialog.innerHTML=`<header class="community-head"><img class="brand-logo" src="media/tanjiro-logo.png" alt="" width="38" height="38"><h2 id="community-title">${text('My links','روابطي')}</h2><button class="ib" type="button" aria-label="${text('Close','إغلاق')}">${icon('M6 6l12 12M18 6 6 18')}</button></header><div class="community-links">${links.map(([en,a,url,detail])=>`<a class="community-link" href="${url}" target="_blank" rel="noopener noreferrer"><span><strong>${text(en,a)}</strong><small dir="ltr">${detail}</small></span>${arrow}</a>`).join('')}</div><div class="contact-placeholder"><label for="whatsapp-contact">${text('WhatsApp contact','تواصل واتساب')}</label><input id="whatsapp-contact" type="tel" value="+000 000 000 000" readonly><small>${text('Placeholder — number to be added later','رقم وهمي — سيُضاف الرقم لاحقاً')}</small></div>`;
    dialog.querySelector('button').onclick=()=>dialog.close();
  }
  trigger.onclick=()=>{render();dialog.showModal()};
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()}});
  document.body.append(trigger,dialog);render();
  new MutationObserver(()=>{if(!dialog.open)render()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();