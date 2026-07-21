import Lenis from 'lenis';

const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- existing: scroll-reveal ---- */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.15});
document.querySelectorAll('.rv').forEach(el=>io.observe(el));

/* ---- existing: count-up ticker ---- */
const cio=new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting)return;cio.unobserve(e.target);
  const t=+e.target.dataset.count;
  if(reduce){e.target.textContent=t;return}
  const t0=performance.now();
  (function tick(n){const p=Math.min(1,(n-t0)/1200);e.target.textContent=Math.round(t*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(tick)})(t0);
}),{threshold:.6});
document.querySelectorAll('[data-count]').forEach(el=>cio.observe(el));

/* ---- lenis core (skipped entirely under reduced motion) ---- */
let lenis=null;
if(!reduce){
  lenis=new Lenis({autoToggle:true,wheelMultiplier:1,touchMultiplier:1});
  window.__lenis=lenis;
}

/* ---- loading screen ---- */
const loader=document.querySelector('.loader');
function releaseHero(){document.documentElement.classList.remove('loading')}
if(loader){
  if(reduce){
    loader.remove();
    releaseHero();
  }else{
    document.documentElement.classList.add('no-scroll');
    if(lenis)lenis.stop();
    setTimeout(()=>{
      loader.classList.add('leaving');
      releaseHero();
      document.documentElement.classList.remove('no-scroll');
      if(lenis)lenis.start();
      setTimeout(()=>loader.remove(),650);
    },1300);
  }
}else{
  releaseHero();
}

/* ---- scroll-progress bar (works with or without lenis) ---- */
const scrollFill=document.querySelector('.scrollbar-fill');
function updateScrollbar(progress){scrollFill.style.transform=`scaleX(${progress})`}
if(reduce||!lenis){
  const nativeUpdate=()=>{
    const doc=document.documentElement;
    updateScrollbar(doc.scrollTop/(doc.scrollHeight-doc.clientHeight||1));
  };
  window.addEventListener('scroll',nativeUpdate,{passive:true});
  nativeUpdate();
}

/* ---- marquee: speed reacts to scroll velocity ---- */
const track=document.querySelector('.marquee .track');
let mqReady=false,mqX=0,mqWidth=0,mqBase=0;
function initMarquee(){
  mqWidth=track.scrollWidth/2;
  mqBase=mqWidth/26;
  track.style.animation='none';
  mqReady=true;
}
function tickMarquee(dt,velocity){
  if(!mqReady)return;
  const v=Math.min(Math.abs(velocity),60);
  mqX-=(mqBase+v*8)*dt;
  if(mqX<=-mqWidth)mqX+=mqWidth;
  track.style.transform=`translateX(${mqX}px)`;
}
if(lenis){
  initMarquee();
  window.addEventListener('resize',initMarquee);
  window.addEventListener('load',initMarquee);
}

/* ---- hero shapes: scroll-linked parallax on top of the idle css drift ---- */
const pwA=document.querySelector('.pw-a'),pwB=document.querySelector('.pw-b');
const heroEl=document.querySelector('.hero');
let heroVisible=true;
if(heroEl){
  new IntersectionObserver(es=>{heroVisible=es[0].isIntersecting},{threshold:0}).observe(heroEl);
}
function tickParallax(scroll){
  if(!pwA||!heroVisible)return;
  pwA.style.transform=`translate3d(0, ${scroll*-0.12}px, 0)`;
  pwB.style.transform=`translate3d(0, ${scroll*-0.22}px, 0)`;
}

/* ---- recipes track: draggable momentum carousel ---- */
let cardsLenis=null;
const rTrack=document.querySelector('.r-track');
if(lenis&&rTrack){
  cardsLenis=new Lenis({wrapper:rTrack,content:rTrack,orientation:'horizontal',gestureOrientation:'horizontal',smoothWheel:true,syncTouch:true});
  rTrack.style.scrollSnapType='none';

  let dragging=false,startX=0,startScroll=0;
  rTrack.addEventListener('pointerdown',e=>{
    dragging=true;rTrack.classList.add('dragging');
    startX=e.clientX;startScroll=rTrack.scrollLeft;
    rTrack.setPointerCapture(e.pointerId);
  });
  rTrack.addEventListener('pointermove',e=>{
    if(!dragging)return;
    rTrack.scrollLeft=startScroll-(e.clientX-startX);
  });
  ['pointerup','pointercancel'].forEach(evt=>rTrack.addEventListener(evt,()=>{
    if(!dragging)return;
    dragging=false;rTrack.classList.remove('dragging');
    snapToNearest();
  }));
  cardsLenis.on('scroll',({velocity})=>{
    if(!dragging&&Math.abs(velocity)<0.05)snapToNearest();
  });

  function snapToNearest(){
    const cards=[...rTrack.querySelectorAll('.r-card')];
    if(!cards.length)return;
    const target=cards.reduce((a,b)=>
      Math.abs(b.offsetLeft-rTrack.scrollLeft)<Math.abs(a.offsetLeft-rTrack.scrollLeft)?b:a
    );
    cardsLenis.scrollTo(target,{lerp:0.12});
  }
}

/* ---- anchor links routed through lenis.scrollTo ---- */
if(lenis){
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click',e=>{
      const id=a.getAttribute('href').slice(1);
      const target=id&&document.getElementById(id);
      if(!target)return;
      e.preventDefault();
      lenis.scrollTo(target,{offset:-96,duration:1.1});
    });
  });
}

/* ---- shared raf loop driving every lenis-dependent effect above ---- */
let lastTime=0;
let rafId=null;
function raf(time){
  if(lenis)lenis.raf(time);
  if(cardsLenis)cardsLenis.raf(time);
  const dt=Math.min((time-lastTime)/1000,0.05);
  lastTime=time;
  if(lenis){
    updateScrollbar(lenis.progress);
    tickMarquee(dt,lenis.velocity);
    tickParallax(lenis.scroll);
  }
  rafId=requestAnimationFrame(raf);
}
rafId=requestAnimationFrame(raf);

/* ---- dev-mode HMR safety: tear down cleanly if this module is ever hot-replaced ---- */
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if(rafId)cancelAnimationFrame(rafId);
    lenis?.destroy();
    cardsLenis?.destroy();
  });
}
