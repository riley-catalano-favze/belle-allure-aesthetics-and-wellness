(function(){var f=document.querySelector("footer");if(!f||!("IntersectionObserver" in window))return;var io=new IntersectionObserver(function(es){es.forEach(function(e){document.body.classList.toggle("cue-hidden",e.isIntersecting)})},{rootMargin:"0px 0px -80px 0px",threshold:0});io.observe(f);})();
;
(function(){var links=[].slice.call(document.querySelectorAll('.sb-jump a'));if(!('IntersectionObserver' in window)||!links.length)return;var map={};links.forEach(function(a){map[a.getAttribute('href').slice(1)]=a});var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;links.forEach(function(l){l.classList.remove('is-active');l.removeAttribute('aria-current')});var a=map[e.target.id];if(a){a.classList.add('is-active');a.setAttribute('aria-current','true')}})},{rootMargin:'-35% 0px -55% 0px'});document.querySelectorAll('.sb-svc').forEach(function(x){io.observe(x)})})();
;
(function(){var t=document.getElementById('nav-svc'),d=document.querySelector('.nav-drop');if(!t||!d)return;document.addEventListener('click',function(e){if(t.checked&&!d.contains(e.target))t.checked=false});document.addEventListener('keydown',function(e){if(e.key==='Escape')t.checked=false});})();
;
(function(){var h=document.querySelector('.sb-hero');if(!h||!('IntersectionObserver' in window))return;var io=new IntersectionObserver(function(es){es.forEach(function(e){document.body.classList.toggle('cue-past',!e.isIntersecting)})},{rootMargin:'0px 0px -40% 0px',threshold:0});io.observe(h);})();
;
(function(){var g=document.querySelector('.sb-services'),b=document.querySelector('.sb-rail-toggle');if(!g||!b)return;function set(off,save){g.classList.toggle('rail-off',off);b.setAttribute('aria-expanded',String(!off));b.setAttribute('aria-label',off?'Show treatment list':'Hide treatment list');if(save){try{localStorage.setItem('ba-rail',off?'off':'on')}catch(e){}}}try{set(localStorage.getItem('ba-rail')==='off',false)}catch(e){}b.addEventListener('click',function(){set(!g.classList.contains('rail-off'),true)})})();
;
document.querySelectorAll('#site-nav a').forEach(function(a){if(a.classList.contains('nav-svc-link'))return;a.addEventListener('click',function(){var t=document.getElementById('nav-toggle');if(t)t.checked=false;});});
;

(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PX_PER_SEC = 48;
  var canHover = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  document.querySelectorAll('.review-row, .pain-row').forEach(function (row) {
    var track = row.querySelector('.review-track, .pain-track');
    if (!track || track.children.length < 2) return;
    var paused = false, resumeTimer = null, last = 0;
    function half() { return track.children[1].offsetLeft - track.children[0].offsetLeft; }
    function holdFor(ms) {
      paused = true; clearTimeout(resumeTimer);
      resumeTimer = setTimeout(function () { paused = false; }, ms);
    }
    function userHold() { holdFor(3000); }
    function step(t) {
      var dt = last ? (t - last) / 1000 : 0; last = t;
      var stopped = (+(row.dataset.manualUntil || 0)) > Date.now() || (canHover && row.matches(':hover'));
      if (!stopped && dt < 0.2) {
        var h = half();
        row.scrollLeft += PX_PER_SEC * dt;
        if (h > 0 && row.scrollLeft >= h) row.scrollLeft -= h;
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
})();

;

(function(){
  function rowFor(btn){ return btn.getAttribute('data-row')==='pain' ? document.querySelector('.pain-row') : document.querySelector('.review-row'); }
  function nudge(row, dist){
    var start = row.scrollLeft, target = start + dist, t0 = null, dur = 420;
    row.dataset.manualUntil = String(Date.now() + dur + 900);
    function ease(p){ return 1 - Math.pow(1 - p, 3); }
    function frame(t){
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      row.scrollLeft = start + (target - start) * ease(p);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  document.querySelectorAll('.rn-btn').forEach(function(btn){
    var dir = Number(btn.getAttribute('data-dir'));
    var holding = null, pressT = 0;
    function hold(){
      var row = rowFor(btn); if (!row) return;
      row.dataset.manualUntil = String(Date.now() + 100000);
      (function go(){
        if (!holding) { row.dataset.manualUntil = String(Date.now() + 1200); return; }
        row.scrollLeft += dir * 6;
        requestAnimationFrame(go);
      })();
    }
    btn.addEventListener('pointerdown', function(e){
      pressT = Date.now(); holding = true;
      setTimeout(function(){ if (holding && Date.now() - pressT >= 250) hold(); }, 260);
    });
    function release(){
      if (!holding) return;
      var quick = Date.now() - pressT < 250;
      holding = false;
      var row = rowFor(btn);
      if (quick && row) nudge(row, dir * 320);
    }
    btn.addEventListener('click', function(e){
      if (e.detail !== 0) return;
      var row = rowFor(btn); if (row) nudge(row, dir * 320);
    });
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointerleave', function(){ holding = false; });
    btn.addEventListener('pointercancel', function(){ holding = false; });
    btn.addEventListener('keydown', function(e){
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); var row = rowFor(btn); if (row) nudge(row, dir * 320); }
    });
  });
})();

;
(function(){
function sync(el){var hid=el.getAttribute('aria-hidden')==='true';
 var items=[el].concat(Array.prototype.slice.call(el.querySelectorAll('a,button,input,select,textarea,[tabindex]')));
 items.forEach(function(f){
  if(hid){ if(!f.hasAttribute('data-orig-tab')){ f.setAttribute('data-orig-tab',f.getAttribute('tabindex')||''); } f.setAttribute('tabindex','-1'); }
  else if(f.hasAttribute('data-orig-tab')){ var o=f.getAttribute('data-orig-tab'); if(o==='') f.removeAttribute('tabindex'); else f.setAttribute('tabindex',o); f.removeAttribute('data-orig-tab'); }
 });}
document.querySelectorAll('[aria-hidden]').forEach(sync);
new MutationObserver(function(ms){ms.forEach(function(m){sync(m.target);});}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['aria-hidden']});
})();
;

/* One Services dropdown for every width: pointer hover opens it on desktop; a tap or click toggles it on phone and tablet */
(function(){
  var desk = window.matchMedia('(min-width:901px) and (hover:hover) and (pointer:fine)');
  var timer = null;
  document.querySelectorAll('.nav-drop-wrap').forEach(function(w){
    var d = w.querySelector('.nav-drop');
    var s = d && d.querySelector('summary');
    var link = w.querySelector('.nav-svc-link');
    if (!d || !s) return;
    s.addEventListener('click', function(e){ e.preventDefault(); if (!desk.matches) d.open = !d.open; });
    if (link) link.addEventListener('click', function(e){
      if (desk.matches) return;
      e.preventDefault();
      d.open = !d.open;
    });
    w.addEventListener('pointerenter', function(e){
      if (!desk.matches || (e.pointerType && e.pointerType !== 'mouse')) return;
      clearTimeout(timer); d.open = true;
    });
    w.addEventListener('pointerleave', function(e){
      if (!desk.matches || (e.pointerType && e.pointerType !== 'mouse')) return;
      timer = setTimeout(function(){ d.open = false; }, 180);
    });
  });
})();

;
(function(){var t=document.getElementById('nav-toggle');if(!t)return;function s(){document.documentElement.classList.toggle('menu-open',t.checked);}t.addEventListener('change',s);s();})();
;
(function(){
  var nav=document.querySelector('.svc-side-nav'); if(!nav) return;
  var links=[].slice.call(nav.querySelectorAll('a[href^="#"]'));
  var pairs=links.map(function(a){return {a:a,el:document.querySelector(a.getAttribute('href'))};}).filter(function(p){return p.el;});
  var ticking=false;
  function update(){
    ticking=false; var cut=170, cur=null;
    pairs.forEach(function(p){ if(p.el.getBoundingClientRect().top<=cut) cur=p; });
    if(!cur && pairs.length) cur=pairs[0];
    pairs.forEach(function(p){ var on=(p===cur); p.a.classList.toggle('is-current',on); if(on) p.a.setAttribute('aria-current','true'); else p.a.removeAttribute('aria-current'); });
  }
  function req(){ if(!ticking){ ticking=true; requestAnimationFrame(update); } }
  window.addEventListener('scroll',req,{passive:true}); window.addEventListener('resize',req);
  update();
})();
;
(function(){
  var c=document.getElementById('social-corner'); if(!c) return;
  var end=document.querySelector('section.sb-faq');
  var t=false;
  function update(){
    t=false;
    var hide = end ? end.getBoundingClientRect().bottom < window.innerHeight : false;
    c.hidden=hide;
  }
  function req(){ if(!t){ t=true; requestAnimationFrame(update); } }
  window.addEventListener('scroll',req,{passive:true});
  window.addEventListener('resize',req);
  update();
})();
/* ---------- Service pages: services carousel ---------- */
(function(){
  document.querySelectorAll('.sp-strip-wrap').forEach(function(w){
    var strip=w.querySelector('.sp-strip'), prev=w.querySelector('.sp-prev'), next=w.querySelector('.sp-next');
    if(!strip) return;
    function step(){ var c=strip.querySelector('.sp-card'); return c ? c.getBoundingClientRect().width+20 : 300; }
    if(prev) prev.addEventListener('click',function(){ strip.scrollBy({left:-step(),behavior:'smooth'}); });
    if(next) next.addEventListener('click',function(){ strip.scrollBy({left:step(),behavior:'smooth'}); });
  });
})();
;
/* Side navigation: show after the hero, hide once Important information has passed */
(function(){
  var nav=document.querySelector('.svc-side-nav'); if(!nav) return;
  var hero=document.getElementById('top');
  var imp=document.getElementById('important');
  var impSec=imp?imp.closest('section'):null;
  var ticking=false;
  function update(){
    ticking=false;
    var vh=window.innerHeight;
    var pastHero=hero?hero.getBoundingClientRect().bottom<=120:true;
    var pastImportant=impSec?impSec.getBoundingClientRect().bottom<vh*0.5:false;
    nav.classList.toggle('is-on',pastHero&&!pastImportant);
  }
  function req(){ if(!ticking){ ticking=true; requestAnimationFrame(update); } }
  window.addEventListener('scroll',req,{passive:true});
  window.addEventListener('resize',req);
  update();
})();
