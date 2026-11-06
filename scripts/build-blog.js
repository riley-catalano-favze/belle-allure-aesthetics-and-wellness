/**
 * Build script for Belle Allure blog posts.
 * Reads markdown files from /blog/ and:
 *   1. Generates /blog/posts.json for the blog index listing
 *   2. Generates individual HTML pages at /blog/<slug>/index.html
 *      - Full on-brand header and footer matching the site
 *      - Article schema (LD+JSON) on every post
 */

const fs = require('fs');
const path = require('path');

// Minimal frontmatter parser (no extra deps needed)
function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };
  const data = {};
  match[1].split('\n').forEach(line => {
    const sep = line.indexOf(':');
    if (sep === -1) return;
    const key = line.slice(0, sep).trim();
    const val = line.slice(sep + 1).trim().replace(/^['"]|['"]$/g, '');
    data[key] = val;
  });
  return { data, content: match[2].trim() };
}

// Very small markdown -> HTML converter (headings, bold, italic, paragraphs, links)
function mdToHtml(md) {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/^(?!<[h|u|o])/, '<p>')
    .replace(/$(?![>])/, '</p>')
    .replace(/<p><\/p>/g, '');
}

// Shared header HTML -- matches blog/index.html exactly
function buildHeader(activeSlug) {
  return `  <header style="border-bottom:1px solid #E3E8E0;background:#FFFFFF;position:sticky;top:0;z-index:2">
    <a class="skip" href="#main">Skip to main content</a>
    <input type="checkbox" id="pause-motion" class="sr-only" aria-label="Pause scrolling animations">
    <div class="wrap header-inner" style="display:flex;justify-content:space-between;align-items:center;min-height:80px">
      <a href="https://belleallureaestheticsandwellness.com/" aria-label="Belle Allure Aesthetics and Wellness, home"><img class="brand-logo" src="/assets/img/i-7e16d6ea02.webp" alt="Belle Allure Aesthetics and Wellness logo" style="height:72px;width:auto;display:block"></a>
      <input type="checkbox" id="nav-toggle" class="sr-only" aria-label="Show menu">
<a class="header-tel-icon header-sms-icon" href="sms:+15747351528" aria-label="Text Belle Allure at 574-735-1528"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></a><a class="header-tel-icon" href="tel:+15747351528" aria-label="Call Belle Allure at 574-735-1528"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></a>
      <button class="site-search-btn" type="button" aria-label="Search the site" aria-haspopup="dialog" aria-controls="ss-results"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
<label for="nav-toggle" class="menu-btn"><span></span><span></span><span></span><b>Menu</b></label>
      <nav class="nav-links" id="site-nav" aria-label="Primary">
        <div class="nav-drop-wrap">
        <a class="nav-svc-link" href="https://belleallureaestheticsandwellness.com/services">Services</a>
        <details class="nav-drop">
          <summary aria-label="Show all treatments"></summary>
          <div class="nav-drop-menu">
            <a href="https://belleallureaestheticsandwellness.com/services/wrinkles-treatment">Wrinkle treatments</a>
            <a href="https://belleallureaestheticsandwellness.com/services/fillers">Dermal fillers</a>
            <a href="https://belleallureaestheticsandwellness.com/services/prf-therapy">PRF therapy</a>
            <a href="https://belleallureaestheticsandwellness.com/services/microneedling">PRF facial microneedling</a>
            <a href="https://belleallureaestheticsandwellness.com/services/prf-under-eye-repair">PRF under eye repair</a>
            <a href="https://belleallureaestheticsandwellness.com/services/tmj-therapy">TMJ therapy</a>
            <a href="https://belleallureaestheticsandwellness.com/services/headache-treatment">Headache treatment</a>
            <a href="https://belleallureaestheticsandwellness.com/services/hyperhidrosis-treatment">Hyperhidrosis treatment</a>
            <a href="https://belleallureaestheticsandwellness.com/services/iv-therapy">IV therapy</a>
            <a href="https://belleallureaestheticsandwellness.com/services/weight-loss-treatment">Wellness injections and weight medications</a>
            <a href="https://belleallureaestheticsandwellness.com/services/acne-medication">Acne medication</a><a href="https://belleallureaestheticsandwellness.com/services/hair-restoration">Hair restoration</a>
          </div>
        </details>
        </div>
        <a href="https://belleallureaestheticsandwellness.com/reviews#reviews">Reviews</a><a href="https://belleallureaestheticsandwellness.com/reviews#before-and-after">Results</a>
        <a href="https://belleallureaestheticsandwellness.com/faq">FAQ</a>
        <a href="https://belleallureaestheticsandwellness.com/about">About</a>
        <a href="/blog/" aria-current="page">Resources</a>
        <a class="nav-book" href="https://belleallurefacialaesthetics.myaestheticrecord.com/online-booking/book-appointment">Book appointment</a>
      </nav>
      <div class="header-cta"><a class="header-phone" href="tel:+15747351528">574-735-1528</a>
      <a class="btn header-book" href="https://belleallurefacialaesthetics.myaestheticrecord.com/online-booking/book-appointment" style="background:#5E7A65;color:#FFFFFF;min-height:44px;padding:0 20px;font-size:15px">Book appointment</a></div>
    </div>
  </header>`;
}

// Shared footer HTML -- copied verbatim from blog/index.html
const FOOTER_HTML = `  <footer class="footer" style="background:#3D3D3D;color:#FBF7F1">
    <div class="wrap footer-grid" style="padding:48px 24px 32px">
      <div>
        <a href="https://belleallureaestheticsandwellness.com/" aria-label="Belle Allure Aesthetics and Wellness, home"><img loading="lazy" decoding="async" src="/assets/img/i-7e16d6ea02.webp" alt="Belle Allure Aesthetics and Wellness logo" style="height:150px;width:150px;object-fit:contain;display:block"></a>
        <p style="margin-top:12px;max-width:340px;line-height:1.6">Belle Allure Aesthetics and Wellness operates as a physician-owned medical practice, providing aesthetic and wellness services with an emphasis on individualized treatment planning, patient education, and quality care. We offer free consultations with an experienced Registered Nurse who is overseen by a medical doctor. Explore service categories such as <a href="https://belleallureaestheticsandwellness.com/services" style="text-decoration:underline">facial rejuvenation</a>, <a href="https://belleallureaestheticsandwellness.com/services" style="text-decoration:underline">skin health</a>, and <a href="https://belleallureaestheticsandwellness.com/services" style="text-decoration:underline">wellness care</a>.</p>
        <p style="margin-top:20px"><a class="btn footer-book" href="https://belleallurefacialaesthetics.myaestheticrecord.com/online-booking/book-appointment" style="background:#5E7A65;color:#FFFFFF!important">Book appointment</a></p>
        <p style="margin-top:12px"><a href="https://belleallureaestheticsandwellness.com/contact" style="color:#FBF7F1;text-decoration:underline;font-weight:600">Ask a question or request a call <span aria-hidden="true">→</span></a></p>
      </div>
      <nav aria-label="Clinics and services" style="display:flex;flex-direction:column">
        <p style="font-weight:600;margin-bottom:8px">Our services</p>
        <p style="font-weight:600;margin-top:12px;margin-bottom:6px"><a href="https://belleallureaestheticsandwellness.com/wellness-clinic" style="color:#FBF7F1">Wellness</a></p>
        <a href="https://belleallureaestheticsandwellness.com/services/iv-therapy">IV therapy</a>
        <a href="https://belleallureaestheticsandwellness.com/services/weight-loss-treatment">Wellness injections and weight medications</a>
        <p style="font-weight:600;margin-top:12px;margin-bottom:6px"><a href="https://belleallureaestheticsandwellness.com/services" style="color:#FBF7F1">Facial rejuvenation</a></p>
        <a href="https://belleallureaestheticsandwellness.com/services/wrinkles-treatment">Wrinkle treatments</a>
        <a href="https://belleallureaestheticsandwellness.com/services/fillers">Dermal fillers, lip and cheek filler</a>
        <p style="font-weight:600;margin-top:12px;margin-bottom:6px"><a href="https://belleallureaestheticsandwellness.com/skin-regeneration-clinic-elkhart" style="color:#FBF7F1">Skin regeneration</a></p>
        <a href="https://belleallureaestheticsandwellness.com/services/microneedling">PRF facial microneedling</a>
        <a href="https://belleallureaestheticsandwellness.com/services/prf-under-eye-repair">PRF under eye repair</a>
        <a href="https://belleallureaestheticsandwellness.com/services/prf-therapy">PRF therapy</a>
        <a href="https://belleallureaestheticsandwellness.com/services/hair-restoration">Hair restoration</a>
        <a href="https://belleallureaestheticsandwellness.com/services/acne-medication">Acne medication</a>
        <p style="font-weight:600;margin-top:12px;margin-bottom:6px"><a href="https://belleallureaestheticsandwellness.com/relief-clinic" style="color:#FBF7F1">Relief</a></p>
        <a href="https://belleallureaestheticsandwellness.com/services/tmj-therapy">TMJ therapy</a>
        <a href="https://belleallureaestheticsandwellness.com/services/headache-treatment">Headache treatment</a>
        <a href="https://belleallureaestheticsandwellness.com/services/hyperhidrosis-treatment">Hyperhidrosis treatment</a>
      </nav>
      <nav aria-label="Explore" style="display:flex;flex-direction:column">
        <p style="font-weight:600;margin-bottom:8px">Explore</p>
        <a href="https://belleallureaestheticsandwellness.com/services">Services</a>
        <a href="https://belleallureaestheticsandwellness.com/reviews#reviews">Reviews</a><a href="https://belleallureaestheticsandwellness.com/reviews#before-and-after">Results</a>
        <a href="https://belleallureaestheticsandwellness.com/faq">FAQ</a>
        <a href="https://belleallureaestheticsandwellness.com/about">About</a>
        <a href="/blog/">Resources</a>
        <a href="https://belleallureaestheticsandwellness.com/contact">Contact</a>
<a href="https://belleallureaestheticsandwellness.com/location">Location</a>
<a href="https://belleallureaestheticsandwellness.com/refer-a-friend">Refer a friend</a>
        <a href="https://www.facebook.com/p/Belle-Allure-Aesthetics-and-Wellness-61578410480099/" target="_blank" rel="noopener">Facebook</a>
        <a href="https://www.instagram.com/katiebelleallureaesthetics/" target="_blank" rel="noopener">Instagram</a>
      </nav>
      <div>
        <p style="font-weight:600;margin-bottom:8px">Visit us</p>
        <p style="margin-top:14px;font-weight:600">Address</p>
        <p style="color:#F8E1D1;margin-top:4px"><a href="https://www.google.com/maps/search/?api=1&amp;query=320+West+Bristol+Street+Elkhart+IN" style="color:#FBF7F1">320 West Bristol Street<br>Elkhart, IN 46514</a></p>
        <p style="margin-top:14px;font-weight:600">Hours</p>
        <div style="margin-top:6px;color:#F8E1D1">
          <p>Mon to Wed: 8:30 AM to 5:00 PM</p>
          <p>Thu: 8:30 AM to 3:00 PM</p>
          <p>Fri: 10:00 AM to 2:00 PM</p>
          <p>Select Saturdays</p>
          <p>Sun: Closed</p>
          <p style="margin-top:8px;font-weight:600;color:#FBF7F1">Closed on all holidays</p>
        </div>
        <p style="margin-top:14px;font-weight:600">Phone</p>
        <p style="margin-top:4px;color:#F8E1D1"><a href="tel:+15747351528" style="color:#FBF7F1">574-735-1528</a></p>
      </div>
    </div>

    <div class="wrap" style="border-top:1px solid #5E7A65;padding:24px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;font-size:14px;color:#F8E1D1">
      <p>&copy; 2026 <a class="bl-home" href="https://belleallureaestheticsandwellness.com/">Belle Allure, LLC</a></p>
      <p style="font-size:14px;max-width:560px">Katherine Clark, RN, Certified Aesthetic Nurse Injector, is overseen by an MD.</p>
      <p><a href="https://belleallureaestheticsandwellness.com/legal" style="font-size:14px">Legal notices</a></p>
    </div>
  </footer>`;

// Shared <head> style blocks matching blog/index.html
const HEAD_STYLES = `<style id="bl-home-link">.bl-home{color:inherit;text-decoration:none}.bl-home:hover{text-decoration:underline}</style>
<style id="wcag-fixes">
a[href^="#"]:not(.btn),[style*="#5E7A65"]:not(.btn):not(.footer-book),.eyebrow,.lbl,.meta,.svc-cta-link,.mini-cta,.lg a{color:#4F6754!important}
.lg a,a.bl-home{text-decoration-line:underline;text-underline-offset:3px}
a.bl-home{text-decoration-line:none}
a.bl-home:hover{text-decoration-line:underline}
</style>
<style id="wcag-fixes-2">
body main a:not(.btn):not(.skip):not(.scroll-cue):not(.sb-cta):not(.cta-go):not(.cta-eyebrow):not(.mobile-book):not(.on-dark):not(.svc-cta-link){color:#4F6754!important;text-decoration:underline;text-underline-offset:3px}
body .svc-cta-link,body main .svc-cta-link{color:#3F5A47!important;text-decoration:underline;text-underline-offset:3px}
body main .sb-cta,body main a.sb-cta{color:#FFFFFF!important;text-decoration:none!important}
a.bl-home{text-decoration:underline!important;text-underline-offset:3px}
.cta-eyebrow,.cta-go{color:#FFFFFF!important}
</style>
<style id="footer-link-rhythm">body footer.footer .footer-grid nav a{display:flex!important;align-items:center;min-height:44px!important;padding:0!important;line-height:1.4}body footer.footer a[aria-label$=", home"]{display:block;line-height:0;padding:0}</style>
<style id="nav-master">
@media (max-width:900px){
header .header-inner{display:flex!important;flex-wrap:wrap!important;align-items:center!important;justify-content:space-between!important;row-gap:0!important;min-height:0!important;padding-top:10px!important;padding-bottom:10px!important}
header .header-inner>a:first-child{order:1!important}
header .header-tel-icon{order:2!important;display:inline-flex!important;width:44px!important;height:44px!important;min-width:44px!important;margin:0 8px 0 auto!important;border:0!important;border-radius:0!important;color:#5E7A65!important;align-items:center!important;justify-content:center!important;background:#FFFFFF!important}
header .menu-btn{order:3!important;display:inline-flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:6px!important;width:44px!important;min-width:44px!important;height:44px!important;min-height:44px!important;padding:0!important;margin:0!important;border:none!important;border-radius:0!important;background:transparent!important;cursor:pointer!important;box-sizing:border-box!important}
header .menu-btn b{display:none!important}
header .menu-btn span{display:block!important;width:22px!important;height:2px!important;min-height:2px!important;background:#5E7A65!important;opacity:1!important;border-radius:2px!important;transition:transform .25s ease,opacity .25s ease!important}
#nav-toggle:checked~.menu-btn span:nth-child(1){transform:translateY(8px) rotate(45deg)!important}
#nav-toggle:checked~.menu-btn span:nth-child(2){opacity:0!important}
#nav-toggle:checked~.menu-btn span:nth-child(3){transform:translateY(-8px) rotate(-45deg)!important}
header .header-cta,header .header-book,header .header-phone{display:none!important}
header .nav-links{display:none!important}
header #nav-toggle:checked~#site-nav{display:flex!important;flex-direction:column!important;align-items:stretch!important;order:5!important;flex:0 0 100%!important;width:100%!important;position:static!important;transform:none!important;top:auto!important;left:auto!important;right:auto!important;margin:12px 0 0!important;padding:0 0 16px!important;gap:0!important;background:#FFFFFF!important;border-top:1px solid #E3E8E0!important;box-shadow:none!important;box-sizing:border-box!important}
header #nav-toggle:checked~#site-nav>a,header #nav-toggle:checked~#site-nav .nav-drop-wrap{display:block!important;width:100%!important;margin:0!important;border-bottom:1px solid #E3E8E0!important;box-sizing:border-box!important;position:relative!important}
header #nav-toggle:checked~#site-nav>a{display:flex!important;align-items:center!important;min-height:52px!important;padding:0 4px!important;font-size:17px!important;font-weight:600!important;color:#3D3D3D!important;text-decoration:none!important;background:transparent!important;border-radius:0!important}
header #nav-toggle:checked~#site-nav a[aria-current="page"]{text-decoration:underline!important;text-underline-offset:4px!important;text-decoration-color:#5E7A65!important}
header #nav-toggle:checked~#site-nav .nav-svc-link{display:flex!important;align-items:center!important;min-height:52px!important;padding:0 60px 0 4px!important;box-sizing:border-box!important}
header #nav-toggle:checked~#site-nav .nav-drop{position:static!important;display:block!important;width:100%!important;margin:0!important;padding:0!important}
header #nav-toggle:checked~#site-nav .nav-drop>summary{position:absolute!important;top:0!important;right:0!important;width:52px!important;height:52px!important;min-width:52px!important;display:flex!important;align-items:center!important;justify-content:center!important;list-style:none!important;cursor:pointer!important;margin:0!important;padding:0!important}
header #nav-toggle:checked~#site-nav .nav-drop>summary::-webkit-details-marker{display:none!important}
header #nav-toggle:checked~#site-nav .nav-drop>summary::after{content:""!important;display:block!important;width:8px!important;height:8px!important;border-right:2px solid #3D3D3D!important;border-bottom:2px solid #3D3D3D!important;transform:rotate(45deg)!important;margin-top:-4px!important}
header #nav-toggle:checked~#site-nav .nav-drop[open]>summary::after{transform:rotate(225deg)!important;margin-top:4px!important}
header #nav-toggle:checked~#site-nav .nav-drop-menu{display:flex!important;flex-direction:column!important;padding:0 0 8px!important;background:#FBF7F1!important}
header #nav-toggle:checked~#site-nav .nav-drop-menu a{display:block!important;min-height:44px!important;padding:10px 14px 10px 14px!important;font-size:16px!important;font-weight:500!important;color:#3D3D3D!important;text-decoration:none!important;border:none!important;background:transparent!important;box-sizing:border-box!important}
header #nav-toggle:checked~#site-nav .nav-book{display:flex!important;align-items:center!important;justify-content:center!important;min-height:52px!important;margin:14px 0 0!important;padding:0 20px!important;border-radius:999px!important;background:#5E7A65!important;color:#FFFFFF!important;font-size:16px!important;font-weight:700!important;text-decoration:none!important;border:none!important;box-sizing:border-box!important}
}
</style>
<style id="hover-light">
@media (hover:hover) and (pointer:fine){
.btn,.header-book,.nav-book,.mobile-book,.sb-mobile-book{transition:transform .2s ease,box-shadow .2s ease,filter .2s ease!important}
.btn:hover,.header-book:hover,.nav-book:hover,.mobile-book:hover,.sb-mobile-book:hover{transform:translateY(-1px)!important;box-shadow:0 6px 16px rgba(61,61,61,.14)!important;filter:brightness(.96)!important}
header .nav-links>a:not(.nav-book):hover,header .nav-links>.nav-drop-wrap>a:hover{color:#4F6754!important;text-decoration:underline!important;text-underline-offset:5px!important}
header .nav-drop-menu a:hover{color:#4F6754!important;text-decoration:underline!important;text-underline-offset:4px!important}
header .nav-drop>summary:hover{color:#4F6754!important}
footer a:hover{color:#4F6754!important;text-decoration:underline!important;text-underline-offset:3px!important}
details>summary{transition:color .2s ease}
details>summary:hover{color:#4F6754}
.header-tel-icon{transition:background-color .2s ease!important}
.header-tel-icon:hover{background:#F3F6F2!important}
}@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
<style id="drop-inline">
@media (max-width:900px){
header #site-nav .nav-drop-wrap,header #nav-toggle:checked~#site-nav .nav-drop-wrap{position:relative!important;display:block!important;width:100%!important;transform:none!important}
header #site-nav .nav-drop,header #nav-toggle:checked~#site-nav .nav-drop{position:static!important;inset:auto!important;transform:none!important;width:100%!important;max-width:none!important}
header #site-nav .nav-drop-menu,header #nav-toggle:checked~#site-nav .nav-drop-menu{position:static!important;inset:auto!important;top:auto!important;left:auto!important;right:auto!important;bottom:auto!important;transform:none!important;width:100%!important;min-width:0!important;max-width:none!important;margin:0!important;box-shadow:none!important;border:none!important;border-radius:0!important;background:#FBF7F1!important;z-index:auto!important;float:none!important}
header #site-nav .nav-drop-menu::before,header #site-nav .nav-drop-menu::after{content:none!important;display:none!important}
}
</style>
<style id="drop-dots">
@media (max-width:900px){
header #nav-toggle:checked~#site-nav .nav-drop-menu{padding:4px 0 10px!important;background:#FBF7F1!important}
header #nav-toggle:checked~#site-nav .nav-drop-menu a{position:relative!important;display:block!important;box-sizing:border-box!important;width:100%!important;min-height:44px!important;padding:11px 14px 11px 34px!important;font-size:16px!important;line-height:1.35!important;color:#3D3D3D!important;text-decoration:none!important;background:transparent!important;border:none!important}
header #nav-toggle:checked~#site-nav .nav-drop-menu a::before,header #nav-toggle:checked~#site-nav .nav-drop-menu a:first-child::before{content:""!important;display:block!important;position:absolute!important;left:14px!important;top:50%!important;transform:translateY(-50%)!important;width:6px!important;height:6px!important;margin:0!important;flex:none!important;border-radius:50%!important;background:#E5B400!important}
}
</style>
<style id="menu-scroll-fix">
@media (max-width:900px){
header #nav-toggle:checked~#site-nav{overflow:visible!important;max-height:none!important;height:auto!important}
}
</style>
<style id="section-headers">
header.split-head{position:static!important;top:auto!important;z-index:auto!important;background:transparent!important;border:0!important;box-shadow:none!important;min-height:0!important;display:block!important;padding:0!important}
</style>
<style id="footer-bottom-aligned">
div.wrap[style*="border-top:1px solid #5E7A65"]{align-items:center!important}
div.wrap[style*="border-top:1px solid #5E7A65"]>p{margin:0!important;line-height:1.5!important}@media (min-width:701px){div.wrap[style*="border-top:1px solid #5E7A65"]{display:grid!important;grid-template-columns:1fr minmax(0,560px) 1fr!important;gap:16px 24px!important;justify-content:stretch!important}
div.wrap[style*="border-top:1px solid #5E7A65"]>p:first-child{text-align:left!important}
div.wrap[style*="border-top:1px solid #5E7A65"]>p:nth-child(2){text-align:center!important}
div.wrap[style*="border-top:1px solid #5E7A65"]>p:last-child{text-align:right!important}}@media (max-width:700px){div.wrap[style*="border-top:1px solid #5E7A65"]{flex-direction:column!important;align-items:center!important;justify-content:center!important;text-align:center!important}}
</style>
<style id="footer-columns-centered">
@media (max-width:1100px){
  footer.footer .footer-grid{text-align:left!important}
  footer.footer .footer-grid nav{align-items:flex-start!important}footer.footer .footer-grid nav{width:100%!important;align-self:stretch!important}footer.footer .footer-grid>div,footer.footer .footer-grid>nav{width:100%!important;max-width:none!important}footer.footer .footer-grid nav>p:first-child,footer.footer .footer-grid>div:last-child>p:first-child{display:block!important;width:100%!important;box-sizing:border-box!important}
  footer.footer .footer-grid img{margin-left:0!important;margin-right:auto!important}
  footer.footer .footer-grid p,footer.footer .footer-grid div{text-align:left!important}
  footer.footer div.wrap[style*="border-top:1px solid #5E7A65"]{display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:flex-start!important;text-align:left!important}
  footer.footer div.wrap[style*="border-top:1px solid #5E7A65"]>p{text-align:left!important}
}
</style>
<style id="btn-link-colors">
a.btn:hover,a.btn:focus,a.btn:focus-visible,a.btn:active,a.btn:visited{text-decoration:none!important}
a.btn:not(.btn-light):not(.btn-ghost):hover,a.btn:not(.btn-light):not(.btn-ghost):focus,a.btn:not(.btn-light):not(.btn-ghost):focus-visible,a.btn:not(.btn-light):not(.btn-ghost):active{color:#FFFFFF!important}
a.btn-light:hover,a.btn-light:focus,a.btn-light:focus-visible,a.btn-light:active{color:#4F6754!important}
a.btn-ghost:hover,a.btn-ghost:focus,a.btn-ghost:focus-visible,a.btn-ghost:active{color:#5E7A65!important}
</style>
<style>
body{margin:0;background:#FBF7F1;color:#3D3D3D;font-family:'Figtree',system-ui,sans-serif;font-size:17px;line-height:1.6}
a{color:#5E7A65;text-decoration:none}
a:hover{color:#3D3D3D;text-decoration:underline}
h1,h2,h3{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;line-height:1.15;margin:0}
p{margin:0}
.wrap{max-width:1200px;margin:0 auto;padding:0 24px}
.eyebrow{font-size:13px;letter-spacing:.14em;text-transform:uppercase;font-weight:600;color:#5E7A65}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 26px;border-radius:999px;font-weight:600;font-size:16px;box-sizing:border-box}
.btn-ghost{border:1.5px solid #5E7A65;color:#5E7A65;background:transparent}
.card{background:#FFFFFF;border:1px solid #E3E8E0;border-radius:18px;padding:32px;box-sizing:border-box}
.footer-grid{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:40px}
.footer a{color:#FBF7F1}.footer nav a{display:inline-flex;align-items:center;min-height:44px}
.footer a:hover{color:#FFFFFF;text-decoration:underline}
html{scroll-behavior:smooth}
summary{cursor:pointer;font-weight:600;font-size:18px;min-height:44px;display:flex;align-items:center}
img{max-width:100%;height:auto}
.skip{position:absolute;left:-9999px;top:8px;z-index:20;background:#FFFFFF;color:#3D3D3D;padding:12px 18px;border-radius:12px;font-weight:600}
.skip:focus{left:16px}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;opacity:0;pointer-events:none}
@media (max-width:900px){.footer-grid{grid-template-columns:1fr 1fr}}
@media (max-width:600px){.footer-grid{grid-template-columns:1fr}
.card{padding:28px}
[style*="padding:112px 0"],[style*="padding:104px 0"]{padding-top:64px!important;padding-bottom:64px!important}
[style*="padding-bottom:112px"]{padding-bottom:64px!important}
[style*="margin-top:88px"]{margin-top:56px!important}
[style*="padding:64px 24px"]{padding:48px 24px!important}}
.footer-book{background:#5E7A65;color:#FFFFFF!important;min-height:48px;padding:0 26px}
</style>`;

const blogDir = path.join(__dirname, '..', 'blog');
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'));

const posts = [];

files.forEach(filename => {
  const raw = fs.readFileSync(path.join(blogDir, filename), 'utf8');
  const { data, content } = parseFrontmatter(raw);
  if (!data.title || !data.date) return;

  // Slug: strip date prefix and .md
  const slug = filename.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
  const postUrl = `https://belleallureaestheticsandwellness.com/blog/${slug}/`;
  const imageUrl = data.image
    ? (data.image.startsWith('http') ? data.image : `https://belleallureaestheticsandwellness.com${data.image}`)
    : null;

  posts.push({
    slug,
    title: data.title,
    date: data.date,
    image: data.image || null,
    image_alt: data.image_alt || data.title,
    excerpt: data.excerpt || '',
  });

  // Article schema for this post
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': postUrl,
    headline: data.title,
    description: data.excerpt || '',
    url: postUrl,
    datePublished: data.date,
    dateModified: data.date,
    author: {
      '@type': 'Person',
      name: 'Katherine Clark, RN',
      url: 'https://belleallureaestheticsandwellness.com/about'
    },
    publisher: {
      '@id': 'https://belleallureaestheticsandwellness.com/#business'
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl
    },
    ...(imageUrl ? {
      image: {
        '@type': 'ImageObject',
        url: imageUrl,
        ...(data.image_alt ? { caption: data.image_alt } : {})
      }
    } : {}),
    isPartOf: {
      '@type': 'Blog',
      '@id': 'https://belleallureaestheticsandwellness.com/blog/',
      name: 'Belle Allure Resources'
    }
  };

  // Build individual post page
  const postDir = path.join(blogDir, slug);
  if (!fs.existsSync(postDir)) fs.mkdirSync(postDir, { recursive: true });

  const bodyHtml = mdToHtml(content);
  const postHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${data.title} | Belle Allure Aesthetics and Wellness</title>
<link rel="icon" type="image/png" sizes="512x512" href="https://belleallureaestheticsandwellness.com/favicon.png">
<link rel="apple-touch-icon" sizes="180x180" href="https://belleallureaestheticsandwellness.com/apple-touch-icon.png">
<meta name="description" content="${(data.excerpt || '').replace(/"/g, '&quot;')}">
<link rel="canonical" href="${postUrl}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Figtree:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/header.css">
<link rel="stylesheet" href="/assets/css/site-search.css">
${imageUrl ? `<meta property="og:image" content="${imageUrl}">
<meta property="og:image:alt" content="${(data.image_alt || data.title).replace(/"/g, '&quot;')}">` : ''}
<meta property="og:type" content="article">
<meta property="og:title" content="${data.title.replace(/"/g, '&quot;')} | Belle Allure Aesthetics and Wellness">
<meta property="og:description" content="${(data.excerpt || '').replace(/"/g, '&quot;')}">
<meta property="og:url" content="${postUrl}">
<meta property="og:site_name" content="Belle Allure Aesthetics and Wellness">
<meta property="article:published_time" content="${data.date}">
<meta name="twitter:card" content="${imageUrl ? 'summary_large_image' : 'summary'}">
<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>
${HEAD_STYLES}
<style id="post-page">
.post-wrap{max-width:720px;margin:0 auto;padding:48px 24px 80px}
.post-breadcrumb{font-size:13px;margin-bottom:24px;color:#6B6B6B}
.post-breadcrumb a{color:#4F6754;text-decoration:underline;text-underline-offset:3px}
.post-meta{font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#6B6B6B;margin-bottom:16px}
.post-title{font-family:'Cormorant Garamond',Georgia,serif;font-size:clamp(32px,5vw,48px);font-weight:700;line-height:1.1;margin-bottom:28px;color:#3D3D3D}
.hero-img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:12px;margin-bottom:36px;display:block}
.post-body h2{font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:700;margin:36px 0 12px;color:#3D3D3D}
.post-body h3{font-size:20px;font-weight:600;margin:28px 0 8px;color:#3D3D3D}
.post-body p{margin-bottom:20px;font-size:17px}
.post-body strong{font-weight:600}
.post-cta{margin-top:48px;padding:36px 32px;background:#EAF0EB;border-radius:18px;text-align:center;border:1px solid #C8D9CB}
.post-cta p{color:#3D3D3D;margin-bottom:20px;font-size:17px;line-height:1.6}
.post-cta .btn{background:#5E7A65;color:#FFFFFF;text-decoration:none}
</style>
<link rel="stylesheet" href="/assets/css/footer.css">
</head>
<body>
${buildHeader(slug)}

<main id="main">
<div class="post-wrap">
  <p class="post-breadcrumb"><a href="https://belleallureaestheticsandwellness.com/">Home</a> &rsaquo; <a href="/blog/">Resources</a> &rsaquo; ${data.title}</p>
  <p class="post-meta">${data.date}</p>
  <h1 class="post-title">${data.title}</h1>
  ${imageUrl ? `<img class="hero-img" src="${data.image}" alt="${(data.image_alt || data.title).replace(/"/g, '&quot;')}">` : ''}
  <div class="post-body">
    ${bodyHtml}
  </div>
  <div class="post-cta">
    <p>Ready to book a consultation with Katherine Clark, RN?</p>
    <a class="btn" href="https://belleallurefacialaesthetics.myaestheticrecord.com/online-booking/book-appointment">Book a free consultation</a>
  </div>
</div>
</main>

${FOOTER_HTML}
</body>
</html>`;

  fs.writeFileSync(path.join(postDir, 'index.html'), postHtml);
  console.log(`Built: /blog/${slug}/`);
});

// Sort newest first
posts.sort((a, b) => new Date(b.date) - new Date(a.date));

fs.writeFileSync(
  path.join(blogDir, 'posts.json'),
  JSON.stringify(posts, null, 2)
);

console.log(`Done. ${posts.length} post(s) indexed.`);
