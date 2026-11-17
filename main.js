(function () {
  'use strict';

  /* ---------- the left column stays in view (wide screens) ----------
     The statement is held in view while the publications scroll. If the window is too short
     for it, the column rides up just far enough to show its last line. The bio and contact
     below it come into view at the end of the page. */
  var me = document.querySelector('.me');
  var statement = document.querySelector('.statement');
  function hold() {
    if (!me || !statement) return;
    if (!me.offsetHeight) { me.style.top = ''; return; }   // narrow screens: the column is not a box
    var bottom = statement.getBoundingClientRect().bottom - me.getBoundingClientRect().top + 40;
    me.style.top = Math.min(0, window.innerHeight - bottom) + 'px';
  }
  if (me) {
    hold();
    window.addEventListener('resize', hold);
    window.addEventListener('load', hold);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(hold);
  }

  function wide() { return !!(me && me.offsetHeight); }   // narrow screens: the column is not a box

  /* ---------- glides: the smooth scrolls this page starts itself ----------
     One glide at a time; a new one carries on from wherever the last one got to,
     and the reader's own scrolling (wheel, touch, keys, a click) takes over at once. */
  var root = document.documentElement;
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var glide = null;
  function endGlide() {
    var g = glide;
    if (!g) return;
    glide = null;
    cancelAnimationFrame(g.raf);
    root.style.scrollBehavior = '';
    if (g.then) g.then();
  }
  function glideTo(y, then, instant) {
    endGlide();
    y = Math.max(0, Math.min(root.scrollHeight - window.innerHeight, y));
    var from = window.pageYOffset, by = y - from;
    root.style.scrollBehavior = 'auto';            // the stylesheet's smooth scrolling would fight every frame
    if (Math.abs(by) < 2 || still || instant) {
      window.scrollTo(0, y);
      root.style.scrollBehavior = '';
      if (then) then();
      return;
    }
    var ms = Math.min(900, 420 + Math.abs(by) * 0.3), t0 = null;
    var g = glide = { raf: 0, then: then };
    g.raf = requestAnimationFrame(function step(t) {
      if (glide !== g) return;
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / ms);
      var e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(2 - 2 * p, 3) / 2;   // ease in and out
      window.scrollTo(0, from + by * e);
      if (p < 1) g.raf = requestAnimationFrame(step);
      else endGlide();
    });
  }
  ['wheel', 'touchstart', 'mousedown', 'keydown'].forEach(function (type) {
    window.addEventListener(type, endGlide, { passive: true });
  });

  /* ---------- "About" sits at the foot of the left column, which comes into view only at the end of the page ---------- */
  [].forEach.call(document.querySelectorAll('a[href="#about"]'), function (a) {
    a.addEventListener('click', function (e) {
      if (!wide()) return;                         // one column: the ordinary jump works
      e.preventDefault();
      if (location.hash !== '#about' && history.pushState) history.pushState(null, '', '#about');
      glideTo(root.scrollHeight);
    });
  });
  if (location.hash === '#about') {
    window.addEventListener('load', function () { if (wide()) glideTo(root.scrollHeight, null, true); });
  }

  /* ---------- avatar: hover zooms out and plays (from the old site) ---------- */
  var pic = document.getElementById('my-pic');
  var video = document.getElementById('header-video');
  if (pic && video) {
    var play = function () { pic.classList.add('playing'); video.play().catch(function () {}); };
    var stop = function () { pic.classList.remove('playing'); video.pause(); video.currentTime = 0; };
    pic.addEventListener('mouseenter', play);
    pic.addEventListener('mouseleave', stop);
    // touch screens have no hover: tap to toggle
    pic.addEventListener('touchstart', function () {
      if (video.paused) play(); else stop();
    }, { passive: true });
  }
})();

/* ---------- figures: show a detail, zoom out to the whole figure on hover ----------
   Each frame names its detail with --x and --y (the point of the figure to centre on, in %)
   and --zoom (1 fills the frame with as much of the figure as fits; 2 is twice as close; 0 shows the whole figure). */
(function () {
  var PAD = 0.07;        // the mat around a whole figure, as a share of the frame's width
  var H = 3 / 4;         // frame height, in frame widths
  function place(fig) {
    var img = fig.querySelector('img');
    if (!img || !img.naturalWidth) return;
    var cs = getComputedStyle(fig);
    var num = function (name, d) { var v = parseFloat(cs.getPropertyValue(name)); return isNaN(v) ? d : v; };
    var x = num('--x', 50) / 100, y = num('--y', 50) / 100, zoom = num('--zoom', 1);
    var a = img.naturalWidth / img.naturalHeight;
    // the whole figure, inside the mat
    var ww = Math.min(1 - 2 * PAD, (H - 2 * PAD) * a), wh = ww / a;
    var whole = [(1 - ww) / 2, (H - wh) / 2, ww, wh];
    // the detail: the figure covers the frame, zoomed, centred on (x, y) as far as its edges allow
    var detail = whole;
    if (zoom > 0) {
      var dw = Math.max(1, H * a) * Math.max(zoom, 1), dh = dw / a;
      detail = [Math.min(0, Math.max(1 - dw, 0.5 - x * dw)), Math.min(0, Math.max(H - dh, H / 2 - y * dh)), dw, dh];
    }
    var set = function (p, r) {
      img.style.setProperty('--' + p + 'l', (r[0] * 100).toFixed(3) + '%');
      img.style.setProperty('--' + p + 't', (r[1] / H * 100).toFixed(3) + '%');
      img.style.setProperty('--' + p + 'w', (r[2] * 100).toFixed(3) + '%');
      img.style.setProperty('--' + p + 'h', (r[3] / H * 100).toFixed(3) + '%');
    };
    set('w', whole);
    set('d', detail);
    requestAnimationFrame(function () { requestAnimationFrame(function () { fig.classList.add('ready'); }); });
  }
  [].forEach.call(document.querySelectorAll('.pub-fig'), function (fig) {
    var img = fig.querySelector('img');
    if (!img) return;
    if (img.complete) place(fig); else img.addEventListener('load', function () { place(fig); });
  });
})();
