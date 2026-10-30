/*
 * Little Wisdom — application logic.
 * Hash-routed single page:
 *   #/                      home
 *   #/library?cat=&tag=&q=  search + filters (state lives in the URL)
 *   #/quote/q07?cat=life    one quote; the optional query is the browsing context
 *   #/bookmarks
 * Every view renders from the same QUOTES records. All text is inserted with
 * textContent/createTextNode; innerHTML is used only for our own static SVG.
 */
(function () {
  'use strict';

  const app = document.getElementById('app');
  const main = document.getElementById('main');

  /* ---------- Fail visibly if the data did not load ---------- */
  if (!Array.isArray(window.QUOTES) || !window.QUOTES.length || !window.sceneElement) {
    app.textContent = 'Sorry, the quotes could not be loaded. Please refresh the page.';
    app.style.cssText = 'padding:4rem 1.25rem;text-align:center';
    return;
  }

  const QUOTES = window.QUOTES.filter(function (q) { return q.published; });
  const CATEGORIES = window.CATEGORIES;
  const byId = new Map(QUOTES.map(function (q) { return [q.id, q]; }));
  const catName = function (id) { const c = CATEGORIES.find(function (k) { return k.id === id; }); return c ? c.name : id; };
  const pad = function (n) { return String(n).padStart(2, '0'); };

  /* ---------- Tiny DOM helper ---------- */
  function h(tag, attrs) {
    const el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      const v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    Array.prototype.slice.call(arguments, 2).flat(Infinity).forEach(function (kid) {
      if (kid === null || kid === undefined || kid === false) return;
      el.append(kid.nodeType ? kid : document.createTextNode(kid));
    });
    return el;
  }

  const ICONS = {
    bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12v18l-6-4.500L6 21z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.500-3.500"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    shuffle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>'
  };
  function icon(name) { const s = document.createElement('span'); s.style.display = 'contents'; s.innerHTML = ICONS[name]; return s; }

  /** Only http(s) links are allowed as sources; anything else (e.g. javascript:) is dropped. */
  function safeUrl(value) {
    try {
      const u = new URL(value);
      return (u.protocol === 'https:' || u.protocol === 'http:') ? u.href : '';
    } catch (e) { return ''; }
  }

  /* ---------- Bookmarks: in-memory Set, written through to localStorage ---------- */
  const STORE_KEY = 'littlewisdom.bookmarks.v1';
  const bookmarks = (function () {
    let ids = [];
    function load() {
      try {
        const arr = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
        ids = Array.isArray(arr) ? arr.filter(function (id) { return byId.has(id); }) : [];
      } catch (e) { /* storage unavailable or corrupt: keep what we have in memory */ }
    }
    load();
    return {
      reload: load,
      list: function () { return ids.slice(); },
      has: function (id) { return ids.indexOf(id) !== -1; },
      toggle: function (id) {
        const i = ids.indexOf(id);
        if (i === -1) ids.push(id); else ids.splice(i, 1);
        let persisted = true;
        try { localStorage.setItem(STORE_KEY, JSON.stringify(ids)); } catch (e) { persisted = false; }
        return { saved: i === -1, persisted: persisted };
      }
    };
  })();

  /* ---------- Feedback ---------- */
  let toastTimer;
  function toast(message) {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-visible'); }, 2400);
  }

  function updateBookmarkCount() {
    const n = bookmarks.list().length;
    const badge = document.getElementById('bookmark-count');
    badge.textContent = String(n);
    badge.setAttribute('aria-label', n + (n === 1 ? ' saved quote' : ' saved quotes'));
  }

  function syncBookmarkButtons(id) {
    const saved = bookmarks.has(id);
    document.querySelectorAll('[data-bookmark="' + id + '"]').forEach(function (btn) {
      btn.setAttribute('data-saved', String(saved));
      if (btn.hasAttribute('aria-pressed')) btn.setAttribute('aria-pressed', String(saved));
      const label = btn.querySelector('.btn-label');
      if (label) label.textContent = saved ? 'Remove bookmark' : 'Save quote';
      if (btn.title) btn.title = saved ? 'Remove bookmark' : 'Save quote';
    });
  }

  function onBookmark(id) {
    const result = bookmarks.toggle(id);
    updateBookmarkCount();
    syncBookmarkButtons(id);
    toast(result.persisted
      ? (result.saved ? 'Saved to bookmarks.' : 'Removed from bookmarks.')
      : 'Saved for this visit only. Your browser blocked storage.');
    if (currentRoute.name === 'bookmarks' && !result.saved) renderRoute(true);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      const ta = h('textarea', { 'aria-hidden': 'true', tabindex: '-1', style: 'position:fixed;opacity:0;top:0' });
      ta.value = text;
      document.body.append(ta);
      ta.select();
      try { document.execCommand('copy') ? resolve() : reject(new Error('copy failed')); }
      catch (e) { reject(e); } finally { ta.remove(); }
    });
  }

  function onCopy(id) {
    copyText(byId.get(id).text).then(
      function () { toast('Quote copied.'); },
      function () { toast('Could not copy. Select the text and copy it manually.'); }
    );
  }

  /* ---------- Browsing context (which list Next/Previous walks through) ---------- */
  const FILTER_KEYS = ['cat', 'tag', 'q', 'author'];

  /** Active filters -> query string such as "cat=life&q=focus" (empty when unfiltered). */
  function filterQuery(f) {
    const p = new URLSearchParams();
    FILTER_KEYS.forEach(function (k) { if (f[k]) p.set(k, f[k]); });
    return p.toString();
  }

  function quoteHref(id, ctx) { return '#/quote/' + id + (ctx ? '?' + ctx : ''); }

  /**
   * Resolves the list a quote page steps through, from the URL's query.
   * Returns the list, a human label (null = whole collection) and where "back" goes.
   */
  function resolveContext(params, quote) {
    const whole = { list: QUOTES, label: null, query: '', back: '#/library', backLabel: 'Back to collection' };
    let ctx = whole;
    if (params.saved === '1') {
      ctx = { list: bookmarks.list().map(function (id) { return byId.get(id); }), label: 'your bookmarks', query: 'saved=1', back: '#/bookmarks', backLabel: 'Back to bookmarks' };
    } else {
      const f = {};
      FILTER_KEYS.forEach(function (k) { if (params[k]) f[k] = params[k]; });
      const query = filterQuery(f);
      if (query) {
        const bits = [];
        if (f.cat) bits.push(catName(f.cat));
        if (f.tag) bits.push('#' + f.tag);
        if (f.q) bits.push('“' + f.q + '”');
        if (f.author) bits.push(f.author);
        ctx = { list: filterQuotes(f), label: bits.join(' · '), query: query, back: '#/library?' + query, backLabel: 'Back to results' };
      }
    }
    // If the quote is not in that list (e.g. bookmark removed, stale link), fall back to the whole collection.
    return ctx.list.indexOf(quote) === -1 ? whole : ctx;
  }

  /* ---------- Quote presentation ---------- */
  function lengthClass(q) {
    const n = q.text.length;
    return n <= 48 ? 'len-short' : n <= 125 ? 'len-medium' : 'len-long';
  }

  /** Icon-only bookmark toggle used on cards (tooltip + constant accessible name + aria-pressed). */
  function bookmarkIconButton(q) {
    const saved = bookmarks.has(q.id);
    const btn = h('button', {
      type: 'button', class: 'icon-btn', 'data-bookmark': q.id, 'data-saved': String(saved),
      'aria-pressed': String(saved), 'aria-label': 'Bookmark: ' + q.title, title: saved ? 'Remove bookmark' : 'Save quote',
      onclick: function () { onBookmark(q.id); }
    });
    btn.innerHTML = ICONS.bookmark;
    return btn;
  }

  /** Labelled bookmark button: the visible text itself says what will happen. */
  function bookmarkTextButton(q, extraClass) {
    const saved = bookmarks.has(q.id);
    return h('button', {
      type: 'button', class: 'btn ' + (extraClass || ''), 'data-bookmark': q.id, 'data-saved': String(saved),
      onclick: function () { onBookmark(q.id); }
    }, icon('bookmark'), h('span', { class: 'btn-label' }, saved ? 'Remove bookmark' : 'Save quote'));
  }

  /** Card styles rotate through manga panel / typography-only / notebook. */
  function quoteCard(q, ctx) {
    const variant = ['panel', 'type', 'note'][(q.number - 1) % 3];
    const body = h('div', { class: 'qcard__body' },
      h('p', { class: 'qcard__no' }, pad(q.number)),
      h('p', { class: 'qcard__title' }, q.title),
      h('blockquote', { class: 'q-text', style: 'margin:0' }, q.text),
      h('div', { class: 'qcard__meta' }, q.categories.slice(0, 2).map(function (c) { return h('span', { class: 'chip' }, catName(c)); })),
      h('p', { class: 'qcard__cta' }, 'Read quote ', icon('next'))
    );
    const link = h('a', { class: 'qcard__link', href: quoteHref(q.id, ctx) },
      variant === 'panel' ? window.sceneElement(q.image, { decorative: true }) : null, body);
    return h('article', { class: 'qcard qcard--' + variant + ' ' + lengthClass(q) }, link, bookmarkIconButton(q));
  }

  function cardGrid(list, ctx) {
    return h('div', { class: 'card-grid' }, list.map(function (q) { return quoteCard(q, ctx); }));
  }

  /* ---------- Search & filter ---------- */
  const normalize = function (s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  const hasSources = QUOTES.some(function (q) { return q.author; });
  const allTags = Array.from(new Set(QUOTES.flatMap(function (q) { return q.tags; }))).sort();
  const allAuthors = Array.from(new Set(QUOTES.map(function (q) { return q.author; }).filter(Boolean))).sort();
  // Search text is built once per quote instead of on every keystroke.
  const haystack = new Map(QUOTES.map(function (q) {
    return [q.id, normalize([q.title, q.text, q.author, q.tags.join(' '), q.categories.map(catName).join(' ')].join(' '))];
  }));

  function filterQuotes(f) {
    const terms = normalize(f.q || '').split(/\s+/).filter(Boolean);
    return QUOTES.filter(function (q) {
      if (f.cat && q.categories.indexOf(f.cat) === -1) return false;
      if (f.tag && q.tags.indexOf(f.tag) === -1) return false;
      if (f.author && q.author !== f.author) return false;
      return terms.every(function (t) { return haystack.get(q.id).indexOf(t) !== -1; });
    });
  }

  /* ---------- Shared pieces ---------- */
  function emptyState(title, message, actions, scene) {
    return h('div', { class: 'empty' },
      window.sceneElement(scene || 'rain', { decorative: true }),
      h('h2', {}, title), h('p', {}, message), actions);
  }

  function goRandom() {
    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    location.hash = quoteHref(q.id);
  }

  /** One quote per calendar day (local time), chosen from the short, hero-worthy ones. */
  function quoteOfTheDay() {
    const pool = QUOTES.filter(function (q) { return q.text.length <= 160; });
    const d = new Date();
    const dayNumber = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
    return pool[dayNumber % pool.length].id;
  }

  /* ---------- Views ---------- */
  let featuredId = quoteOfTheDay();
  let featuredIsDaily = true;

  function homeView() {
    const featuredHost = h('section', { class: 'section', 'aria-labelledby': 'featured-h' });
    function paintFeatured() {
      const q = byId.get(featuredId);
      featuredHost.replaceChildren(
        h('div', { class: 'wrap featured' },
          h('div', { class: 'panel' }, window.sceneElement(q.image, { decorative: false })),
          h('div', { class: 'featured-text ' + lengthClass(q) },
            h('p', { class: 'kicker', id: 'featured-h' }, (featuredIsDaily ? 'Quote of the day' : 'Featured quote') + ' · No. ' + pad(q.number)),
            h('blockquote', { style: 'margin:0' }, h('p', { class: 'q-text', style: 'margin-top:1rem' }, q.text)),
            h('p', { class: 'kicker', style: 'margin:1.25rem 0 1.5rem' }, q.title),
            h('div', { class: 'featured-actions' },
              h('a', { class: 'btn', href: quoteHref(q.id) }, 'Read quote ', icon('next')),
              bookmarkTextButton(q, 'btn--ghost'),
              h('button', {
                class: 'btn btn--ghost', type: 'button',
                onclick: function () {
                  const others = QUOTES.filter(function (x) { return x.id !== featuredId && x.text.length < 160; });
                  featuredId = others[Math.floor(Math.random() * others.length)].id;
                  featuredIsDaily = false;
                  paintFeatured();
                }
              }, icon('shuffle'), 'Show another')
            )
          )
        )
      );
    }
    paintFeatured();

    const selected = ['q07', 'q08', 'q14', 'q17', 'q21', 'q28', 'q34', 'q45', 'q52'].map(function (id) { return byId.get(id); }).filter(Boolean);
    const shortest = QUOTES.slice().sort(function (a, b) { return a.text.length - b.text.length; }).slice(0, 5);
    const longest = QUOTES.slice().sort(function (a, b) { return b.text.length - a.text.length; }).slice(0, 5);
    const beginning = QUOTES.slice(0, 5);

    const list = function (items) {
      return h('ul', {}, items.map(function (q) {
        return h('li', {}, h('a', { href: quoteHref(q.id) },
          h('span', { class: 'd-title' }, pad(q.number) + ' · ' + q.title),
          h('span', { class: 'd-excerpt' }, q.text.replace(/\n+/g, ' '))));
      }));
    };

    return h('div', {},
      h('section', { class: 'hero' },
        h('div', { class: 'wrap hero-grid' },
          h('div', {},
            h('p', { class: 'hand' }, 'a small illustrated magazine'),
            h('h1', {}, 'Little ', h('em', {}, 'Wisdom')),
            h('p', { class: 'hero-lede' }, 'Meaningful ideas for a life of curiosity, clarity, and purpose.'),
            h('div', { class: 'hero-actions' },
              h('a', { class: 'btn', href: quoteHref(QUOTES[0].id) }, 'Start with quote 01 ', icon('next')),
              h('a', { class: 'btn btn--ghost', href: '#/library' }, 'Browse all ' + QUOTES.length + ' quotes'))
          ),
          h('div', { class: 'collage-wrap' },
            h('span', { class: 'bubble', 'aria-hidden': 'true' }, 'read slowly…'),
            h('div', { class: 'collage', role: 'group', 'aria-label': 'Illustrations: rain at a window, a sunset train ride, a quiet desk' },
              h('div', { class: 'cell cell--tall' }, window.sceneElement('rain', { decorative: true })),
              h('div', { class: 'cell' }, window.sceneElement('train', { decorative: true })),
              h('div', { class: 'cell' }, window.sceneElement('desk', { decorative: true }))
            )
          )
        )
      ),
      featuredHost,
      h('section', { class: 'section', 'aria-labelledby': 'cats-h' },
        h('div', { class: 'wrap' },
          h('div', { class: 'section-head' },
            h('h2', { id: 'cats-h' }, 'Browse by theme'),
            h('p', {}, 'Seven themes. Pick one to see its quotes.')),
          h('div', { class: 'cat-grid' }, CATEGORIES.map(function (c, i) {
            const count = QUOTES.filter(function (q) { return q.categories.indexOf(c.id) !== -1; }).length;
            return h('a', { class: 'cat-link', href: '#/library?cat=' + c.id },
              h('span', { class: 'num' }, pad(i + 1) + ' · ' + count + ' quotes'),
              h('h3', {}, c.name), h('p', {}, c.blurb));
          }))
        )
      ),
      h('section', { class: 'section', 'aria-labelledby': 'sel-h' },
        h('div', { class: 'wrap' },
          h('div', { class: 'section-head' },
            h('h2', { id: 'sel-h' }, 'Selected quotes'),
            h('a', { class: 'btn btn--ghost btn--small', href: '#/library' }, 'Browse all ' + QUOTES.length + ' quotes ', icon('next'))),
          cardGrid(selected))
      ),
      h('section', { class: 'section', 'aria-labelledby': 'disc-h' },
        h('div', { class: 'wrap' },
          h('div', { class: 'section-head' },
            h('h2', { id: 'disc-h' }, 'Keep reading'),
            h('button', { class: 'btn btn--ghost btn--small', type: 'button', onclick: goRandom }, icon('shuffle'), 'Open a random quote')),
          h('div', { class: 'discover' },
            h('div', {}, h('h3', {}, 'Start at the beginning'), list(beginning)),
            h('div', {}, h('h3', {}, 'Quick reads'), list(shortest)),
            h('div', {}, h('h3', {}, 'Longer reflections'), list(longest))))
      )
    );
  }

  const libraryState = { q: '', cat: '', tag: '', author: '' };

  function libraryView(params) {
    // Filters come from the URL, so refresh, Back and shared links all restore them.
    libraryState.cat = CATEGORIES.some(function (c) { return c.id === params.cat; }) ? params.cat : '';
    libraryState.tag = allTags.indexOf(params.tag) !== -1 ? params.tag : '';
    libraryState.author = allAuthors.indexOf(params.author) !== -1 ? params.author : '';
    libraryState.q = params.q || '';

    const results = h('div', { id: 'results' });
    const count = h('p', { class: 'result-count', 'aria-live': 'polite' });
    const input = h('input', {
      id: 'search', type: 'search', placeholder: 'Search by title, text, or topic', autocomplete: 'off',
      oninput: function () { libraryState.q = input.value; paint(); }
    });
    input.value = libraryState.q;

    const chips = h('div', { class: 'filter-row', role: 'group', 'aria-label': 'Filter by theme' });
    const tagSelect = h('select', { id: 'tag', onchange: function () { libraryState.tag = tagSelect.value; paint(); } },
      h('option', { value: '' }, 'All tags'),
      allTags.map(function (t) { return h('option', { value: t }, t); }));
    tagSelect.value = libraryState.tag;
    const authorSelect = hasSources ? h('select', { id: 'author', onchange: function () { libraryState.author = authorSelect.value; paint(); } },
      h('option', { value: '' }, 'All sources'),
      allAuthors.map(function (a) { return h('option', { value: a }, a); })) : null;
    if (authorSelect) authorSelect.value = libraryState.author;

    const clear = h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: function () {
      libraryState.q = libraryState.cat = libraryState.tag = libraryState.author = '';
      input.value = ''; tagSelect.value = ''; if (authorSelect) authorSelect.value = '';
      paint(); input.focus();
    } }, 'Clear filters');

    function paintChips() {
      chips.replaceChildren.apply(chips, [{ id: '', name: 'All themes' }].concat(CATEGORIES).map(function (c) {
        return h('button', {
          type: 'button', class: 'pill', 'aria-pressed': String(libraryState.cat === c.id),
          onclick: function () { libraryState.cat = c.id; paint(); }
        }, c.name);
      }));
    }

    function paint() {
      paintChips();
      const list = filterQuotes(libraryState);
      const query = filterQuery(libraryState);
      clear.hidden = !query;
      // Keep the URL in sync without adding history entries or re-rendering.
      try { history.replaceState(null, '', '#/library' + (query ? '?' + query : '')); } catch (e) { /* e.g. sandboxed frame */ }
      count.textContent = !query
        ? 'Showing all ' + QUOTES.length + ' quotes'
        : list.length + (list.length === 1 ? ' quote found' : ' quotes found');
      results.replaceChildren(list.length ? cardGrid(list, query) : emptyState(
        'No quotes found',
        'Try another word, or choose a different theme.',
        h('button', { class: 'btn', type: 'button', onclick: function () { clear.click(); } }, 'Clear filters')));
    }

    const view = h('div', { class: 'wrap' },
      h('div', { class: 'page-head' },
        h('h1', {}, 'All quotes'),
        h('p', {}, 'Search by title, text, or topic, or filter by theme. Open any quote to keep reading from there.')),
      h('div', { class: 'filters' },
        h('div', { class: 'search-field' },
          h('label', { class: 'visually-hidden', for: 'search' }, 'Search quotes'), icon('search'), input),
        chips,
        h('div', { class: 'filter-row' },
          h('label', { class: 'select-wrap', for: 'tag' }, 'Tag', tagSelect),
          authorSelect ? h('label', { class: 'select-wrap', for: 'author' }, 'Source', authorSelect) : null,
          clear, count)),
      results);
    paint();
    if (params.focus === '1') setTimeout(function () { input.focus(); }, 0);
    return view;
  }

  function related(q) {
    return QUOTES.filter(function (x) { return x.id !== q.id; }).map(function (x) {
      const score = x.categories.filter(function (c) { return q.categories.indexOf(c) !== -1; }).length * 2 +
        x.tags.filter(function (t) { return q.tags.indexOf(t) !== -1; }).length * 3;
      return { quote: x, score: score };
    }).filter(function (r) { return r.score > 0; })
      .sort(function (a, b) { return b.score - a.score || a.quote.number - b.quote.number; })
      .slice(0, 3).map(function (r) { return r.quote; });
  }

  // Targets for the arrow-key shortcuts on the quote page.
  let activeStep = { prev: null, next: null };

  function stepControl(kind, target, ctx, variant) {
    const isNext = kind === 'next';
    const text = isNext ? 'Next quote' : 'Previous quote';
    const content = variant === 'large'
      ? [h('span', { class: 'step-dir' }, isNext ? null : icon('prev'), text, isNext ? icon('next') : null),
         target ? h('span', { class: 'step-title' }, pad(target.number) + ' · ' + target.title) : null]
      : [isNext ? null : icon('prev'), text, isNext ? icon('next') : null];
    const cls = (variant === 'large' ? 'step step--' : 'btn btn--small step-btn step-btn--') + kind;
    if (!target) {
      return h('span', { class: cls + ' is-disabled', 'aria-disabled': 'true' }, content);
    }
    return h('a', { class: cls, href: quoteHref(target.id, ctx.query), rel: kind === 'next' ? 'next' : 'prev' }, content);
  }

  function quoteView(id, params) {
    const q = byId.get(id);
    if (!q) return notFoundView();
    const ctx = resolveContext(params, q);
    const i = ctx.list.indexOf(q);
    const prev = ctx.list[i - 1] || null, next = ctx.list[i + 1] || null;
    activeStep = { prev: prev && quoteHref(prev.id, ctx.query), next: next && quoteHref(next.id, ctx.query) };
    const rel = related(q);
    const filtered = ctx.label !== null;
    const position = filtered
      ? (i + 1) + ' of ' + ctx.list.length + ' in ' + ctx.label
      : 'Quote ' + q.number + ' of ' + QUOTES.length;

    const positionLine = h('p', { class: 'position' }, position,
      filtered ? [' · ', h('a', { href: quoteHref(q.id) }, 'Browse all ' + QUOTES.length + ' instead')] : null);

    const endNote = !next
      ? h('p', { class: 'end-note' }, filtered ? 'That was the last quote in ' + ctx.label + '. ' : 'You have reached the last quote. ',
          h('a', { href: filtered ? ctx.back : quoteHref(QUOTES[0].id) }, filtered ? ctx.backLabel : 'Start again from quote 01'))
      : !prev
        ? h('p', { class: 'end-note' }, filtered ? 'This is the first quote in ' + ctx.label + '.' : 'This is the first quote.')
        : null;

    return h('div', { class: 'wrap reader' },
      h('nav', { class: 'quote-bar', 'aria-label': 'Quote navigation' },
        h('a', { class: 'back-link', href: ctx.back }, icon('prev'), ctx.backLabel),
        h('div', { class: 'quote-bar__steps' }, stepControl('prev', prev, ctx, 'compact'), stepControl('next', next, ctx, 'compact'))),
      h('p', { class: 'position position--top' }, position,
        filtered ? [' · ', h('a', { href: quoteHref(q.id) }, 'Browse all ' + QUOTES.length + ' instead')] : null),
      h('div', { class: 'reader-grid' },
        h('div', { class: 'panel' }, window.sceneElement(q.image, { decorative: false })),
        h('article', { class: lengthClass(q) },
          h('p', { class: 'kicker' }, 'No. ' + pad(q.number) + ' · ' + q.categories.map(catName).join(' · ')),
          h('h1', { class: 'reader-title', tabindex: '-1' }, q.title),
          h('blockquote', {}, h('p', { class: 'q-text' }, q.text)),
          (q.author || safeUrl(q.sourceUrl)) ? h('p', { class: 'reader-source' }, 'Source: ',
            safeUrl(q.sourceUrl) ? h('a', { href: safeUrl(q.sourceUrl), rel: 'noopener noreferrer' }, q.author || safeUrl(q.sourceUrl)) : q.author) : null,
          h('div', { class: 'reader-tags' }, q.tags.map(function (t) {
            return h('a', { class: 'chip', href: '#/library?tag=' + encodeURIComponent(t), 'aria-label': 'Show quotes tagged ' + t }, '#' + t);
          })),
          h('div', { class: 'reader-actions' },
            bookmarkTextButton(q),
            h('button', { class: 'btn btn--ghost', type: 'button', onclick: function () { onCopy(q.id); } }, icon('copy'), 'Copy quote'))
        )
      ),
      h('section', { class: 'continue', 'aria-labelledby': 'cont-h' },
        h('h2', { id: 'cont-h' }, 'Continue reading'),
        positionLine,
        h('div', { class: 'continue__steps' }, stepControl('prev', prev, ctx, 'large'), stepControl('next', next, ctx, 'large')),
        endNote,
        h('p', { class: 'hint' }, 'Tip: press the ← and → keys to move between quotes.')),
      rel.length ? h('section', { class: 'related', 'aria-labelledby': 'rel-h' }, h('h2', { id: 'rel-h' }, 'You might also like'), cardGrid(rel)) : null
    );
  }

  function bookmarksView() {
    const saved = bookmarks.list().map(function (id) { return byId.get(id); });
    return h('div', { class: 'wrap' },
      h('div', { class: 'page-head' },
        h('h1', {}, 'Your bookmarks'),
        h('p', {}, 'Quotes you saved on this device. They stay in this browser and do not sync to other browsers or devices.')),
      saved.length ? cardGrid(saved, 'saved=1') : emptyState(
        'You haven’t saved any quotes yet',
        'Choose “Save quote” on any quote and it will wait for you here.',
        h('a', { class: 'btn', href: '#/library' }, 'Browse all quotes'), 'desk')
    );
  }

  function notFoundView() {
    activeStep = { prev: null, next: null };
    return h('div', { class: 'wrap' }, emptyState('We couldn’t find that page',
      'The quote or page you asked for does not exist.', h('a', { class: 'btn', href: '#/library' }, 'Browse all quotes'), 'night'));
  }

  /* ---------- Router ---------- */
  let currentRoute = { name: 'home' };

  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, '');
    const parts = raw.split('?');
    const segs = parts[0].split('/').filter(Boolean);
    const params = {};
    new URLSearchParams(parts[1] || '').forEach(function (v, k) { params[k] = v; });
    if (!segs.length) return { name: 'home', params: params };
    if (segs[0] === 'library') return { name: 'library', params: params };
    if (segs[0] === 'bookmarks') return { name: 'bookmarks', params: params };
    if (segs[0] === 'quote' && segs[1]) {
      let id = segs[1];
      try { id = decodeURIComponent(id); } catch (e) { /* keep raw */ }
      return { name: 'quote', id: id, params: params };
    }
    return { name: 'notfound', params: params };
  }

  function renderRoute(keepScroll) {
    currentRoute = parseHash();
    activeStep = { prev: null, next: null };
    let view, title = 'Little Wisdom';
    switch (currentRoute.name) {
      case 'home': view = homeView(); break;
      case 'library': view = libraryView(currentRoute.params); title = 'All quotes · Little Wisdom'; break;
      case 'bookmarks': view = bookmarksView(); title = 'Your bookmarks · Little Wisdom'; break;
      case 'quote': {
        view = quoteView(currentRoute.id, currentRoute.params);
        const q = byId.get(currentRoute.id);
        title = q ? q.title + ' · Little Wisdom' : 'Not found · Little Wisdom';
        break;
      }
      default: view = notFoundView(); title = 'Not found · Little Wisdom';
    }
    app.replaceChildren(view);
    document.title = title;
    document.querySelectorAll('[data-nav]').forEach(function (a) {
      if (a.getAttribute('data-nav') === currentRoute.name) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    if (!keepScroll) {
      window.scrollTo(0, 0);
      // Move focus to the new page's heading so keyboard and screen-reader users start at the top.
      const heading = currentRoute.name === 'quote' ? app.querySelector('h1[tabindex="-1"]') : null;
      (heading || main).focus({ preventScroll: true });
    }
  }

  window.addEventListener('hashchange', function () { renderRoute(false); });

  // Left/Right arrows step through quotes, except while typing or with a modifier key held.
  document.addEventListener('keydown', function (e) {
    if (currentRoute.name !== 'quote' || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    const href = e.key === 'ArrowRight' ? activeStep.next : activeStep.prev;
    if (href) { e.preventDefault(); location.hash = href; }
  });

  // Keep bookmarks in sync if another tab changes them.
  window.addEventListener('storage', function (e) {
    if (e.key !== STORE_KEY) return;
    bookmarks.reload();
    updateBookmarkCount();
    if (currentRoute.name === 'bookmarks') renderRoute(true);
  });

  updateBookmarkCount();
  renderRoute(true);
})();
