/* r03 — hovering the signature throws work cards out of both edges like a dealt deck:
   a normal-speed throw that suddenly drops into slow motion. Scrolling down folds them
   back along the same curves; hover enlarges a card, shoves its neighbours, and tilts it. */
(()=>{'use strict';
const hero=document.querySelector('#home'),ink=hero.querySelector('.signature-window');
const reduce=matchMedia('(prefers-reduced-motion:reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
const live=()=>window.PortfolioMotion.enabled&&!reduce.matches;
const NAMES={silence:'Traces of Silence',current:'In the current',analog:'Draven’s analoge album',diary:'Draven’s diary',wolne:'Wolne Tory',tides:'Layered Tides',eternal:'Eternal Flow',rendering:'Rendering studies',mood:'Mood Board'};
// [file in assets/hero-cards, project id, width/height]
const DECK={
 up:[['pages-1-008','analog',1.5],['pages-7-024','silence',1.5],['model-wolne','wolne',1.6],['pages-3-012','current',1.5],['pages-2-025','diary',.775],['pages-6-035','wolne',1.6],['pages-1-019','analog',1.5],['rendering-Image11','rendering',.5635]],
 down:[['pages-7-008','silence',1.5],['model-tides','tides',1.548],['pages-3-014','current',1.5],['eternal-cover','eternal',1.781],['pages-1-018','analog',1.5],['pages-2-012','diary',1],['pages-7-017','silence',1.5],['pages-4-001','mood',1.232]]};
// Normalised hero coordinates. Cards leave from just outside the edge (o) and land on a
// quadratic arc (p0-p1-p2); sag bends the flight path so it reads as a throw, not a slide.
const ARC={up:{o:[-.1,.6],p:[[.05,.37],[.4,.2],[.74,.18]],sag:.08,spin:-75},
 down:{o:[1.1,.55],p:[[.95,.79],[.66,.91],[.36,.9]],sag:-.08,spin:75}};
const TILT=[-9,6,-4,8,-7,4,-5,7];
const FAST=.3,SLOW=.13,FLIGHT=.42,STAGGER=.032,HOVER_SCALE=1.42;

const layer=document.createElement('div');layer.className='hero-cards';layer.hidden=true;
hero.querySelector('.signature-content').after(layer);
const cards=[];
for(const band of ['up','down'])DECK[band].forEach(([file,project,aspect],i)=>{
 const el=document.createElement('a');el.className='hero-card';el.href='collections/'+project+'.html';el.dataset.open=project;
 el.setAttribute('aria-label',NAMES[project]+(file.startsWith('model')?' — 三维模型':''));
 el.innerHTML='<span class="hero-card-glass"><img alt="" draggable="false" decoding="async"></span>';
 layer.append(el);
 cards.push({el,glass:el.firstChild,img:el.querySelector('img'),src:'assets/hero-cards/'+file+'.webp',band,i,aspect,
  x:0,y:0,w:0,h:0,rot:TILT[i],ox:0,oy:0,vx:0,vy:0,s:1,vs:0,rx:0,ry:0,trx:0,try_:0,k:0,u:0,shown:true});
});
let W=0,H=0,dealtAt=0,dealt=false,hovered=null,frame=0,visible=true;
function loadImages(){cards.forEach(c=>{if(!c.img.src)c.img.src=c.src})}
if(document.readyState==='complete')setTimeout(loadImages,2000);else addEventListener('load',()=>setTimeout(loadImages,2000),{once:true});

const bez=(a,b,c,t)=>(1-t)*(1-t)*a+2*(1-t)*t*b+t*t*c;
function layout(){
 W=hero.clientWidth;H=hero.clientHeight;const narrow=W<700,base=narrow?Math.max(68,Math.min(110,W*.2)):Math.max(96,Math.min(186,W*.105));
 for(const band of ['up','down']){
  const list=cards.filter(c=>c.band===band),n=narrow?5:list.length,a=ARC[band];
  list.forEach((c,k)=>{c.shown=k<n;c.el.hidden=!c.shown;if(!c.shown)return;const t=n>1?k/(n-1):0;
   c.w=c.aspect>=1?base:base*.78;c.h=c.w/c.aspect;c.el.style.width=c.w+'px';c.el.style.height=c.h+'px';
   c.sx=bez(a.p[0][0],a.p[1][0],a.p[2][0],t)*W;c.sy=bez(a.p[0][1],a.p[1][1],a.p[2][1],t)*H;c.order=k;c.count=n})
 }
}
// Path from the edge to the slot. Retracting reuses it backwards, so cards fold home the way they came.
function place(c,u){const a=ARC[c.band],ox=a.o[0]*W,oy=a.o[1]*H,mx=(ox+c.sx)/2,my=(oy+c.sy)/2+a.sag*H;
 return[bez(ox,mx,c.sx,u),bez(oy,my,c.sy,u),a.spin*(1-u)+c.rot*u,.5+.5*u]}
// Real time runs normally for FAST seconds, then the whole deck drops to SLOW speed: "frozen" mid-air.
const simTime=t=>t<FAST?t:FAST+(t-FAST)*SLOW;
const smooth=q=>q*q*(3-2*q);

function tick(now){
 frame=0;if(!dealt)return;
 const anim=live(),s=anim?simTime((now-dealtAt)/1000):99;
 // r04: the hero is sticky now, so measure retraction from page scroll rather than the hero's box.
 const r=anim?Math.max(0,Math.min(1,scrollY/(H*.55))):0;
 let busy=anim&&s<FLIGHT+STAGGER*8;
 for(const c of cards){if(!c.shown)continue;
  const p=Math.max(0,Math.min(1,(s-STAGGER*c.order)/FLIGHT)),thrown=1-Math.pow(1-p,1.6);
  // Outer cards retract first: they have the longest way home.
  const lead=c.count>1?(c.count-1-c.order)/(c.count-1):0,q=smooth(Math.max(0,Math.min(1,r*1.4-lead*.4)));
  c.u=thrown*(1-q);
 }
 // Hovered card grows; neighbours are pushed out of its radius and spring back afterwards.
 const h=hovered&&hovered.u>.96&&anim?hovered:null;
 for(const c of cards){if(!c.shown)continue;let tx=0,ty=0,ts=1;
  if(c===h)ts=HOVER_SCALE;else if(h){const dx=c.sx-h.sx,dy=c.sy-h.sy,d=Math.hypot(dx,dy)||1,
   need=Math.max(h.w,h.h)*HOVER_SCALE*.55+Math.max(c.w,c.h)*.5,over=need-d;
   if(over>0){tx=dx/d*over;ty=dy/d*over}}
  c.vx=(c.vx+(tx-c.ox)*.09)*.76;c.vy=(c.vy+(ty-c.oy)*.09)*.76;c.vs=(c.vs+(ts-c.s)*.1)*.72;
  c.ox+=c.vx;c.oy+=c.vy;c.s+=c.vs;c.rx+=(c.trx-c.rx)*.16;c.ry+=(c.try_-c.ry)*.16;
  if(Math.abs(c.vx)+Math.abs(c.vy)+Math.abs(c.vs)*40+Math.abs(c.trx-c.rx)+Math.abs(c.try_-c.ry)>.02)busy=true;
  // The hovered card also straightens most of its tilt so the image reads square-on.
  c.k+=((c===h?1:0)-c.k)*.14;if(Math.abs((c===h?1:0)-c.k)>.005)busy=true;
  const[x,y,rot,sc]=place(c,c.u);
  c.el.style.transform='translate3d('+(x+c.ox*c.u-c.w/2)+'px,'+(y+c.oy*c.u-c.h/2)+'px,0) rotate('+rot*(1-.7*c.k)+'deg) scale('+sc*c.s+')';
  c.el.style.opacity=Math.min(1,c.u*5);c.el.style.visibility=c.u<.01?'hidden':'';
  c.glass.style.transform='perspective(700px) rotateX('+c.rx+'deg) rotateY('+c.ry+'deg)';
 }
 if(busy&&visible&&!document.hidden)schedule();
}
function schedule(){if(!frame&&dealt)frame=requestAnimationFrame(tick)}
function deal(){if(dealt)return;loadImages();layout();dealt=true;layer.hidden=false;dealtAt=performance.now();hero.classList.add('cards-dealt');schedule()}

ink.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')deal()});
ink.addEventListener('pointerdown',deal);ink.addEventListener('focus',deal);
cards.forEach(c=>{
 c.el.addEventListener('pointerenter',e=>{if(e.pointerType!=='mouse')return;hovered=c;c.el.classList.add('is-hover');schedule()});
 c.el.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||!live()||!fine.matches)return;const b=c.glass.getBoundingClientRect(),
  x=Math.max(-1,Math.min(1,(e.clientX-b.left)/b.width*2-1)),y=Math.max(-1,Math.min(1,(e.clientY-b.top)/b.height*2-1));
  c.trx=-y*12;c.try_=x*14;c.glass.style.setProperty('--hx',(x+1)*50+'%');c.glass.style.setProperty('--hy',(y+1)*50+'%');schedule()});
 c.el.addEventListener('pointerleave',()=>{if(hovered===c)hovered=null;c.trx=c.try_=0;c.el.classList.remove('is-hover');schedule()});
 c.el.addEventListener('focus',()=>{hovered=c;schedule()});c.el.addEventListener('blur',()=>{if(hovered===c)hovered=null;schedule()});
});
addEventListener('scroll',schedule,{passive:true});
addEventListener('resize',()=>{if(dealt){layout();schedule()}});
new IntersectionObserver(es=>{visible=es[0].isIntersecting;schedule()}).observe(hero);
document.addEventListener('visibilitychange',schedule);document.addEventListener('portfolio:motion',schedule);
})();
