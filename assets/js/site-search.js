/* Belle Allure site search: ranked results, highlighted matches, keyboard and screen reader support */
(function () {
  'use strict';

  var INDEX_SRC = '/assets/js/search-index.js';
  var RECENT_KEY = 'ba-search-recent';
  var POPULAR = ['Dermal fillers', 'Wrinkle treatments', 'PRF therapy', 'IV therapy', 'Pricing', 'HSA'];
  var PHONE = '574-735-1528';
  var index = null, loading = null;
  var dialog, input, list, status, panel, lastFocus, activeIndex = -1, results = [];
  var lastQuery = '';

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9$]+/g, ' ').trim();
  }
  function tokens(q) { return norm(q).split(' ').filter(Boolean); }

  function loadIndex() {
    if (index) return Promise.resolve(index);
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      if (window.BA_SEARCH_INDEX) { index = prepare(window.BA_SEARCH_INDEX); return resolve(index); }
      var s = document.createElement('script');
      s.src = INDEX_SRC;
      s.onload = function () { index = prepare(window.BA_SEARCH_INDEX || []); resolve(index); };
      s.onerror = function () { reject(new Error('index')); };
      document.head.appendChild(s);
    });
    return loading;
  }

  function prepare(raw) {
    return raw.map(function (e) {
      return {
        url: e.url, page: e.page, kind: e.kind, heading: e.heading, anchor: e.anchor, text: e.text,
        nPage: norm(e.page), nHead: norm(e.heading), nText: norm(e.text),
        nFull: norm(e.page + ' ' + e.heading + ' ' + e.text)
      };
    });
  }

  function score(entry, qt, phrase) {
    var total = 0;
    for (var i = 0; i < qt.length; i++) {
      var t = qt[i], isLast = i === qt.length - 1, best = 0;
      var words = function (hay) { return (' ' + hay + ' '); };
      var hit = function (hay, wordW, subW) {
        if (!hay) return 0;
        if (words(hay).indexOf(' ' + t) !== -1 && !isLast) return wordW;
        if (words(hay).indexOf(' ' + t) !== -1 && isLast) return wordW;
        if (hay.indexOf(t) !== -1) return subW;
        return 0;
      };
      best = Math.max(hit(entry.nHead, 6, 3), hit(entry.nPage, 3, 1.5), hit(entry.nText, 2, 0.8));
      if (!best) return 0;
      total += best;
    }
    if (phrase && (entry.nHead.indexOf(phrase) !== -1)) total += 8;
    else if (phrase && (entry.nText.indexOf(phrase) !== -1)) total += 4;
    if (entry.anchor === '') total += 0.5;
    return total;
  }

  function search(q) {
    var qt = tokens(q);
    if (!qt.length || !index) return [];
    var phrase = qt.join(' ');
    var scored = [];
    for (var i = 0; i < index.length; i++) {
      var s = score(index[i], qt, phrase);
      if (s > 0) scored.push({ e: index[i], s: s });
    }
    scored.sort(function (a, b) { return b.s - a.s; });
    var perPage = {}, out = [];
    for (var j = 0; j < scored.length && out.length < 9; j++) {
      var u = scored[j].e.url;
      perPage[u] = (perPage[u] || 0) + 1;
      if (perPage[u] > 2) continue;
      out.push(scored[j].e);
    }
    return out;
  }

  function highlightFragment(text, qt) {
    var frag = document.createDocumentFragment();
    if (!qt.length) { frag.appendChild(document.createTextNode(text)); return frag; }
    var esc = qt.map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); });
    var re = new RegExp('(' + esc.map(function (t) { return '\\b' + t + '[a-z0-9]*'; }).join('|') + ')', 'ig');
    var parts = text.split(re);
    parts.forEach(function (p, i) {
      if (!p) return;
      if (i % 2 === 1) { var m = document.createElement('mark'); m.textContent = p; frag.appendChild(m); }
      else frag.appendChild(document.createTextNode(p));
    });
    return frag;
  }

  function snippet(text, qt) {
    var n = norm(text), idx = -1;
    for (var i = 0; i < qt.length; i++) { idx = n.indexOf(qt[i]); if (idx !== -1) break; }
    if (text.length <= 170) return text;
    var start = 0;
    if (idx > 60) start = Math.max(0, text.toLowerCase().indexOf(qt[0] || '') - 60);
    var s = text.slice(start, start + 180);
    if (start > 0) s = '…' + s.replace(/^\S*\s/, '');
    if (start + 180 < text.length) s = s.replace(/\s\S*$/, '') + '…';
    return s;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function renderEmpty() {
    list.innerHTML = '';
    var wrap = el('div', 'ss-empty');
    wrap.appendChild(el('p', 'ss-empty-title', 'Popular searches'));
    var chips = el('div', 'ss-chips');
    POPULAR.forEach(function (p) {
      var b = el('button', 'ss-chip', p);
      b.type = 'button';
      b.addEventListener('click', function () { input.value = p; runSearch(); input.focus(); });
      chips.appendChild(b);
    });
    wrap.appendChild(chips);
    var recent = getRecent();
    if (recent.length) {
      wrap.appendChild(el('p', 'ss-empty-title', 'Recent'));
      var rc = el('div', 'ss-chips');
      recent.forEach(function (p) {
        var b = el('button', 'ss-chip ss-chip-recent', p);
        b.type = 'button';
        b.addEventListener('click', function () { input.value = p; runSearch(); input.focus(); });
        rc.appendChild(b);
      });
      wrap.appendChild(rc);
    }
    list.appendChild(wrap);
    setStatus('Type to search every page of the site.');
  }

  function renderNoResults(q) {
    list.innerHTML = '';
    var wrap = el('div', 'ss-empty');
    wrap.appendChild(el('p', 'ss-empty-title', 'No matches for “' + q + '”'));
    wrap.appendChild(el('p', 'ss-empty-body', 'Try a treatment name, a symptom, or a word like pricing or HSA. Katherine can also answer questions directly.'));
    var row = el('div', 'ss-actions');
    var call = el('a', 'ss-btn ss-btn-primary', 'Call ' + PHONE); call.href = 'tel:+15747351528';
    var book = el('a', 'ss-btn', 'Book appointment'); book.href = 'https://belleallurefacialaesthetics.myaestheticrecord.com/online-booking/book-appointment';
    row.appendChild(call); row.appendChild(book);
    wrap.appendChild(row);
    list.appendChild(wrap);
    setStatus('No matches found.');
  }

  function renderResults(q, items) {
    list.innerHTML = '';
    results = items;
    activeIndex = -1;
    var qt = tokens(q);
    items.forEach(function (e, i) {
      var a = el('a', 'ss-result');
      a.href = e.url + (e.anchor ? '#' + e.anchor : '');
      a.id = 'ss-opt-' + i;
      a.setAttribute('role', 'option');
      a.setAttribute('aria-selected', 'false');
      a.tabIndex = -1;
      var top = el('div', 'ss-result-top');
      top.appendChild(el('span', 'ss-kind', e.kind));
      top.appendChild(el('span', 'ss-page', e.page));
      a.appendChild(top);
      var h = el('div', 'ss-result-title');
      h.appendChild(highlightFragment(e.heading, qt));
      a.appendChild(h);
      if (e.text && e.text !== e.heading) {
        var p = el('div', 'ss-result-snippet');
        p.appendChild(highlightFragment(snippet(e.text, qt), qt));
        a.appendChild(p);
      }
      a.appendChild(el('div', 'ss-result-url', prettyUrl(e.url)));
      a.addEventListener('mouseenter', function () { setActive(i, false); });
      list.appendChild(a);
    });
    setStatus(items.length + (items.length === 1 ? ' result' : ' results') + ' for “' + q + '”');
  }

  function setActive(i, scroll) {
    var opts = list.querySelectorAll('[role="option"]');
    if (!opts.length) { input.removeAttribute('aria-activedescendant'); activeIndex = -1; return; }
    if (i < 0) i = opts.length - 1;
    if (i >= opts.length) i = 0;
    opts.forEach(function (o, k) { o.setAttribute('aria-selected', k === i ? 'true' : 'false'); o.classList.toggle('is-active', k === i); });
    activeIndex = i;
    input.setAttribute('aria-activedescendant', opts[i].id);
    if (scroll) opts[i].scrollIntoView({ block: 'nearest' });
  }

  function prettyUrl(u) {
    if (u === '/index.html') return '/';
    return u.replace(/\.html$/, '');
  }

  function setStatus(msg) { if (status) status.textContent = msg; }

  function getRecent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').slice(0, 5); } catch (e) { return []; }
  }
  function saveRecent(q) {
    try {
      var r = getRecent().filter(function (x) { return x.toLowerCase() !== q.toLowerCase(); });
      r.unshift(q);
      localStorage.setItem(RECENT_KEY, JSON.stringify(r.slice(0, 5)));
    } catch (e) { /* storage unavailable: search still works */ }
  }

  function runSearch() {
    var q = input.value.trim();
    lastQuery = q;
    if (!q) { results = []; renderEmpty(); return; }
    loadIndex().then(function () {
      if (input.value.trim() !== q) return;
      var items = search(q);
      if (items.length) renderResults(q, items); else renderNoResults(q);
    }).catch(function () { setStatus('Search is unavailable right now. Call ' + PHONE + ' for help.'); });
  }

  function buildDialog() {
    dialog = el('div', 'ss-overlay');
    dialog.hidden = true;
    panel = el('div', 'ss-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'ss-title');
    var head = el('div', 'ss-head');
    var title = el('h2', 'ss-title', 'Search Belle Allure');
    title.id = 'ss-title';
    var close = el('button', 'ss-close', 'Close');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close search');
    close.addEventListener('click', closeSearch);
    head.appendChild(title); head.appendChild(close);
    panel.appendChild(head);

    var field = el('div', 'ss-field');
    var icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24'); icon.setAttribute('width', '20'); icon.setAttribute('height', '20'); icon.setAttribute('aria-hidden', 'true'); icon.setAttribute('focusable', 'false');
    icon.innerHTML = '<circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
    field.appendChild(icon);
    input = el('input', 'ss-input');
    input.type = 'search';
    input.placeholder = 'Search treatments, pricing, questions';
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'true');
    input.setAttribute('aria-controls', 'ss-results');
    input.setAttribute('aria-label', 'Search the site');
    input.autocomplete = 'off';
    input.spellcheck = false;
    field.appendChild(input);
    panel.appendChild(field);

    status = el('p', 'ss-status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    panel.appendChild(status);

    list = el('div', 'ss-results');
    list.id = 'ss-results';
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', 'Search results');
    panel.appendChild(list);

    var foot = el('p', 'ss-foot');
    foot.innerHTML = 'Press <kbd>↑</kbd> <kbd>↓</kbd> to move, <kbd>Enter</kbd> to open, <kbd>Esc</kbd> to close.';
    panel.appendChild(foot);

    dialog.appendChild(panel);
    document.body.appendChild(dialog);

    var debounce = null;
    input.addEventListener('input', function () {
      clearTimeout(debounce);
      debounce = setTimeout(runSearch, 120);
    });
    input.addEventListener('keydown', function (ev) {
      var opts = list.querySelectorAll('[role="option"]');
      if (ev.key === 'ArrowDown') { ev.preventDefault(); if (opts.length) setActive(activeIndex + 1, true); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); if (opts.length) setActive(activeIndex - 1, true); }
      else if (ev.key === 'Enter') {
        var target = opts[activeIndex] || opts[0];
        if (target) {
          ev.preventDefault();
          saveRecent(input.value.trim());
          window.location.href = target.getAttribute('href');
        }
      } else if (ev.key === 'Escape') { ev.preventDefault(); closeSearch(); }
    });
    dialog.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Tab') return;
      var f = panel.querySelectorAll('input, button, a[href]');
      var visible = [].filter.call(f, function (n) { return n.offsetParent !== null; });
      if (!visible.length) return;
      var first = visible[0], last = visible[visible.length - 1];
      if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
      else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
    });
    dialog.addEventListener('mousedown', function (ev) { if (ev.target === dialog) closeSearch(); });
  }

  function openSearch(trigger) {
    if (!dialog) buildDialog();
    lastFocus = trigger || document.activeElement;
    dialog.hidden = false;
    document.documentElement.classList.add('ss-open');
    document.body.style.overflow = 'hidden';
    input.value = lastQuery || '';
    renderEmpty();
    if (input.value) runSearch();
    loadIndex().catch(function () {});
    setTimeout(function () { input.focus(); }, 20);
  }

  function closeSearch() {
    if (!dialog || dialog.hidden) return;
    dialog.hidden = true;
    document.documentElement.classList.remove('ss-open');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function init() {
    var btns = document.querySelectorAll('.site-search-btn');
    btns.forEach(function (b) { b.addEventListener('click', function () { openSearch(b); }); });
    document.addEventListener('keydown', function (ev) {
      var typing = /input|textarea|select/i.test((document.activeElement || {}).tagName || '') || (document.activeElement && document.activeElement.isContentEditable);
      if ((ev.key === '/' && !typing && !ev.ctrlKey && !ev.metaKey) || ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k')) {
        if (dialog && !dialog.hidden) return;
        ev.preventDefault();
        openSearch(document.activeElement);
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
