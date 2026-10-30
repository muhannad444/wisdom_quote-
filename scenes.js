/*
 * Little Wisdom — original illustration scenes, drawn as inline SVG.
 * Seven quiet, anime-inspired vignettes in the site palette. No external
 * images, so there are no broken links, and every scene scales cleanly.
 */
(function (root) {
  'use strict';

  const C = {
    cream: '#f6efe2', paper: '#efe5d0', ink: '#2b211c', sage: '#9aae93',
    blue: '#8ea6bd', deep: '#4d6178', pink: '#e5b9b3', taupe: '#a39384',
    glow: '#f0c987', wood: '#c9b79a'
  };

  const rainLines = (x0, y0, x1, y1, n) => {
    let d = '';
    for (let i = 0; i < n; i++) {
      const x = x0 + ((i * 53) % (x1 - x0));
      const y = y0 + ((i * 37) % (y1 - y0 - 24));
      d += `M${x} ${y}l-5 18`;
    }
    return `<path d="${d}" stroke="#dfe8f0" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`;
  };

  const SCENES = {
    rain: {
      alt: 'Rain falling outside a quiet bedroom window, a warm lamp glowing on the sill.',
      svg: (id) => `
        <defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.deep}"/><stop offset="1" stop-color="#a9b9c8"/></linearGradient>
        <radialGradient id="${id}l"><stop offset="0" stop-color="${C.glow}" stop-opacity=".9"/><stop offset="1" stop-color="${C.glow}" stop-opacity="0"/></radialGradient></defs>
        <rect width="600" height="400" fill="${C.paper}"/>
        <rect x="150" y="36" width="300" height="258" fill="url(#${id}g)"/>
        ${rainLines(150, 36, 450, 294, 34)}
        <path d="M150 36h300v258H150zM300 36v258M150 165h300" fill="none" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
        <rect x="124" y="294" width="352" height="22" fill="${C.wood}" stroke="${C.ink}" stroke-width="4"/>
        <circle cx="90" cy="300" r="90" fill="url(#${id}l)"/>
        <path d="M70 294h40l-8-44h-24z" fill="${C.pink}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M90 294v22" stroke="${C.ink}" stroke-width="4"/>
        <path d="M380 294v-26h34v26z" fill="${C.cream}" stroke="${C.ink}" stroke-width="4"/>
        <path d="M390 258c-6-8 6-12 0-20M402 258c-6-8 6-12 0-20" fill="none" stroke="${C.cream}" stroke-width="3" stroke-linecap="round" opacity=".85"/>
        <rect x="0" y="316" width="600" height="84" fill="${C.taupe}" opacity=".35"/>`
    },

    train: {
      alt: 'A sunset seen through a train window, the silhouette of a passenger in the foreground.',
      svg: (id) => `
        <defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.blue}"/><stop offset=".6" stop-color="${C.pink}"/><stop offset="1" stop-color="${C.glow}"/></linearGradient></defs>
        <rect width="600" height="400" fill="${C.ink}"/>
        <rect x="60" y="50" width="480" height="250" rx="22" fill="url(#${id}s)"/>
        <circle cx="360" cy="228" r="46" fill="#fbe3b4"/>
        <path d="M60 262c70-40 120-14 190-6s150-40 290-6v50H60z" fill="${C.sage}" opacity=".85"/>
        <path d="M60 282c110-24 200 8 300-4s130-14 180 0v22H60z" fill="${C.deep}"/>
        <path d="M120 130q40-20 80 0t80 0" fill="none" stroke="#fff" stroke-width="3" opacity=".5" stroke-linecap="round"/>
        <path d="M60 50h480v250H60zM300 50v250" fill="none" stroke="${C.ink}" stroke-width="10"/>
        <circle cx="130" cy="330" r="34" fill="${C.ink}" stroke="#3a2e27" stroke-width="3"/>
        <path d="M96 400v-34q0-30 34-30t34 30v34z" fill="#3a2e27"/>
        <rect x="0" y="352" width="600" height="48" fill="#1f1713"/>`
    },

    desk: {
      alt: 'A peaceful desk with stacked books, a cup of tea and warm lamplight.',
      svg: (id) => `
        <defs><radialGradient id="${id}l"><stop offset="0" stop-color="${C.glow}" stop-opacity=".85"/><stop offset="1" stop-color="${C.glow}" stop-opacity="0"/></radialGradient></defs>
        <rect width="600" height="400" fill="${C.paper}"/>
        <circle cx="440" cy="180" r="200" fill="url(#${id}l)"/>
        <rect x="0" y="290" width="600" height="110" fill="${C.wood}"/>
        <path d="M0 290h600" stroke="${C.ink}" stroke-width="5"/>
        <path d="M90 290v-26h130v26z" fill="${C.sage}" stroke="${C.ink}" stroke-width="4"/>
        <path d="M104 264v-24h104v24z" fill="${C.pink}" stroke="${C.ink}" stroke-width="4"/>
        <path d="M96 240v-22h112v22z" fill="${C.blue}" stroke="${C.ink}" stroke-width="4"/>
        <path d="M272 290v-46h62v46z" fill="${C.cream}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M334 258q22 0 22 14t-22 14" fill="none" stroke="${C.ink}" stroke-width="4"/>
        <path d="M290 230c-8-10 8-16 0-28M312 230c-8-10 8-16 0-28" fill="none" stroke="${C.taupe}" stroke-width="3" stroke-linecap="round"/>
        <path d="M470 290v-110l50-36" fill="none" stroke="${C.ink}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M500 128l50 30-14 22-50-30z" fill="${C.pink}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M440 290h60" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>
        <path d="M380 276l70-14 10 14-70 14z" fill="${C.cream}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round" opacity=".95"/>`
    },

    night: {
      alt: 'A person with an umbrella walking down a quiet street at night beneath a crescent moon.',
      svg: (id) => `
        <defs><radialGradient id="${id}l"><stop offset="0" stop-color="${C.glow}" stop-opacity=".8"/><stop offset="1" stop-color="${C.glow}" stop-opacity="0"/></radialGradient></defs>
        <rect width="600" height="400" fill="#2e3a4a"/>
        <path d="M470 60a34 34 0 1 0 34 44 28 28 0 1 1-34-44z" fill="#f5ead0"/>
        <path d="M0 250V150h90v-30h80v60h60v-50h90v130zM380 250V130h70v-40h70v160z" fill="#3d4b5f"/>
        <g fill="${C.glow}" opacity=".9"><rect x="26" y="170" width="16" height="20"/><rect x="108" y="140" width="16" height="20"/><rect x="408" y="150" width="16" height="20"/><rect x="470" y="110" width="16" height="20"/></g>
        <circle cx="170" cy="190" r="80" fill="url(#${id}l)"/><circle cx="470" cy="215" r="80" fill="url(#${id}l)"/>
        <path d="M170 300V196M470 300V218" stroke="${C.ink}" stroke-width="6"/>
        <circle cx="170" cy="192" r="9" fill="#fbe3b4"/><circle cx="470" cy="214" r="9" fill="#fbe3b4"/>
        <rect x="0" y="290" width="600" height="110" fill="#222c39"/>
        <path d="M0 330h600" stroke="${C.deep}" stroke-width="3" stroke-dasharray="40 30"/>
        <path d="M290 300l-6-52M300 300l-4-52" stroke="#10151c" stroke-width="9" stroke-linecap="round"/>
        <rect x="278" y="196" width="34" height="56" rx="12" fill="#10151c"/>
        <circle cx="295" cy="184" r="12" fill="#10151c"/>
        <path d="M250 190q50-50 100 0z" fill="${C.pink}" stroke="#10151c" stroke-width="3"/>
        ${rainLines(0, 0, 600, 290, 26)}`
    },

    morning: {
      alt: 'Morning sunlight entering a study room, falling across the floor beside a bookshelf and a plant.',
      svg: (id) => `
        <defs><linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.glow}" stop-opacity=".85"/><stop offset="1" stop-color="${C.glow}" stop-opacity="0"/></linearGradient></defs>
        <rect width="600" height="400" fill="${C.cream}"/>
        <rect x="70" y="40" width="200" height="190" fill="#cfe0ec" stroke="${C.ink}" stroke-width="6"/>
        <path d="M170 40v190M70 135h200" stroke="${C.ink}" stroke-width="5"/>
        <path d="M70 230L40 400h330L270 230z" fill="url(#${id}b)"/>
        <rect x="0" y="330" width="600" height="70" fill="${C.wood}"/><path d="M0 330h600" stroke="${C.ink}" stroke-width="4"/>
        <rect x="400" y="60" width="150" height="270" fill="${C.taupe}" stroke="${C.ink}" stroke-width="5"/>
        <path d="M400 150h150M400 240h150" stroke="${C.ink}" stroke-width="5"/>
        <g stroke="${C.ink}" stroke-width="3"><rect x="414" y="104" width="16" height="46" fill="${C.sage}"/><rect x="432" y="94" width="14" height="56" fill="${C.pink}"/><rect x="448" y="108" width="18" height="42" fill="${C.blue}"/><rect x="470" y="98" width="14" height="52" fill="${C.cream}"/><rect x="420" y="196" width="22" height="44" fill="${C.blue}"/><rect x="444" y="190" width="16" height="50" fill="${C.sage}"/></g>
        <path d="M330 330v-44h46v44z" fill="${C.pink}" stroke="${C.ink}" stroke-width="4"/>
        <path d="M353 286c-30-30-24-66-10-84M353 286c24-24 40-46 24-80M353 286c0-40-4-70 6-96" fill="none" stroke="${C.sage}" stroke-width="6" stroke-linecap="round"/>`
    },

    window: {
      alt: 'A figure sitting beside a window at dusk, thinking, with a pale moon outside.',
      svg: (id) => `
        <rect width="600" height="400" fill="${C.paper}"/>
        <rect x="260" y="40" width="270" height="270" fill="${C.deep}" stroke="${C.ink}" stroke-width="6"/>
        <circle cx="440" cy="120" r="30" fill="#f5ead0"/>
        <path d="M260 230c50-30 90 0 150-14s90 10 120 0v94H260z" fill="#3a4a60"/>
        <path d="M395 40v270M260 175h270" stroke="${C.ink}" stroke-width="5"/>
        <rect x="230" y="310" width="330" height="20" fill="${C.wood}" stroke="${C.ink}" stroke-width="4"/>
        <rect x="0" y="330" width="600" height="70" fill="${C.taupe}" opacity=".4"/>
        <path d="M120 400v-130q0-50 50-50t50 50v130z" fill="${C.sage}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>
        <circle cx="170" cy="190" r="34" fill="#f2d8c4" stroke="${C.ink}" stroke-width="4"/>
        <path d="M138 188q2-40 40-38 28 2 30 30-18-22-44-14-14 4-26 22z" fill="${C.ink}"/>
        <path d="M200 262q40-6 50-40" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
        <circle cx="258" cy="216" r="8" fill="#f2d8c4" stroke="${C.ink}" stroke-width="3"/>`
    },

    season: {
      alt: 'A blossoming branch with soft petals drifting down, marking the changing of the season.',
      svg: (id) => `
        <defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe0ec"/><stop offset="1" stop-color="${C.cream}"/></linearGradient></defs>
        <rect width="600" height="400" fill="url(#${id}s)"/>
        <path d="M-10 90C120 110 190 70 320 130S500 150 620 110" fill="none" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/>
        <path d="M200 100c20 40 18 80 46 112M400 138c-10 36 6 60-6 100" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
        <g fill="${C.pink}" stroke="${C.ink}" stroke-width="2.5">
          <circle cx="120" cy="100" r="17"/><circle cx="165" cy="88" r="14"/><circle cx="250" cy="116" r="18"/>
          <circle cx="330" cy="132" r="15"/><circle cx="440" cy="150" r="18"/><circle cx="520" cy="128" r="14"/>
          <circle cx="246" cy="214" r="13"/><circle cx="394" cy="240" r="14"/></g>
        <g fill="${C.pink}" opacity=".9">
          <ellipse cx="150" cy="240" rx="9" ry="5" transform="rotate(30 150 240)"/><ellipse cx="320" cy="280" rx="9" ry="5" transform="rotate(-20 320 280)"/>
          <ellipse cx="470" cy="300" rx="9" ry="5" transform="rotate(40 470 300)"/><ellipse cx="90" cy="320" rx="9" ry="5"/>
          <ellipse cx="240" cy="340" rx="9" ry="5" transform="rotate(-35 240 340)"/></g>
        <path d="M0 360c120-30 220 10 340-8s190-24 260 4v44H0z" fill="${C.sage}"/>`
    }
  };

  let counter = 0;

  /**
   * Returns a figure element holding the scene as an SVG.
   * Decorative scenes are hidden from assistive tech; meaningful ones get alt text.
   */
  function sceneElement(name, options) {
    const opts = options || {};
    const scene = SCENES[name] || SCENES.window;
    const id = 'sc' + (++counter) + '-';
    const wrap = document.createElement('div');
    wrap.className = 'art' + (opts.className ? ' ' + opts.className : '');
    const label = opts.decorative ? 'aria-hidden="true"' : `role="img" aria-label="${scene.alt.replace(/"/g, '&quot;')}"`;
    // Content is static, authored in this file; it never contains user text.
    wrap.innerHTML = `<svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" ${label} focusable="false">${scene.svg(id)}</svg>`;
    return wrap;
  }

  root.SCENES = SCENES;
  root.sceneElement = sceneElement;
})(window);
