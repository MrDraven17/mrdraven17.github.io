/* r04 — section transitions after Shopify Editions (winter 2026), in this site's halftone language:
   1. the hero stays pinned while About rises over it like a curtain;
   2. wherever the colour changes, the next section burns its way up into the one before it: a fine
      pixel front with a white-hot line, a thin dark rim, faint glow and a few white sparks, advancing as it scrolls in;
   3. section headings rise into place as they enter. */
(()=>{'use strict';
const hero=document.querySelector('#home'),live=()=>window.PortfolioMotion.enabled&&!reduce.matches,reduce=matchMedia('(prefers-reduced-motion: reduce)');
const CELL=2;
// lower: colour the next section shows at its top edge, at the left and right of the page (its ::after tint varies across x).
const EDGES=[
 {before:'#about',band:[230,150],lower:[[227,232,221],[224,229,218]],seed:3},
 {before:'#selected',band:[160,110],seed:5},
 {before:'.exhibit-current',band:[180,120],lower:[[22,43,34],[22,43,34]],seed:7},
 {before:'.exhibit-wolne',band:[160,110],seed:11},
 {before:'#contact',band:[180,120],lower:[[22,43,32],[38,59,47]],seed:29},
];
function rng(seed){return()=>(seed=(seed*16807)%2147483647)/2147483647}
const rgb=c=>(c.match(/\d+(\.\d+)?/g)||[0,0,0]).map(Number);
// The colour a section actually shows: its own background, or the first ancestor's that isn't transparent.
function surface(el){for(;el;el=el.parentElement){const c=rgb(getComputedStyle(el).backgroundColor);if(c.length<4||c[3]>0)return c.slice(0,3)}return[233,236,229]}

const edges=EDGES.map(c=>{const next=document.querySelector(c.before);if(!next)return null;
 const el=document.createElement('div');el.className='burn-edge';el.setAttribute('aria-hidden','true');
 const cv=document.createElement('canvas');el.append(cv);next.before(el);
 const lower=c.lower||[surface(next),surface(next)];
 return{...c,el,cv,ctx:cv.getContext('2d'),lower,p:0,shown:false,sparks:[]}}).filter(Boolean);

// Threshold field: a cell burns once the front passes its threshold. Height dominates (the bottom row is
// always burnt, so the edge never shows a straight line); a long silhouette, blotches that burn holes just
// ahead of the front, and per-cell grain make it ragged.
function build(e){const W=innerWidth,small=W<700,band=e.band[small?1:0],gw=Math.ceil(W/CELL),gh=Math.ceil(band/CELL);
 e.el.style.setProperty('--band',band+'px');e.cv.width=gw;e.cv.height=gh;e.gw=gw;e.gh=gh;
 const r=rng(e.seed),waves=[[900,.42],[430,.27],[190,.17],[84,.09],[36,.05]].map(([l,a])=>[l,a,r()*6.283]);
 const B=14,bw=Math.ceil(gw/B)+2,bh=Math.ceil(gh/B)+2,blot=Float32Array.from({length:bw*bh},r);
 const t=new Float32Array(gw*gh);
 for(let x=0;x<gw;x++){let s=0;for(const[l,a,ph]of waves)s+=a*Math.sin(x*CELL/l*6.283+ph);s=.5+s*.5;
  for(let y=0;y<gh;y++){const yf=1-(y+.5)/gh,fx=x/B,fy=y/B,ix=fx|0,iy=fy|0,u=fx-ix,v=fy-iy,
    b=(blot[iy*bw+ix]*(1-u)+blot[iy*bw+ix+1]*u)*(1-v)+(blot[(iy+1)*bw+ix]*(1-u)+blot[(iy+1)*bw+ix+1]*u)*v;
   t[y*gw+x]=yf*.74+Math.min(1,yf*5)*(s*.24+b*.15+r()*.07)}}
 e.t=t;e.n=Uint8Array.from({length:gw*gh},()=>r()*256);e.img=e.ctx.createImageData(gw,gh);e.front=new Int16Array(gw);
 e.col=Array.from({length:gw},(_,x)=>{const k=x/(gw-1);return e.lower[0].map((v,i)=>Math.round(v+(e.lower[1][i]-v)*k))});
 e.sparks.length=0;e.drawn=-1}

// Front position from where the edge sits in the viewport: it starts at the boundary as the edge enters
// from below and has burnt most of the band by the time the edge is a little above the middle.
function target(e,top){if(!live())return .62;return Math.max(0,Math.min(1,(innerHeight*.98-top)/(innerHeight*.6)))}

const EMBER=.011,CHAR=.026,GLOW=.035,SCORCH=.06;
function draw(e,now,dP){const{gw,gh,t,n,img}=e,d=img.data,P=.02+e.p*.9,on=live(),time=now/1000,front=e.front;front.fill(gh);
 for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){const i=y*gw+x,o=i*4,k=P-t[i];
  if(k>0){if(front[x]===gh)front[x]=y;const c=e.col[x];
   if(k<EMBER){// white-hot line: brightest at the very edge, mixed back into the section colour behind; flickers softly
    const f=on?.8+.2*Math.sin(time*5.3+x*.37+Math.sin(time*1.5+x*.09)*3):.88,h=(1-k/EMBER)*f*.95;
    d[o]=Math.round(c[0]+(250-c[0])*h);d[o+1]=Math.round(c[1]+(252-c[1])*h);d[o+2]=Math.round(c[2]+(248-c[2])*h);d[o+3]=255}
   else if(k<CHAR){// a thin dark rim: the section colour deepened, no warm tint
    const m=(k-EMBER)/(CHAR-EMBER),s=.42+.58*m;d[o]=Math.round(c[0]*s);d[o+1]=Math.round(c[1]*s);d[o+2]=Math.round(c[2]*s);d[o+3]=255}
   else{d[o]=c[0];d[o+1]=c[1];d[o+2]=c[2];d[o+3]=255}}
  else if(k>-.009){// thin grey scorch right ahead of the line, so the white edge reads on light paper too
   d[o]=58;d[o+1]=66;d[o+2]=60;d[o+3]=Math.round(110*(1+k/.009))}
  else if(k>-GLOW){// faint white glow further ahead (shows on dark sections)
   const g=1+k/GLOW,f=on?.8+.2*Math.sin(time*4.1+x*.21):.88;d[o]=248;d[o+1]=250;d[o+2]=246;d[o+3]=Math.round(80*g*g*f)}
  else if(k>-SCORCH&&n[i]<60){d[o]=34;d[o+1]=40;d[o+2]=36;d[o+3]=Math.round(32*(1+k/SCORCH))}
  else d[o+3]=0}
 // White sparks lift off the line, a few more while the front is moving.
 if(on){let n=.18+Math.min(3,Math.abs(dP)*500);while(n>0&&e.sparks.length<45){if(Math.random()<n){const x=Math.random()*gw|0;if(front[x]<gh)e.sparks.push({x,y:front[x],vx:(Math.random()-.5)*.3,vy:-.25-Math.random()*.45,l:1,dl:.008+Math.random()*.02})}n--}}
 e.sparks=e.sparks.filter(s=>{s.x+=s.vx+Math.sin(time*3+s.y*.3)*.08;s.y+=s.vy;s.vy*=.995;s.l-=s.dl;const x=Math.round(s.x),y=Math.round(s.y);
  if(s.l<=0||x<0||x>=gw||y<0)return false;if(y<gh){const o=(y*gw+x)*4,a=Math.min(.85,s.l*1.1);
   const c=s.l>.5?[252,253,250]:[214,222,212];for(let i=0;i<3;i++)d[o+i]=Math.round(d[o+i]*(1-a)+c[i]*a);d[o+3]=Math.max(d[o+3],Math.round(255*a))}return true});
 e.ctx.putImageData(img,0,0)}

let frame=0,last=performance.now();
function tick(now){frame=0;const dt=Math.min(.05,(now-last)/1000);last=now;let busy=false;
 const H=hero.clientHeight;hero.style.setProperty('--cover',(live()?Math.max(0,Math.min(1,scrollY/H)):0).toFixed(3));
 for(const e of edges){const top=e.el.getBoundingClientRect().top,band=e.gh*CELL;
  e.shown=top>-40&&top-band<innerHeight;if(!e.shown)continue;
  const g=target(e,top),prev=e.p;e.p+=(g-e.p)*(live()?1-Math.pow(.004,dt):1);
  if(live()){draw(e,now,e.p-prev);busy=true}else if(e.drawn!==e.p){draw(e,now,0);e.drawn=e.p}}
 if(busy)schedule()}
function schedule(){if(!frame)frame=requestAnimationFrame(tick)}
function rebuild(){edges.forEach(build);schedule()}
let lastW=innerWidth;rebuild();
addEventListener('resize',()=>{if(innerWidth!==lastW){lastW=innerWidth;rebuild()}else schedule()});
addEventListener('scroll',schedule,{passive:true});
document.addEventListener('portfolio:motion',()=>{edges.forEach(e=>e.drawn=-1);schedule()});

// Headings rise in once, staggered.
const items=[...document.querySelectorAll('main>section:not(#home) .eyebrow, main>section:not(#home) h2, .section-heading>p, .about-name, .about-statement, .exhibit h3')];
items.forEach(el=>el.classList.add('rise'));
const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;e.target.classList.add('risen');io.unobserve(e.target)}),{rootMargin:'0px 0px -12% 0px'});
items.forEach(el=>io.observe(el));
})();
