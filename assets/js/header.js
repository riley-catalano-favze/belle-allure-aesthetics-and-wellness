/* Shared site header behaviour. Loaded on every page. */
(function(){
  /* Close the mobile menu when a link is tapped */
  document.querySelectorAll('#site-nav a').forEach(function(a){
    if (a.classList.contains('nav-svc-link')) return;
    a.addEventListener('click', function(){ var t=document.getElementById('nav-toggle'); if (t) t.checked=false; });
  });
  /* Mark the current page in the menu */
  var here = location.pathname.replace(/\.html$/,'').replace(/\/index$/,'/').replace(/\/$/,'') || '/';
  document.querySelectorAll('header a[href]').forEach(function(a){
    var p = a.getAttribute('href');
    if (!p || p.charAt(0)==='#' || /^(tel|sms|mailto):/.test(p)) return;
    try { p = new URL(p, location.origin).pathname.replace(/\.html$/,'').replace(/\/$/,'') || '/'; } catch(e) { return; }
    if (p === here && !a.closest('.nav-drop')) a.setAttribute('aria-current','page');
  });
  /* Menu open state for mobile */
  var t=document.getElementById('nav-toggle');
  function s(){ document.documentElement.classList.toggle('menu-open', !!(t && t.checked)); }
  if (t) { t.addEventListener('change', s); s(); }
})();
/* One Services dropdown: hover opens it on desktop; tap toggles it on phone and tablet */
(function(){
  var desk = window.matchMedia('(min-width:901px) and (hover:hover) and (pointer:fine)');
  var timer = null;
  document.querySelectorAll('.nav-drop-wrap').forEach(function(w){
    var d = w.querySelector('.nav-drop');
    var s = d && d.querySelector('summary');
    var link = w.querySelector('.nav-svc-link');
    if (!d || !s) return;
    s.addEventListener('click', function(e){ e.preventDefault(); if (!desk.matches) d.open = !d.open; });
    if (link) link.addEventListener('click', function(e){ if (desk.matches) return; e.preventDefault(); d.open = !d.open; });
    w.addEventListener('pointerenter', function(e){ if (!desk.matches || (e.pointerType && e.pointerType !== 'mouse')) return; clearTimeout(timer); d.open = true; });
    w.addEventListener('pointerleave', function(e){ if (!desk.matches || (e.pointerType && e.pointerType !== 'mouse')) return; timer = setTimeout(function(){ d.open = false; }, 180); });
  });
})();
