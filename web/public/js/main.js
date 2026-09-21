/* viacolectiva — interacciones de la landing
   Depende de GSAP + ScrollTrigger + Lenis (CDN). Si no cargan, el sitio
   funciona igual, sólo que sin animaciones. */
(() => {
  'use strict';

  const html = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const { gsap, ScrollTrigger, Lenis } = window;
  const animate = html.classList.contains('anim') && !!gsap && !!ScrollTrigger;

  window.__vcReady = true;
  let lenis = null;
  if (!animate) html.classList.remove('anim');

  const THEME_COLOR = { light: '#ffffff', lime: '#c5f82a', dark: '#0b0b0b' };

  /* ---------- Letras / palabras sueltas para las animaciones ---------- */
  const splitChars = (el, text) => {
    el.textContent = '';
    for (const c of text) {
      const s = document.createElement('span');
      s.className = 'ch';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = c === ' ' ? ' ' : c;
      el.appendChild(s);
    }
  };
  const splitWords = (el, text) => {
    el.textContent = '';
    const words = text.trim().split(/\s+/);
    words.forEach((w, i) => {
      const s = document.createElement('span');
      s.className = 'w';
      s.textContent = w;
      el.appendChild(s);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  };

  /* ---------- Titulares que llenan el ancho ---------- */
  const fitAll = () => {
    $$('[data-fit]').forEach((el) => {
      el.style.fontSize = '100px';
      const w = el.getBoundingClientRect().width;
      const target = el.parentElement.clientWidth;
      if (w) el.style.fontSize = `${(100 * target) / w}px`;
    });
  };
  document.fonts?.ready.then(() => { fitAll(); window.ScrollTrigger?.refresh(); });

  /* ---------- Texto que se "decodifica" ---------- */
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/+=<>';
  const scramble = (el, text) => {
    cancelAnimationFrame(el._raf);
    if (reduce) { if (text) el.textContent = text; return; }
    text = text || el.dataset.text || el.textContent;
    el.dataset.text = text;
    let frame = 0;
    const step = () => {
      const shown = Math.floor(frame / 2);
      el.textContent = [...text]
        .map((c, i) => (i < shown || c === ' ' ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
        .join('');
      frame += 1;
      if (shown < text.length) el._raf = requestAnimationFrame(step);
      else el.textContent = text;
    };
    step();
  };
  $$('[data-scramble]').forEach((el) => (el.closest('a') || el).addEventListener('pointerenter', () => scramble(el)));

  /* ---------- Idiomas: inglés por defecto, español como segundo ---------- */
  const LANGS = ['en', 'es'];
  const I18N = window.VC_I18N || {};
  const EN = (I18N.en = I18N.en || {});
  // El inglés se toma del HTML (así no hay que mantenerlo en dos lugares)
  $$('[data-i18n]').forEach((el) => { if (!(el.dataset.i18n in EN)) EN[el.dataset.i18n] = el.textContent; });
  $$('[data-i18n-aria]').forEach((el) => { if (!(el.dataset.i18nAria in EN)) EN[el.dataset.i18nAria] = el.getAttribute('aria-label'); });
  const metaDesc = $('meta[name="description"]');
  EN['meta.title'] = document.title;
  EN['meta.desc'] = metaDesc?.content;

  const store = {
    get() { try { return localStorage.getItem('vc-lang'); } catch { return null; } },
    set(v) { try { localStorage.setItem('vc-lang', v); } catch { /* sin almacenamiento */ } },
  };
  const fromUrl = new URLSearchParams(location.search).get('lang');
  let lang = LANGS.includes(fromUrl) ? fromUrl : LANGS.includes(store.get()) ? store.get() : 'en';
  const t = (key) => I18N[lang]?.[key] ?? EN[key] ?? key;

  const applyLang = (l) => {
    lang = l;
    html.lang = l;
    document.title = t('meta.title');
    if (metaDesc) metaDesc.content = t('meta.desc');
    $$('[data-i18n]').forEach((el) => {
      const text = t(el.dataset.i18n);
      if ('chars' in el.dataset) splitChars(el, text);
      else if ('words' in el.dataset) splitWords(el, text);
      else {
        cancelAnimationFrame(el._raf);
        el.textContent = text;
        if ('scramble' in el.dataset || 'scrambleIn' in el.dataset) el.dataset.text = text;
      }
    });
    $$('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
    $$('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
    const burgerEl = $('.burger');
    burgerEl?.setAttribute('aria-label', t(html.classList.contains('menu-open') ? 'a11y.menuClose' : 'a11y.menuOpen'));
    const status = $('.form-status');
    if (status) status.textContent = '';
    fitAll();
  };
  applyLang(lang);

  /* ---------- Tema por sección + sección activa en el menú ---------- */
  const metaTheme = $('meta[name="theme-color"]');
  let current = null;
  const setSection = (sec) => {
    if (current === sec) return;
    current = sec;
    const theme = sec.dataset.section;
    html.dataset.theme = theme;
    if (metaTheme && !html.classList.contains('menu-open')) metaTheme.content = THEME_COLOR[theme];
    $$('.menu-link').forEach((a) => a.classList.toggle('is-active', a.dataset.spy === sec.dataset.spy));
  };
  const sectionIO = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && setSection(e.target)),
    { rootMargin: '-49% 0px -50% 0px' }
  );
  $$('[data-section]').forEach((s) => sectionIO.observe(s));

  /* ---------- Menú móvil ---------- */
  const burger = $('.burger');
  const menu = $('#menu');
  const setMenu = (open) => {
    if (html.classList.contains('menu-open') === open) return;
    html.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', t(open ? 'a11y.menuClose' : 'a11y.menuOpen'));
    menu.setAttribute('aria-hidden', String(!open));
    if (metaTheme) metaTheme.content = open ? THEME_COLOR.dark : THEME_COLOR[html.dataset.theme];
    if (open) {
      lenis?.stop();
      setTimeout(() => $('.menu-link', menu).focus({ preventScroll: true }), 350);
    } else {
      lenis?.start();
    }
  };
  burger.addEventListener('click', () => setMenu(!html.classList.contains('menu-open')));
  // Al elegir una sección: se cierra el menú y el scroll lo hace el manejador de anclas
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (!html.classList.contains('menu-open')) return;
    if (e.key === 'Escape') { setMenu(false); burger.focus(); return; }
    if (e.key === 'Tab') {
      // foco atrapado entre el botón y los links del menú
      const items = [burger, ...$$('a, button', menu)];
      const i = items.indexOf(document.activeElement);
      const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i + 1) % items.length;
      e.preventDefault();
      items[next].focus();
    }
  });
  matchMedia('(min-width: 761px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* ---------- Selector de idioma ---------- */
  let afterLangChange = () => {}; // con animaciones, se redefine más abajo
  const wipe = $('.wipe');
  const switchLang = (l) => {
    if (l === lang || !LANGS.includes(l)) return;
    store.set(l);
    if (!animate) { applyLang(l); afterLangChange(); return; }
    $('.wipe-label', wipe).textContent = I18N[l]?.['lang.name'] || l.toUpperCase();
    gsap.timeline()
      .fromTo(wipe, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.55, ease: 'expo.inOut' })
      .add(() => { applyLang(l); afterLangChange(); })
      .to(wipe, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.7, ease: 'expo.inOut' }, '+=0.2');
  };
  $$('[data-lang]').forEach((b) => b.addEventListener('click', () => switchLang(b.dataset.lang)));

  /* ---------- Servicios: acordeón ---------- */
  $$('.svc').forEach((svc) => {
    const head = $('.svc-head', svc);
    head.addEventListener('click', () => {
      const open = svc.classList.toggle('is-open');
      head.setAttribute('aria-expanded', String(open));
      if (animate) setTimeout(() => ScrollTrigger.refresh(), 650);
    });
  });

  /* ---------- Formulario ---------- */
  const form = $('.form');
  if (form) {
    const status = $('.form-status', form);
    $$('input, textarea', form).forEach((inp) =>
      inp.addEventListener('input', () => inp.closest('.field')?.classList.remove('is-invalid'))
    );
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let ok = true;
      $$('.field', form).forEach((f) => {
        const inp = $('input, textarea', f);
        const valid = inp.checkValidity() && inp.value.trim() !== '';
        f.classList.toggle('is-invalid', !valid);
        if (!valid) ok = false;
      });
      if (!ok) { status.textContent = t('form.error'); return; }

      const data = new FormData(form);
      // nombres de servicio tal como se ven (en el idioma activo)
      const services = $$('input[name="servicio"]:checked', form).map((i) => i.nextElementSibling.textContent);
      data.set('servicios', services.join(', '));
      data.set('idioma', lang);
      const { endpoint, email } = form.dataset;

      if (endpoint) {
        status.textContent = t('form.sending');
        try {
          const r = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
          if (!r.ok) throw new Error(r.statusText);
          form.reset();
          status.textContent = t('form.thanks');
        } catch {
          status.textContent = t('form.fail').replace('{email}', email);
        }
        return;
      }

      const subject = t('mail.subject').replace('{name}', data.get('nombre'));
      const body = [
        `${t('mail.name')}: ${data.get('nombre')}`,
        `Email: ${data.get('email')}`,
        `${t('mail.services')}: ${services.join(', ') || '—'}`,
        '',
        data.get('mensaje'),
      ].join('\n');
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      status.textContent = t('form.opening');
    });
  }

  /* Fondo del header apenas se hace scroll */
  const nav = $('.nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 60);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const year = $('.year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Onda: la señal que converge en los extremos ---------- */
  const initWave = () => {
    const canvas = $('.wave canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, t = 0, mx = 0.5, target = 0.5, visible = false, raf = 0;
    const lines = [
      { a: 1, f: 1, s: 1, alpha: 1, lw: 1.6 },
      { a: 0.72, f: 1.6, s: -1.25, alpha: 0.45, lw: 1 },
      { a: 0.48, f: 2.5, s: 0.8, alpha: 0.22, lw: 1 },
    ];
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const draw = () => {
      const fg = getComputedStyle(html).getPropertyValue('--fg').trim() || '#0b0b0b';
      ctx.clearRect(0, 0, w, h);
      mx += (target - mx) * 0.05;
      const mid = h / 2, amp = h * 0.42;

      ctx.fillStyle = fg;
      ctx.globalAlpha = 0.35;
      for (let x = 0; x <= w; x += 16) ctx.fillRect(x, mid, 1, (x / 16) % 4 === 0 ? 6 : 3);

      lines.forEach((L) => {
        ctx.beginPath();
        ctx.globalAlpha = L.alpha;
        ctx.lineWidth = L.lw;
        ctx.strokeStyle = fg;
        for (let x = 0; x <= w; x += 2) {
          const u = x / w;
          const env = Math.sin(Math.PI * u) ** 2 * (0.3 + 0.8 * Math.exp(-((u - mx) ** 2) / 0.018));
          const y = mid + amp * env * L.a * (
            Math.sin(u * 22 * L.f + t * 2.2 * L.s) * 0.6 +
            Math.sin(u * 47 * L.f - t * 3.1 * L.s) * 0.25 +
            Math.sin(u * 7 + t * 0.9) * 0.15
          );
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      t += 0.016;
    };
    const loop = () => {
      if (!visible) return;
      draw();
      raf = requestAnimationFrame(loop);
    };
    resize();
    window.addEventListener('resize', () => { resize(); if (reduce) draw(); });
    canvas.parentElement.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      target = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    });
    canvas.parentElement.addEventListener('pointerleave', () => { target = 0.5; });
    if (reduce) { draw(); return; }
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) loop();
    }).observe(canvas);
  };
  initWave();

  /* ---------- Sin librerías o con movimiento reducido: hasta acá ---------- */
  if (!animate) {
    window.addEventListener('resize', fitAll);
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('href').length < 2) return;
      const target = $(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
    return;
  }

  /* ======================================================================
     ANIMACIONES
     ====================================================================== */
  gsap.registerPlugin(ScrollTrigger);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  /* Scroll suave */
  if (Lenis) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id === '#top' ? 0 : id.length > 1 ? $(id) : null;
    if (target === null) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else if (target === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
    else target.scrollIntoView({ behavior: 'smooth' });
  });

  /* Cursor */
  if (finePointer) {
    const cursor = $('.cursor');
    html.classList.add('has-cursor');
    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.25, ease: 'power3' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.25, ease: 'power3' });
    window.addEventListener('pointermove', (e) => {
      cursor.classList.add('is-on');
      xTo(e.clientX); yTo(e.clientY);
      cursor.classList.toggle('is-hover', !!e.target.closest('a, button, label, .card'));
    });
    document.addEventListener('pointerleave', () => cursor.classList.remove('is-on'));
  }

  /* Isotipo del hero: sigue suavemente al mouse, siempre entero */
  const heroIso = $('.hero-iso');
  const heroSvg = $('svg', heroIso);
  if (finePointer) {
    const xTo = gsap.quickTo(heroSvg, 'x', { duration: 1.2, ease: 'power3' });
    const yTo = gsap.quickTo(heroSvg, 'y', { duration: 1.2, ease: 'power3' });
    window.addEventListener('pointermove', (e) => {
      xTo((e.clientX / window.innerWidth - 0.5) * 36);
      yTo((e.clientY / window.innerHeight - 0.5) * 36);
    });
  }

  /* Estado inicial del punto (sin CSS transforms para no chocar con GSAP) */
  gsap.set('.hero-iso .dot, .loader-iso .dot', { scale: 0, transformOrigin: '50% 50%' });

  /* Loader */
  const loader = $('.loader');
  const countEl = $('.loader-count');
  const count = { v: 0 };
  const loaderTl = gsap.timeline()
    .from('.loader-grid i', { scaleY: 0, transformOrigin: 'top', duration: 1, stagger: 0.035, ease: 'expo.out' }, 0)
    .to('.loader-iso .draw', { strokeDashoffset: 0, duration: 1, stagger: 0.12, ease: 'power3.inOut' }, 0.15)
    .add(() => $('.loader-iso').classList.add('is-drawn'), 1.2)
    .to('.loader-iso .dot', { scale: 1, duration: 0.5, ease: 'back.out(3)' }, 1.2)
    .to(count, {
      v: 100, duration: 1.5, ease: 'power2.inOut',
      onUpdate: () => { countEl.textContent = String(Math.round(count.v)).padStart(3, '0'); },
    }, 0);

  const heroIntro = () => {
    heroIso.classList.add('is-drawn');
    $$('.hero [data-chars]').forEach((el) => el.classList.add('is-in'));
    return gsap.timeline()
      .from('.nav', { yPercent: -120, opacity: 0, duration: 1, ease: 'expo.out' }, 0.2)
      .fromTo('.hero .ch', { y: 0, yPercent: 115 }, { yPercent: 0, duration: 1.3, stagger: 0.03, ease: 'expo.out' }, 0)
      .to('.hero-iso .draw', { strokeDashoffset: 0, duration: 1.4, stagger: 0.12, ease: 'power3.inOut' }, 0.1)
      .to('.hero-iso .dot', { scale: 1, duration: 0.8, ease: 'back.out(3)' }, 1.1)
      .fromTo('.hero [data-reveal]', { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: 'expo.out' }, 0.5);
  };

  // Esperamos las fuentes, pero nunca más de 2.5 s (conexiones lentas)
  const fontsReady = Promise.race([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise((r) => setTimeout(r, 2500)),
  ]);
  Promise.all([fontsReady, loaderTl.then()]).then(() => {
    fitAll();
    buildScroll();
    gsap.timeline()
      .to(loader, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1, ease: 'expo.inOut' })
      .add(heroIntro(), '-=0.45')
      .add(() => { loader.remove(); lenis?.start(); ScrollTrigger.refresh(); }, 0.9);
  });

  /* Manifiesto: las palabras se encienden a medida que se lee */
  let wordsTween = null;
  function buildWords() {
    if (wordsTween) { wordsTween.scrollTrigger?.kill(); wordsTween.kill(); }
    wordsTween = gsap.fromTo('.manifesto-text .w', { opacity: 0.14 }, {
      opacity: 1, stagger: 0.05, ease: 'none',
      scrollTrigger: { trigger: '.manifesto-text', start: 'top 82%', end: 'bottom 50%', scrub: true },
    });
  }

  /* Tras cambiar de idioma: los titulares ya vistos vuelven a subir y se recalcula el scroll */
  afterLangChange = () => {
    $$('[data-chars].is-in').forEach((el) => {
      gsap.fromTo($$('.ch', el), { y: 0, yPercent: 115 }, { yPercent: 0, duration: 1, stagger: 0.025, ease: 'expo.out', delay: 0.25 });
    });
    buildWords();
    ScrollTrigger.refresh();
  };

  /* Todo lo que depende del scroll */
  function buildScroll() {
    /* Hero: al bajar, los titulares se abren y el isotipo se aleja (entero) */
    gsap.timeline({
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 },
      defaults: { ease: 'none' },
    })
      .to('.hero-title .clip:first-child', { xPercent: -14 }, 0)
      .to('.hero-title .clip-bottom', { xPercent: 12 }, 0)
      .to(heroSvg, { yPercent: 35, scale: 0.8 }, 0)
      .to('.hero-meta', { opacity: 0, y: -40 }, 0);

    /* Reveals genéricos (con leve cascada entre hermanos) */
    $$('[data-reveal]').filter((el) => !el.closest('.hero, [hidden]')).forEach((el) => {
      const sibs = $$(':scope > [data-reveal]', el.parentElement);
      gsap.fromTo(el, { opacity: 0, y: 28 }, {
        opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', delay: Math.max(0, sibs.indexOf(el)) * 0.08,
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });

    /* Titulares gigantes */
    $$('main section:not(.hero) [data-chars]').forEach((el) => {
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => {
          el.classList.add('is-in');
          gsap.fromTo($$('.ch', el), { y: 0, yPercent: 115 }, { yPercent: 0, duration: 1.2, stagger: 0.045, ease: 'expo.out' });
        },
      });
    });

    /* Etiquetas que se decodifican al entrar */
    $$('[data-scramble-in]').forEach((el) => {
      ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => scramble(el) });
    });

    buildWords();

    /* Filas de servicios */
    gsap.fromTo('.svc', { opacity: 0, y: 30 }, {
      opacity: 1, y: 0, duration: 1, stagger: 0.09, ease: 'expo.out',
      scrollTrigger: { trigger: '.svc-list', start: 'top 85%', once: true },
    });

    /* Proceso: la línea avanza con el scroll (sólo si el bloque está visible) */
    if (!$('.process')?.closest('[hidden]')) {
      gsap.to('.process', {
        '--p': 1, ease: 'none',
        scrollTrigger: { trigger: '.process', start: 'top 85%', end: 'top 35%', scrub: true },
      });
      gsap.fromTo('.process li', { opacity: 0, y: 20 }, {
        opacity: 1, y: 0, duration: 0.9, stagger: 0.1, ease: 'expo.out',
        scrollTrigger: { trigger: '.process', start: 'top 80%', once: true },
      });
    }

    /* Footer: el imagotipo sube */
    gsap.fromTo('.footer-logo', { yPercent: 30, opacity: 0 }, {
      yPercent: 0, opacity: 1, duration: 1.4, ease: 'expo.out',
      scrollTrigger: { trigger: '.footer', start: 'top 85%', once: true },
    });
  }

  /* Ajustes al cambiar el tamaño */
  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { fitAll(); ScrollTrigger.refresh(); }, 150);
  });
})();
