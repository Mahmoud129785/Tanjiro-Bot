(function(){var l='';try{l=localStorage.getItem('l')||''}catch(e){}
if(l!=='ar'&&l!=='en')l=((navigator.language||'').toLowerCase().indexOf('ar')===0)?'ar':'en';
document.documentElement.lang=l;document.documentElement.dir=l==='ar'?'rtl':'ltr';
document.title=l==='ar'?'404 — الصفحة غير موجودة':'404 — Page not found';})();
