
// Scroll progress
const prg=document.getElementById('prg');
if(prg){
  const updateProgress=()=>{
    const max=document.documentElement.scrollHeight-window.innerHeight;
    prg.style.width=max>0?(window.scrollY/max*100)+'%':'0%';
  };
  window.addEventListener('scroll',updateProgress);
  updateProgress();
}

// Mobile nav
const mbt=document.getElementById('mbt');
const nl=document.getElementById('nl');
if(mbt&&nl){
  mbt.addEventListener('click',()=>{
    const open=!nl.classList.contains('open');
    mbt.classList.toggle('open',open);
    nl.classList.toggle('open',open);
    mbt.setAttribute('aria-expanded',open?'true':'false');
  });
  nl.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
    mbt.classList.remove('open');
    nl.classList.remove('open');
    mbt.setAttribute('aria-expanded','false');
  }));
}

// Scroll reveal
const ro=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in')}),{threshold:.1});
document.querySelectorAll('.rev,.revl,.revr').forEach(el=>ro.observe(el));

// Count-up stats
if(document.querySelector('.stn[data-t]')){
  document.querySelectorAll('.stn[data-t]').forEach(el=>{
    const obs=new IntersectionObserver(([e])=>{
      if(!e.isIntersecting)return;
      const t=+el.dataset.t,p=el.dataset.p||'',s=el.dataset.s||'';
      let start=null;
      const step=ts=>{if(!start)start=ts;const pr=Math.min((ts-start)/1100,1),ea=1-Math.pow(1-pr,3);
        el.textContent=p+Math.round(ea*t)+s;if(pr<1)requestAnimationFrame(step)};
      requestAnimationFrame(step);obs.unobserve(el);
    },{threshold:.5});
    obs.observe(el);
  });
}

// Carousel, only on the work page
const track=document.getElementById('carTrack');
const dotsWrap=document.getElementById('carDots');
const prevBtn=document.getElementById('carPrev');
const nextBtn=document.getElementById('carNext');
if(track&&dotsWrap&&prevBtn&&nextBtn){
  const slides=track.querySelectorAll('.car-slide');
  let current=0;
  slides.forEach((_,i)=>{
    const d=document.createElement('button');
    d.className='dot'+(i===0?' active':'');
    d.addEventListener('click',()=>goTo(i));
    dotsWrap.appendChild(d);
  });
  const dots=dotsWrap.querySelectorAll('.dot');
  function goTo(i){
    current=(i+slides.length)%slides.length;
    const slideWidth=slides[0].offsetWidth+18;
    track.scrollTo({left:current*slideWidth,behavior:'smooth'});
    dots.forEach((d,idx)=>d.classList.toggle('active',idx===current));
  }
  prevBtn.addEventListener('click',()=>goTo(current-1));
  nextBtn.addEventListener('click',()=>goTo(current+1));
  let autoPlay=setInterval(()=>goTo(current+1),5500);
  track.addEventListener('mouseenter',()=>clearInterval(autoPlay));
  track.addEventListener('mouseleave',()=>autoPlay=setInterval(()=>goTo(current+1),5500));
  track.addEventListener('scroll',()=>{
    const slideWidth=slides[0].offsetWidth+18;
    const idx=Math.round(track.scrollLeft/slideWidth);
    if(idx!==current&&idx>=0&&idx<slides.length){current=idx;dots.forEach((d,i)=>d.classList.toggle('active',i===current));}
  });
}
