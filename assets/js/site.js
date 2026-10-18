// Close the mobile menu when a nav link is tapped
document.querySelectorAll('#site-nav a').forEach(function (a) {
  a.addEventListener('click', function () {
    var t = document.getElementById('nav-toggle');
    if (t) t.checked = false;
  });
});

// Desktop: open the Services list on hover or keyboard focus
(function () {
  var wide = window.matchMedia('(min-width:761px)');
  document.querySelectorAll('.nav-drop-wrap').forEach(function (w) {
    var d = w.querySelector('.nav-drop');
    var t = null;
    function show() { if (!wide.matches) return; clearTimeout(t); d.open = true; }
    function hide() { if (!wide.matches) return; clearTimeout(t); t = setTimeout(function () { d.open = false; }, 180); }
    w.addEventListener('mouseenter', show);
    w.addEventListener('mouseleave', hide);
    w.addEventListener('focusin', show);
    w.addEventListener('focusout', hide);
  });
})();
