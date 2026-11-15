/* Vanilla port of PillNav.jsx (desktop pill list): layout maths, timelines, durations and ease are the original's. */
(function(){
window.mountPillNav=function(host,o){
const ease='power3.easeOut',v=o.vars;
host.innerHTML=`<div class="pill-nav-container"><nav class="pill-nav" aria-label="Primary" style="--base:${v.base};--pill-bg:${v.pill};--hover-text:${v.hover};--pill-text:${v.text}"><a class="pill-logo" href="${o.items[0].href}" aria-label="Home">${o.logo}</a><div class="pill-nav-items desktop-only"><ul class="pill-list" role="menubar">${o.items.map(it=>`<li role="none"><a role="menuitem" href="${it.href}" class="pill" data-h="${it.href}"><span class="hover-circle" aria-hidden="true"></span><span class="label-stack"><span class="pill-label">${it.label}</span><span class="pill-label-hover" aria-hidden="true">${it.label}</span></span></a></li>`).join('')}</ul></div></nav></div>`;
const circles=[...host.querySelectorAll('.hover-circle')],tls=[],act=[],navItems=host.querySelector('.pill-nav-items'),logo=host.querySelector('.pill-logo');
const layout=()=>circles.forEach((c,index)=>{const pill=c.parentElement,{width:w,height:h}=pill.getBoundingClientRect();if(!w||!h)return;
const R=((w*w)/4+h*h)/(2*h),D=Math.ceil(2*R)+2,delta=Math.ceil(R-Math.sqrt(Math.max(0,R*R-(w*w)/4)))+1,originY=D-delta;
c.style.width=D+'px';c.style.height=D+'px';c.style.bottom='-'+delta+'px';gsap.set(c,{xPercent:-50,scale:0,transformOrigin:`50% ${originY}px`});
const label=pill.querySelector('.pill-label'),white=pill.querySelector('.pill-label-hover');label&&gsap.set(label,{y:0});white&&gsap.set(white,{y:h+12,opacity:0});
tls[index]&&tls[index].kill();const tl=gsap.timeline({paused:true});tl.to(c,{scale:1.2,xPercent:-50,duration:2,ease,overwrite:'auto'},0);
label&&tl.to(label,{y:-(h+8),duration:2,ease,overwrite:'auto'},0);if(white){gsap.set(white,{y:Math.ceil(h+100),opacity:0});tl.to(white,{y:0,opacity:1,duration:2,ease,overwrite:'auto'},0)}tls[index]=tl});
layout();addEventListener('resize',layout);document.fonts&&document.fonts.ready&&document.fonts.ready.then(layout).catch(()=>{});
gsap.set(logo,{scale:0});gsap.to(logo,{scale:1,duration:.6,ease});gsap.set(navItems,{width:0,overflow:'hidden'});gsap.to(navItems,{width:'auto',duration:.6,ease,onComplete:layout});
host.querySelectorAll('.pill').forEach((p,i)=>{p.onmouseenter=()=>{act[i]&&act[i].kill();act[i]=tls[i].tweenTo(tls[i].duration(),{duration:.3,ease,overwrite:'auto'})};p.onmouseleave=()=>{act[i]&&act[i].kill();act[i]=tls[i].tweenTo(0,{duration:.2,ease,overwrite:'auto'})}});
const lg=logo.firstElementChild;logo.onmouseenter=()=>{gsap.set(lg,{rotate:0});gsap.to(lg,{rotate:360,duration:.2,ease,overwrite:'auto'})};
return{setActive:h=>host.querySelectorAll('.pill').forEach(p=>p.classList.toggle('is-active',p.dataset.h===h)),dispose:()=>removeEventListener('resize',layout)}};
})();
