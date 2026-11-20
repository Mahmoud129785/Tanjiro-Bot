(function(){var l='';try{l=localStorage.getItem('l')||''}catch(e){}
if(l!=='ar'&&l!=='en')l=((navigator.language||'').toLowerCase().indexOf('ar')===0)?'ar':'en';
document.documentElement.lang=l;document.documentElement.dir=l==='ar'?'rtl':'ltr';
document.title=l==='ar'?'404 — الصفحة غير موجودة':'404 — Page not found';
/* Animated breathing radial gradient (vanilla port of AnimatedGradientBackground), Tanjiro fire palette. */
var bg=document.getElementById('nf-bg');if(!bg)return;
var colors=['#07060B','#3A0B12','#B3122E','#FF4D1A','#FF9A1F','#FFD23F','#1FB5A8'],stops=[35,50,60,70,80,90,100];
var start=125,range=6,speed=.03,w=start,dir=1;
var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var str=stops.map(function(s,i){return colors[i]+' '+s+'%'}).join(', ');
function paint(){bg.style.background='radial-gradient('+w+'% '+w+'% at 50% 20%, '+str+')'}
function tick(){if(w>=start+range)dir=-1;if(w<=start-range)dir=1;w+=dir*speed;paint();requestAnimationFrame(tick)}
paint();requestAnimationFrame(function(){bg.classList.add('in')});if(!reduce)requestAnimationFrame(tick);})();
