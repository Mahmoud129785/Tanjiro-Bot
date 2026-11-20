/* Vanilla port of StaggeredMenu.jsx: markup, class names, timelines, durations and easings are the original's. */
(function(){
window.mountStaggeredMenu=function(o){
const S=document.documentElement.dir==='rtl'?-1:1;const w=document.createElement('div');w.className='staggered-menu-wrapper fixed-wrapper';w.dataset.position=document.documentElement.dir==='rtl'?'left':'right';w.style.setProperty('--sm-accent',o.accent);
const arr=o.colors.slice(0,4);if(arr.length>=3)arr.splice(Math.floor(arr.length/2),1);
w.innerHTML=`<div class="sm-prelayers">${arr.map(c=>`<div class="sm-prelayer" style="background:${c}"></div>`).join('')}</div><header class="staggered-menu-header"><div class="sm-logo">${o.logo}</div><div class="sm-hr">${o.extra}<button class="sm-toggle" type="button" aria-expanded="false"><span class="sm-toggle-textWrap"><span class="sm-toggle-textInner"><span class="sm-toggle-line">${o.menu}</span><span class="sm-toggle-line">${o.close}</span></span></span><span class="sm-icon"><span class="sm-icon-line"></span><span class="sm-icon-line sm-icon-line-v"></span></span></button></div></header><aside class="staggered-menu-panel"><div class="sm-panel-inner"><ul class="sm-panel-list" data-numbering="true">${o.items.map((it,i)=>`<li class="sm-panel-itemWrap"><a class="sm-panel-item" href="${it.link}" data-index="${i+1}"><span class="sm-panel-itemLabel">${it.label}</span></a></li>`).join('')}</ul>${o.foot?`<div class="sm-foot">${o.foot}</div>`:''}</div></aside>`;
document.body.appendChild(w);
const q=s=>w.querySelector(s),panel=q('.staggered-menu-panel'),layers=[...w.querySelectorAll('.sm-prelayer')],btn=q('.sm-toggle'),icon=q('.sm-icon'),inner=q('.sm-toggle-textInner'),pH=q('.sm-icon-line'),pV=q('.sm-icon-line-v');
const items=[...panel.querySelectorAll('.sm-panel-itemLabel')],nums=[...panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item')];
let open=false,busy=false,tl=null,closeT=null,spin=null,txt=null;
gsap.set([panel,...layers],{xPercent:S*100,opacity:1});gsap.set(pH,{transformOrigin:'50% 50%',rotate:0});gsap.set(pV,{transformOrigin:'50% 50%',rotate:90});gsap.set(icon,{rotate:0,transformOrigin:'50% 50%'});gsap.set(inner,{yPercent:0});
const playOpen=()=>{if(busy)return;busy=true;tl&&tl.kill();closeT&&closeT.kill();gsap.set(items,{yPercent:140,rotate:10});gsap.set(nums,{'--sm-num-opacity':0});
tl=gsap.timeline({paused:true});layers.forEach((el,i)=>tl.fromTo(el,{xPercent:S*100},{xPercent:0,duration:.5,ease:'power4.out'},i*.07));
const pt=(layers.length-1)*.07+.08;tl.fromTo(panel,{xPercent:S*100},{xPercent:0,duration:.65,ease:'power4.out'},pt);
const is=pt+.65*.15;tl.to(items,{yPercent:0,rotate:0,duration:1,ease:'power4.out',stagger:{each:.1,from:'start'}},is);tl.to(nums,{duration:.6,ease:'power2.out','--sm-num-opacity':1,stagger:{each:.08,from:'start'}},is+.1);
tl.eventCallback('onComplete',()=>{busy=false});tl.play(0)};
const playClose=()=>{tl&&tl.kill();tl=null;closeT&&closeT.kill();closeT=gsap.to([...layers,panel],{xPercent:S*100,duration:.32,ease:'power3.in',overwrite:'auto',onComplete:()=>{gsap.set(items,{yPercent:140,rotate:10});gsap.set(nums,{'--sm-num-opacity':0});busy=false}})};
const animIcon=op=>{spin&&spin.kill();spin=op?gsap.to(icon,{rotate:225,duration:.8,ease:'power4.out',overwrite:'auto'}):gsap.to(icon,{rotate:0,duration:.35,ease:'power3.inOut',overwrite:'auto'})};
const animText=op=>{txt&&txt.kill();const cur=op?o.menu:o.close,tg=op?o.close:o.menu,seq=[cur];let last=cur;for(let i=0;i<3;i++){last=last===o.menu?o.close:o.menu;seq.push(last)}if(last!==tg)seq.push(tg);seq.push(tg);inner.innerHTML=seq.map(l=>`<span class="sm-toggle-line">${l}</span>`).join('');gsap.set(inner,{yPercent:0});txt=gsap.to(inner,{yPercent:-((seq.length-1)/seq.length)*100,duration:.5+seq.length*.07,ease:'power4.out'})};
const set=t=>{open=t;btn.setAttribute('aria-expanded',t);t?playOpen():playClose();animIcon(t);animText(t)};
btn.onclick=()=>set(!open);
const away=e=>{if(open&&!panel.contains(e.target)&&!btn.contains(e.target))set(false)};document.addEventListener('mousedown',away);
panel.addEventListener('click',e=>{if(e.target.closest('a'))set(false)});
return()=>{document.removeEventListener('mousedown',away);tl&&tl.kill();w.remove()}};
})();
