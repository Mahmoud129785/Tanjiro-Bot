/* Vanilla port of MagicBento.jsx (ParticleCard + GlobalSpotlight). Constants and easings are copied from the original. */
(function(){
const mk=(x,y,c)=>{const e=document.createElement('div');e.className='particle';e.style.cssText=`position:absolute;width:4px;height:4px;border-radius:50%;background:rgba(${c},1);box-shadow:0 0 6px rgba(${c},.6);pointer-events:none;z-index:100;left:${x}px;top:${y}px`;return e};
window.initBento=function(grid,o={}){
const count=o.count||12,radius=o.radius||300,color=getComputedStyle(document.documentElement).getPropertyValue('--glow-rgb').trim()||'31,94,255',off=innerWidth<=768||matchMedia('(prefers-reduced-motion:reduce)').matches;
const cards=[...grid.querySelectorAll('.magic-bento-card')],cl=[];
const glow=(c,mx,my,g)=>{const r=c.getBoundingClientRect();c.style.setProperty('--glow-x',(mx-r.left)/r.width*100+'%');c.style.setProperty('--glow-y',(my-r.top)/r.height*100+'%');c.style.setProperty('--glow-intensity',g);c.style.setProperty('--glow-radius',radius+'px')};
if(!off)cards.forEach(el=>{let hov=false,ps=[],ts=[];
const spawn=()=>{const b=el.getBoundingClientRect();for(let i=0;i<count;i++)ts.push(setTimeout(()=>{if(!hov)return;const p=mk(Math.random()*b.width,Math.random()*b.height,color);el.appendChild(p);ps.push(p);gsap.fromTo(p,{scale:0,opacity:0},{scale:1,opacity:1,duration:.3,ease:'back.out(1.7)'});gsap.to(p,{x:(Math.random()-.5)*100,y:(Math.random()-.5)*100,rotation:Math.random()*360,duration:2+Math.random()*2,ease:'none',repeat:-1,yoyo:true});gsap.to(p,{opacity:.3,duration:1.5,ease:'power2.inOut',repeat:-1,yoyo:true})},i*100))};
const clear=()=>{ts.forEach(clearTimeout);ts=[];ps.forEach(p=>gsap.to(p,{scale:0,opacity:0,duration:.3,ease:'back.in(1.7)',onComplete:()=>p.remove()}));ps=[]};
const enter=()=>{hov=true;spawn();gsap.to(el,{rotateX:5,rotateY:5,duration:.3,ease:'power2.out',transformPerspective:1000})};
const leave=()=>{hov=false;clear();gsap.to(el,{rotateX:0,rotateY:0,x:0,y:0,duration:.3,ease:'power2.out'})};
const move=e=>{const r=el.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,cx=r.width/2,cy=r.height/2;gsap.to(el,{rotateX:(y-cy)/cy*-10,rotateY:(x-cx)/cx*10,x:(x-cx)*.05,y:(y-cy)*.05,duration:.1,ease:'power2.out',transformPerspective:1000})};
const click=e=>{const r=el.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,m=Math.max(Math.hypot(x,y),Math.hypot(x-r.width,y),Math.hypot(x,y-r.height),Math.hypot(x-r.width,y-r.height)),d=document.createElement('div');d.style.cssText=`position:absolute;width:${m*2}px;height:${m*2}px;border-radius:50%;background:radial-gradient(circle,rgba(${color},.4) 0%,rgba(${color},.2) 30%,transparent 70%);left:${x-m}px;top:${y-m}px;pointer-events:none;z-index:1000`;el.appendChild(d);gsap.fromTo(d,{scale:0,opacity:1},{scale:1,opacity:0,duration:.8,ease:'power2.out',onComplete:()=>d.remove()})};
el.addEventListener('mouseenter',enter);el.addEventListener('mouseleave',leave);el.addEventListener('mousemove',move);el.addEventListener('click',click);
cl.push(()=>{el.removeEventListener('mouseenter',enter);el.removeEventListener('mouseleave',leave);el.removeEventListener('mousemove',move);el.removeEventListener('click',click);clear()})});
let sp=null,mv=null,lv=null;
if(!off){sp=document.createElement('div');sp.style.cssText=`position:fixed;width:800px;height:800px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,rgba(${color},.15) 0%,rgba(${color},.08) 15%,rgba(${color},.04) 25%,rgba(${color},.02) 40%,rgba(${color},.01) 65%,transparent 70%);z-index:200;opacity:0;transform:translate(-50%,-50%)`;document.body.appendChild(sp);
const prox=radius*.5,fade=radius*.75,sec=grid.closest('.bento-section');
mv=e=>{const r=sec.getBoundingClientRect(),inside=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
if(!inside){gsap.to(sp,{opacity:0,duration:.3,ease:'power2.out'});cards.forEach(c=>c.style.setProperty('--glow-intensity','0'));return}
let min=Infinity;cards.forEach(c=>{const b=c.getBoundingClientRect(),d=Math.max(0,Math.hypot(e.clientX-(b.left+b.width/2),e.clientY-(b.top+b.height/2))-Math.max(b.width,b.height)/2);min=Math.min(min,d);glow(c,e.clientX,e.clientY,d<=prox?1:d<=fade?(fade-d)/(fade-prox):0)});
gsap.to(sp,{left:e.clientX,top:e.clientY,duration:.1,ease:'power2.out'});const t=min<=prox?.8:min<=fade?(fade-min)/(fade-prox)*.8:0;gsap.to(sp,{opacity:t,duration:t>0?.2:.5,ease:'power2.out'})};
lv=()=>{cards.forEach(c=>c.style.setProperty('--glow-intensity','0'));gsap.to(sp,{opacity:0,duration:.3,ease:'power2.out'})};
document.addEventListener('mousemove',mv);document.addEventListener('mouseleave',lv)}
return()=>{cl.forEach(f=>f());if(mv)document.removeEventListener('mousemove',mv);if(lv)document.removeEventListener('mouseleave',lv);sp&&sp.remove()}};
})();
