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

/* ---------- the swallow ----------
   It lives in the gap in the masthead and keeps an eye on the pointer. Point at something it can perch on
   (a paper, anywhere on it, the same area that makes its figure zoom out, or a link to it in the statement;
   the name; a tab; the "Publications" heading) and it stirs where it is, beating its wings and leaning that way; it goes only once the pointer
   settles there. A pointer that is just passing through gets the stir and no flight. It takes off by beating
   its wings, flies a curved path with its body turned the way it is going (seen from below, as you see a
   swallow overhead), brakes with a few hard beats and lands, wings folded: on the top-left corner of the
   paper's figure, or on the last letter of the words. It stays while the pointer stays, and a while after the
   pointer has gone to nothing else it flies home. Two things set it playing instead: rest the pointer on the
   bird itself and it chases the pointer, circling it twice; run the pointer along the closing quote and it
   flies over and circles the words three times. Then it flies home. (See play() for how it keeps that looking
   like a bird, even when the pointer is flung about.) It is drawn afresh every frame while it moves. */
(function () {
  var bird = document.querySelector('.bird');
  if (!bird || !window.requestAnimationFrame || !document.elementFromPoint) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var rig = bird.querySelector('.bird-rig');
  var wl = bird.querySelector('.wing-l'), wr = bird.querySelector('.wing-r');

  // its temper (ms, and px per ms). The waits vary a little each time.
  var SETTLE = 240;      // the pointer nearly still on something for this long: it goes there
  var STILL = 0.16;      // slower than this is nearly still
  var LINGER = 800;      // or on it for this long, still or not
  var AWAY = 1100;       // the pointer on nothing for this long: it goes home
  var SIT = 600;         // once landed, it sits at least this long before going home
  var HOP = 250;         // ... and this long before going somewhere new
  var STIR = 380;        // a stir keeps up this long after the last thing that stirred it, then dies down
  var GLANCE = 150;      // the closing quote needs no settling: a pass along it this long is enough

  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var smooth = function (a, b, t) { t = clamp((t - a) / (b - a)); return t * t * (3 - 2 * t); };
  var inOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(2 - 2 * t, 3) / 2; };
  var outQuad = function (t) { return 1 - (1 - t) * (1 - t); };
  var outCubic = function (t) { return 1 - Math.pow(1 - t, 3); };
  var mix = function (a, b, t) { return a + (b - a) * t; };
  var vary = function (v, lo, hi) { return v * (lo + (hi - lo) * Math.random()); };   // a bird is never quite the same twice
  var wrap = function (a) { return ((a + 180) % 360 + 360) % 360 - 180; };     // an angle, into -180..180
  var wrapR = function (a) { return a - 2 * Math.PI * Math.round(a / (2 * Math.PI)); };   // the same in radians
  function bez(p, t) {
    var u = 1 - t;
    return [u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0],
            u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1]];
  }
  function heading(p, t) {                       // 0 = head up, clockwise in degrees, along the curve
    var u = 1 - t, d = [0, 0];
    for (var i = 0; i < 2; i++) d[i] = 3 * u * u * (p[1][i] - p[0][i]) + 6 * u * t * (p[2][i] - p[1][i]) + 3 * t * t * (p[3][i] - p[2][i]);
    return Math.atan2(d[0], -d[1]) * 180 / Math.PI;
  }
  var FOLD = [-72, 0.52];                        // wings folded down along the body: degrees, foreshortening

  // a pose: offset from home (px), turn (deg), size, wingbeat (deg), glide, fold (0 open, 1 folded), beats a second,
  // bank (+ leaning into a clockwise turn)
  function pose(x, y, fold) { return { x: x || 0, y: y || 0, rot: 0, scale: 1, amp: 0, glide: 0, fold: fold || 0, hz: 6, bank: 0 }; }
  function copy(p) { return { x: p.x, y: p.y, rot: p.rot, scale: p.scale, amp: p.amp, glide: p.glide, fold: p.fold, hz: p.hz, bank: p.bank || 0 }; }
  var now = pose();
  var phase = 0, job = null, raf = 0, last = 0, vel = [0, 0];   // vel: how it is moving (px/s)
  var state = 'home';                            // home, perched or flying
  var seat = null;                               // what it sits on or is on its way to (null: home)
  var spot = [0, 0];                             // where it sits, when perched
  var landed = -1e9;                             // when it last landed

  function draw(p) {
    var s = Math.sin(phase);
    var a = p.amp * s + p.glide * 7;                                           // + raises the wings
    var f = 1 - 0.34 * Math.max(0, s) * p.amp / 32 - 0.12 * Math.max(0, -s) * p.amp / 32;   // shorter on the upstroke
    a = mix(a, FOLD[0], p.fold);
    f = mix(f, FOLD[1], p.fold);
    var lift = p.amp > 4 ? -1.7 * Math.sin(phase - 0.6) * p.amp / 32 : 0;     // each downstroke lifts the body
    var bank = (p.bank || 0) * (1 - p.fold);                                   // in a turn the inner wing tips away, shorter
    rig.style.transform = 'translate(' + p.x.toFixed(2) + 'px,' + (p.y + lift).toFixed(2) + 'px) rotate(' + p.rot.toFixed(2) + 'deg) scale(' + p.scale.toFixed(3) + ')';
    wl.style.transform = 'rotate(' + a.toFixed(2) + 'deg) scaleX(' + (f * (1 + bank)).toFixed(3) + ')';
    wr.style.transform = 'rotate(' + (-a).toFixed(2) + 'deg) scaleX(' + (f * (1 - bank)).toFixed(3) + ')';
  }
  function run() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function still() {                             // at rest where it is; at home the painting itself shows
    if (state === 'home') {
      now = pose();
      bird.classList.remove('flying');
      rig.style.transform = wl.style.transform = wr.style.transform = '';
    } else {
      draw(now = pose(spot[0], spot[1], 1));
    }
  }

  // the body's middle at home, in page coordinates; everywhere else is an offset from it
  function home() {
    var b = bird.getBoundingClientRect();
    return [b.left + 0.59 * b.width + window.pageXOffset, b.top + 0.37 * b.height + window.pageYOffset];
  }
  function onFigure(fig) {                       // standing on the top edge, at the left corner
    var r = fig.getBoundingClientRect(), h0 = home(), w = bird.offsetWidth, h = bird.offsetHeight;
    return [r.left + window.pageXOffset + 0.2 * w - h0[0], r.top + window.pageYOffset - 0.08 * h - h0[1]];
  }
  var pen = document.createElement('canvas').getContext('2d');
  function onWord(el) {                          // standing on the top of the last letter, over its middle
    var h0 = home(), h = bird.offsetHeight;
    var walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n, node = null;
    while ((n = walk.nextNode())) if (/\S/.test(n.data)) node = n;
    if (!node || !pen) {
      var b = el.getBoundingClientRect();
      return [b.right - 8 + window.pageXOffset - h0[0], b.top + window.pageYOffset - 0.08 * h - h0[1]];
    }
    var i = node.data.search(/\S\s*$/), range = document.createRange();
    range.setStart(node, i);
    range.setEnd(node, i + 1);
    var boxes = range.getClientRects(), box = boxes[boxes.length - 1];
    var cs = getComputedStyle(node.parentNode);
    pen.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    var m = pen.measureText(node.data.charAt(i));                              // the letter's ink, about its baseline
    var mark = document.createElement('span');                                 // the baseline, from a dot sitting on it
    mark.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
    node.parentNode.insertBefore(mark, node.nextSibling);
    var base = mark.getBoundingClientRect().top;
    mark.parentNode.removeChild(mark);
    var x = box.left + ((m.actualBoundingBoxRight || box.width) - (m.actualBoundingBoxLeft || 0)) / 2;
    var top = base - (m.actualBoundingBoxAscent || 0.52 * parseFloat(cs.fontSize));
    return [x + window.pageXOffset - h0[0], top + window.pageYOffset - 0.08 * h - h0[1]];
  }

  // Fly from wherever it is to `to` (an offset from home), and land there: land is 'home' or 'perch'.
  function fly(to, land) {
    var sitting = state === 'home' || state === 'perched';
    var stirring = !!job && job.kind === 'stir';                               // its wings are going already
    var h = bird.offsetHeight, up = -0.14 * h, top = -home()[1] + 0.5 * h;     // not above the top of the page
    var p0 = [now.x, now.y + (sitting ? up : 0)];
    var p3 = [to[0], to[1] + 0.8 * up];                                        // it lands from just above
    var dx = p3[0] - p0[0], dy = p3[1] - p0[1], L = Math.hypot(dx, dy) || 1;
    var far = smooth(60, 360, L);                                              // 0 for a hop, 1 for a flight
    var dur = vary(Math.max(mix(420, 560, far), Math.min(1400, 380 + 0.55 * L)), 0.93, 1.08);
    var nx = dy / L, ny = -dx / L, b = Math.min(0.2 * L, 80);                  // an arc over the way it goes
    if (ny > 0) { nx = -nx; ny = -ny; }
    var mid = [[p0[0] + 0.3 * dx + 0.6 * b * nx, Math.max(top, p0[1] + 0.3 * dy + 0.6 * b * ny)],
               [p0[0] + 0.72 * dx + b * nx, Math.max(top, p0[1] + 0.72 * dy + b * ny)]];
    job = { kind: 'fly', start: performance.now(),
            lift: sitting ? vary(mix(240, 360, far), 0.9, 1.15) * (stirring ? 0.6 : 1) : 0,
            dur: dur, down: mix(340, 440, far), far: far, turn: smooth(40, 260, L), long: L > 260,
            p: [p0, mid[0], mid[1], p3], to: to, land: land, from: copy(now) };
    state = 'flying';
    bird.classList.add('flying');
    run();
  }

  // a stir: it beats its wings where it sits, leaning toward what caught its eye, and settles again
  function stir(target) {
    if (!(state === 'home' || state === 'perched') || !visible()) return;
    var t = performance.now(), lean = 0;
    if (target && target.getBoundingClientRect) {
      var r = target.getBoundingClientRect(), bx = home()[0] + now.x - window.pageXOffset;
      lean = Math.max(-1, Math.min(1, (r.left + r.width / 2 - bx) / 120));
    }
    if (job && job.kind === 'stir') { job.until = t + STIR; job.lean = lean; return; }
    if (job) return;
    job = { kind: 'stir', start: t, until: t + STIR, lean: lean, env: 0, tilt: 0, from: copy(now) };
    bird.classList.add('flying');
    run();
  }

  function frame(t) {
    var j = job;
    if (!j) { raf = 0; return; }
    var dt = Math.min(50, Math.max(0, t - last)) / 1000, f = j.from, p;
    last = t;
    if (j.kind === 'stir') {
      var on = t < j.until;
      j.env += ((on ? 1 : 0) - j.env) * (1 - Math.exp(-dt / (on ? 0.05 : 0.11)));
      j.tilt += (j.lean - j.tilt) * (1 - Math.exp(-dt / 0.12));
      if (!on && j.env < 0.02) { job = null; raf = 0; still(); return; }
      var e = j.env, w = (t - j.start) / 1000;
      p = { x: f.x, y: f.y - 2.4 * e, rot: (6 * j.tilt + 1.5 * Math.sin(w * 9)) * e, scale: 1,
            amp: 24 * e, glide: 0, fold: f.fold * (1 - 0.65 * e), hz: 7.4 };
    } else if (j.kind === 'play') {
      p = playing(j, t, dt);
      if (j.done) {                              // home again
        job = null; raf = 0; landed = t; state = 'home';
        if (hot === BIRD) spent = BIRD;
        still();
        think();
        return;
      }
    } else {
      var ms = t - j.start;
      if (ms < j.lift) {                                                        // beat its wings where it is, rising a little
        var tl = ms / j.lift;
        p = { x: f.x, y: mix(f.y, j.p[0][1], outQuad(tl)), rot: f.rot * (1 - smooth(0, 0.6, tl)) + 3 * Math.sin(tl * 2 * Math.PI), scale: 1,
              amp: mix(f.amp, 30, smooth(0, 0.25, tl)), glide: 0, fold: f.fold * (1 - smooth(0, 0.6, tl)), hz: 6.6 };
      } else if (ms < j.lift + j.dur) {                                         // the flight
        var tt = (ms - j.lift) / j.dur, k = (j.lift ? inOut : outCubic)(tt), at = bez(j.p, k);
        var r0 = j.lift ? 0 : f.rot;
        var hd = r0 + wrap(wrap(heading(j.p, Math.min(0.999, Math.max(0.001, k)))) * j.turn - r0);   // a hop hardly turns it
        var rot = mix(r0, hd, smooth(0, 0.2, tt));
        var g = j.long ? smooth(0.3, 0.4, tt) * (1 - smooth(0.62, 0.72, tt)) : 0;    // a short glide on longer flights
        var in0 = j.lift ? 1 : smooth(0, 0.18, tt);                             // from what it was doing before
        g = mix(j.lift ? 0 : f.glide, g, in0);
        var beat = j.lift ? 30 : Math.max(f.amp / Math.max(0.05, 1 - f.glide), 20);
        p = { x: at[0], y: at[1], rot: mix(rot, rot - wrap(rot), smooth(0.8, 1, tt)),
              scale: mix(j.lift ? 1 : f.scale, 1, smooth(0, 0.25, tt)) - 0.06 * j.far * Math.sin(Math.PI * tt),
              amp: mix(beat, 30, smooth(0, 0.15, tt)) * (1 - g), glide: g,
              fold: (j.lift ? 0 : f.fold) * (1 - smooth(0, 0.25, tt)), hz: 5.4 + 1.4 * smooth(0.65, 0.85, tt),
              bank: (j.lift ? 0 : f.bank) * (1 - smooth(0, 0.2, tt)) };
      } else if (ms < j.lift + j.dur + j.down) {                                // land: slowing beats, settle, fold
        var tg = (ms - j.lift - j.dur) / j.down;
        p = { x: j.to[0], y: mix(j.p[3][1], j.to[1], outQuad(tg)), rot: 0, scale: 1, amp: 30 * Math.pow(1 - tg, 1.4), glide: 0,
              fold: j.land === 'perch' ? smooth(0.25, 1, tg) : 0, hz: 6.4 };
      } else {                                                                  // landed
        job = null; raf = 0; landed = t;
        if (j.land === 'home') {
          state = 'home';
          if (hot === BIRD) spent = BIRD;        // it came home to the pointer: that does not frighten it
        } else {
          state = 'perched';
          spot = j.to;
        }
        still();
        think();
        return;
      }
    }
    phase += 2 * Math.PI * p.hz * dt;
    if (dt) { vel[0] = (p.x - now.x) / dt; vel[1] = (p.y - now.y) / dt; }
    now = p;
    draw(p);
    raf = requestAnimationFrame(frame);
  }

  // ---------- where its attention goes ----------
  var BIRD = {};                                 // the bird itself, pointed at in its place
  var QUOTE = document.querySelector('.closing em');   // the closing quote: it circles it
  // the statement's links to papers, each with the figure of its paper in the list: the paper it links to by
  // #id, or the one that carries a link to the same address
  var LEADS = [].map.call(document.querySelectorAll('.statement a[href]'), function (a) {
    var href = a.getAttribute('href'), pub = null;
    if (href.charAt(0) === '#') pub = document.getElementById(href.slice(1));
    else [].some.call(document.querySelectorAll('.pub a[href]'), function (b) { return b.getAttribute('href') === href && (pub = b.closest('.pub')); });
    return [a, pub && pub.classList.contains('pub') ? pub.querySelector('.pub-fig') : null];
  });
  var WORDS = '.masthead h1 a, .masthead nav a, .section-head h2';
  var px = 0, py = 0, pt = 0, has = false, speed = 0;   // the pointer: where, when, whether known, how fast
  var hot = null, hotAt = 0, calmAt = 0, awayAt = 0, spent = null, timer = 0;
  var settle = SETTLE, linger = LINGER, away = AWAY;   // this time's waits: never quite the same twice

  function visible() { return bird.offsetWidth > 0; }   // hidden on narrow screens
  function isFig(t) { return !!t && t.nodeType === 1 && t.classList.contains('pub-fig'); }
  function atHome() { return state === 'home' && !seat; }
  function inWords(el, x, y) {
    var r = document.createRange();
    r.selectNodeContents(el);
    var rs = r.getClientRects();
    for (var i = 0; i < rs.length; i++) {
      if (x >= rs[i].left - 3 && x <= rs[i].right + 3 && y >= rs[i].top - 3 && y <= rs[i].bottom + 3) return true;
    }
    return false;
  }
  // what the pointer is on: something to perch on, the bird itself, or nothing
  function under(x, y) {
    var el = document.elementFromPoint(x, y);
    if (!el || !el.closest) return null;
    if (bird.contains(el)) return BIRD;
    if (QUOTE && QUOTE.contains(el)) return QUOTE;
    var paper = el.closest('.pub');                                            // anywhere on a paper: its figure
    if (paper) return paper.querySelector('.pub-fig');
    var lead = el.closest('.statement a');                                     // a link to a paper: that paper's figure
    for (var i = 0; lead && i < LEADS.length; i++) if (LEADS[i][0] === lead) return LEADS[i][1];
    var t = el.closest(WORDS);
    return t && inWords(t, x, y) ? t : null;                                   // a heading: only its words
  }
  function point(h, t) {                         // the pointer has moved onto h (or onto nothing)
    if (h === hot) return;
    hot = h; hotAt = t; spent = null;
    settle = vary(SETTLE, 0.85, 1.35); linger = vary(LINGER, 0.9, 1.2); away = vary(AWAY, 0.85, 1.35);
    if (!h || (h === BIRD && !atHome())) awayAt = t;
    else if (h !== seat && (h !== BIRD || atHome())) stir(h);
  }
  // go to what the pointer has settled on; go home once it has been on nothing for a while
  function think() {
    clearTimeout(timer);
    timer = 0;
    if (!visible() || (job && job.kind === 'play')) return;       // at play, nothing else catches its eye
    var t = performance.now(), h = hot, at;
    if (h === BIRD && !atHome()) h = null;       // its place, while it is away: nothing to it
    if (h && h !== seat && h !== spent) {
      at = Math.min(Math.max(hotAt, calmAt) + settle, hotAt + (h === QUOTE ? GLANCE : linger));
      if (state === 'home' || state === 'perched') at = Math.max(at, landed + HOP);
      if (t >= at) {
        spent = h;
        if (h === BIRD || h === QUOTE) play(h); else go(h);
        return;
      }
    } else if (!h && seat && state === 'perched') {
      at = Math.max(awayAt + away, landed + SIT);
      if (t >= at) { go(null); return; }
    } else return;
    timer = setTimeout(think, at - t + 5);
  }
  function go(t) {
    seat = t;
    if (!t) fly([0, 0], 'home');
    else fly(isFig(t) ? onFigure(t) : onWord(t), 'perch');
  }
  // ---------- at play ----------
  // Rested on in its place, it chases the pointer: flies after it and circles it twice. Run the pointer along the
  // closing quote and it flies over and circles the words three times. Then it flies home.
  // It steers rather than follows: it has a velocity, a top speed and a limit on how hard it can speed up, brake
  // or turn, so it moves in arcs, wider the faster it goes, and banks into them; it holds its speed down on tight
  // bends. To circle, it steers for a point a little way round ahead of itself. Round the pointer it aims at where
  // the pointer has been over the last moment, not where it is this instant, and that aim can only move so fast: a
  // shaken pointer hardly moves it, a flung one pulls it along and it swings round after it. That circle is seen
  // at a slant, wider than tall (flatter still near the top of the page, so the pointer stays in the middle of
  // it). Round the quote it flies a racetrack that keeps the same distance from the words all the way round:
  // fast along the straights, slower round the ends. On the near side of either it is a little bigger. It flaps
  // while it has work to do and glides now and then while it is only keeping up. Home is flown the same way: it
  // turns for home in an arc, comes in as fast as it can still brake in time, and settles. Chasing, it gives up and
  // goes home if the pointer leaves the window, or if it cannot get its circles in.
  var TOP = 1100, PULL = 5200;                   // its top speed (px/s), and its most acceleration (px/s²)
  function play(what) {                          // what: BIRD (chase the pointer) or QUOTE
    seat = null;
    var h0 = home(), w = bird.offsetWidth, sitting = state === 'home' || state === 'perched';
    var sp = Math.hypot(vel[0], vel[1]), k = sp > TOP ? TOP / sp : 1;
    job = { kind: 'play', what: what, phase: 'play', start: performance.now(), h0: h0, from: copy(now),
            laps: what === BIRD ? 2 : 3, stop: what === BIRD ? 7000 : 16000,  // how many circles, and when to give up
            rx: 1.2 * w, ry: 0.86 * w,                                         // the circle round the pointer (it flies a little inside it)
            b: [now.x, now.y], v: sitting ? [0, -90] : [vel[0] * k, vel[1] * k],   // where it is, and its velocity: springing up, or as it was
            aim: [px + window.pageXOffset - h0[0], py + window.pageYOffset - h0[1]], av: [0, 0], c: null,   // the aim, and how fast it is moving
            way: Math.random() < 0.5 ? 1 : -1,                                 // which way round
            round: 0, a: null, rot: now.rot, glide: now.glide, bank: now.bank || 0, scale: now.scale, effort: 1, amp: now.amp };
    state = 'flying';
    bird.classList.add('flying');
    run();
  }
  // a point on a racetrack (middle cx, cy; straights 2A long, ends of radius R), s along it from the left end of
  // the top straight, clockwise: [x, y, 1 if on an end]
  function track(cx, cy, A, R, s) {
    var P = 4 * A + 2 * Math.PI * R, th;
    s = ((s % P) + P) % P;
    if (s < 2 * A) return [cx - A + s, cy - R, 0];
    s -= 2 * A;
    if (s < Math.PI * R) { th = -Math.PI / 2 + s / R; return [cx + A + R * Math.cos(th), cy + R * Math.sin(th), 1]; }
    s -= Math.PI * R;
    if (s < 2 * A) return [cx + A - s, cy + R, 0];
    s -= 2 * A; th = Math.PI / 2 + s / R;
    return [cx - A + R * Math.cos(th), cy + R * Math.sin(th), 1];
  }
  function playing(j, t, dt) {                   // a frame of play: its pose; j.done once it is home
    var ms = t - j.start, ease = function (tau) { return 1 - Math.exp(-dt / tau); };
    var w = bird.offsetWidth, h = bird.offsetHeight, wx, wy, near = 0, dy = 0, n = 9, a;
    if (j.phase === 'play' && ((j.what === BIRD && !has) || ms > j.stop || j.round >= j.laps)) {
      j.phase = 'home'; j.homeAt = t;
      spent = hot;                               // what the pointer is on now does not draw it straight back out
    }
    if (j.phase === 'land') {                    // settling at home: slowing beats, upright
      var tg = Math.min(1, (t - j.landAt) / 380);
      if (tg >= 1) { j.done = true; return pose(); }
      return { x: mix(j.lb[0], 0, smooth(0, 0.6, tg)), y: mix(j.lb[1], 0, outQuad(tg)), rot: mix(j.lr, j.lr - wrap(j.lr), smooth(0, 0.7, tg)),
               scale: mix(j.ls, 1, tg), amp: j.amp * Math.pow(1 - tg, 1.4), glide: 0, fold: 0, hz: 6.4, bank: j.bank * (1 - tg) };
    }
    if (j.phase === 'play' && j.what === BIRD) {
      // the aim: the pointer, smoothed, and never moving faster than 1500 px/s
      var mx = (px + window.pageXOffset - j.h0[0] - j.aim[0]) * ease(0.16), my = (py + window.pageYOffset - j.h0[1] - j.aim[1]) * ease(0.16);
      var ml = Math.hypot(mx, my), cap = 1500 * dt;
      if (ml > cap) { mx *= cap / ml; my *= cap / ml; }
      j.aim[0] += mx; j.aim[1] += my;
      if (dt) { j.av[0] += (mx / dt - j.av[0]) * ease(0.1); j.av[1] += (my / dt - j.av[1]) * ease(0.1); }
      // the circle round the aim, flattened or narrowed where the page runs out
      var pw = document.documentElement.clientWidth, ax = j.aim[0] + j.h0[0], ay = j.aim[1] + j.h0[1];   // the aim on the page
      var rx = Math.max(0.5 * j.rx, Math.min(j.rx, ax - 0.45 * w, pw - ax - 0.45 * w));
      var ry = Math.max(0.45 * j.ry, Math.min(j.ry, ay - 0.45 * h));
      var cx = Math.max(-j.h0[0] + rx + 0.45 * w, Math.min(pw - j.h0[0] - rx - 0.45 * w, j.aim[0]));
      var cy = Math.max(-j.h0[1] + ry + 0.45 * h, j.aim[1]);
      // it steers for a point a little way round the circle ahead of it, keeping pace with the circle
      var dx = j.b[0] - cx;
      a = Math.atan2((j.b[1] - cy) / ry, dx / rx);
      dy = j.b[1] - cy; n = Math.hypot(dx / rx, dy / ry);
      var gx = cx + rx * Math.cos(a + 0.8 * j.way), gy = cy + ry * Math.sin(a + 0.8 * j.way);
      wx = j.av[0] + (gx - j.b[0]) * 7.5; wy = j.av[1] + (gy - j.b[1]) * 7.5;
      dy /= ry;
    } else if (j.phase === 'play') {
      // round the words: a racetrack keeping the same distance from them all the way round
      // m clear of the words; closer above or below where the window runs out, so it stays in sight
      var r = j.what.getBoundingClientRect(), m = 0.6 * w, pw2 = document.documentElement.clientWidth;
      var top = r.top - Math.max(0.15 * w, Math.min(m, r.top - 0.65 * w));
      var bot = r.bottom + Math.max(0.15 * w, Math.min(m, window.innerHeight - r.bottom - 0.65 * w)), R = (bot - top) / 2;
      // its ends: m clear of the words, but never so far out that the bird would leave the page
      var xa = Math.max(r.left - m + R, 0.7 * w + R), xb = Math.min(r.right + m - R, pw2 - 0.7 * w - R);
      if (xb < xa) xa = xb = (xa + xb) / 2;
      var qx = (xa + xb) / 2 + window.pageXOffset - j.h0[0], qy = (top + bot) / 2 + window.pageYOffset - j.h0[1];
      if (j.c && dt) { j.av[0] += ((qx - j.c[0]) / dt - j.av[0]) * ease(0.1); j.av[1] += ((qy - j.c[1]) / dt - j.av[1]) * ease(0.1); }
      j.c = [qx, qy];                            // (the column it is in can slide as the page scrolls: it keeps pace)
      var A = (xb - xa) / 2, P = 4 * A + 2 * Math.PI * R;
      var tx = j.b[0] - qx, ty = j.b[1] - qy, s, d, end = Math.abs(tx) > A;
      if (!end) { d = Math.abs(ty); s = ty < 0 ? A + tx : 2 * A + Math.PI * R + A - tx; }
      else {
        var ox = tx > 0 ? A : -A, th = Math.atan2(ty, tx - ox);
        d = Math.hypot(tx - ox, ty);
        s = tx > 0 ? 2 * A + (th + Math.PI / 2) * R : 4 * A + Math.PI * R + ((th < 0 ? th + 2 * Math.PI : th) - Math.PI / 2) * R;
      }
      var g = track(qx, qy, A, R, s + j.way * Math.max(40, Math.min(70, 0.9 * R)));
      wx = j.av[0] + (g[0] - j.b[0]) * 18; wy = j.av[1] + (g[1] - j.b[1]) * 18;
      n = d / R; dy = ty / R; a = s / P * 2 * Math.PI;
      if (n < 2 && (end || g[2])) {              // on or nearing an end: no faster than it can turn there
        var bend = Math.sqrt(0.9 * PULL * R), rel = Math.hypot(wx - j.av[0], wy - j.av[1]);
        if (rel > bend) { wx = j.av[0] + (wx - j.av[0]) * bend / rel; wy = j.av[1] + (wy - j.av[1]) * bend / rel; }
      }
    } else {
      // home: for a point just above it, as fast as it can go and still brake in time
      var ex = -j.b[0], ey = -0.11 * h - j.b[1], ed = Math.hypot(ex, ey) || 1e-6, sp0 = Math.hypot(j.v[0], j.v[1]);
      if ((ed < 5 && sp0 < 160) || t - j.homeAt > 5000) {
        j.phase = 'land'; j.landAt = t; j.lb = [j.b[0], j.b[1]]; j.lr = j.rot; j.ls = j.scale;
        return playing(j, t, 0);
      }
      var vd = Math.min(TOP, Math.sqrt(PULL * ed));
      wx = ex / ed * vd; wy = ey / ed * vd;
      near = smooth(50, 8, ed);                  // close in: it turns upright to land
    }
    if (j.phase === 'play') {                    // the way round, counted only while it is on its circle
      if (j.a !== null && n > 0.5 && n < 1.6) j.round += wrapR(a - j.a) * j.way / (2 * Math.PI);
      j.a = a;
    }
    var wv = Math.hypot(wx, wy);
    if (wv > TOP) { wx *= TOP / wv; wy *= TOP / wv; }
    // it changes its velocity only so fast: arcs, never jerks
    var dvx = wx - j.v[0], dvy = wy - j.v[1], dvl = Math.hypot(dvx, dvy), most = PULL * dt;
    j.effort += (Math.min(1, dvl / 800) - j.effort) * ease(0.15);
    if (dvl > most) { dvx *= most / dvl; dvy *= most / dvl; }
    j.v[0] += dvx; j.v[1] += dvy;
    j.b[0] += j.v[0] * dt; j.b[1] += j.v[1] * dt;
    var sp = Math.hypot(j.v[0], j.v[1]);
    // its body points the way it flies; when it is nearly still that way means little, so it turns lazily
    var want = mix(wrap(Math.atan2(j.v[0], -j.v[1]) * 180 / Math.PI - j.rot), wrap(-j.rot), near);
    j.rot += Math.max(-2000 * dt, Math.min(2000 * dt, want * ease(mix(0.25, 0.008, smooth(30, 150, sp)))));
    // it banks into the turn
    var side = sp > 1 && dt ? (j.v[0] * dvy - j.v[1] * dvx) / (sp * dt) : 0;    // its sideways acceleration
    j.bank += (0.22 * Math.max(-1, Math.min(1, side / 4000)) - j.bank) * ease(0.08);
    // flaps while it works; glides now and then while it is only keeping up
    var rhythm = smooth(0.35, 0.95, Math.sin(ms / 1000 * 2 * Math.PI * 0.85));
    j.glide += (rhythm * clamp(1 - j.effort / 0.4) * (1 - near) - j.glide) * ease(0.08);
    // a little bigger on the near side of the circle
    j.scale += (1 + 0.065 * Math.max(-1, Math.min(1, dy)) * clamp(1.6 - n) - j.scale) * ease(0.1);
    j.amp = mix(j.from.amp, (30 + 5 * j.effort) * (1 - j.glide), smooth(0, 120, ms));
    return { x: j.b[0], y: j.b[1], rot: j.rot, scale: j.scale, amp: j.amp, glide: j.glide,
             fold: j.from.fold * (1 - smooth(0, 180, ms)), hz: 5.8 + 2 * j.effort, bank: j.bank };
  }

  document.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    var x = e.clientX, y = e.clientY, t = performance.now();
    if (has && x === px && y === py) return;     // the page scrolled under a still pointer: not a move
    if (has) {
      var dt = Math.max(1, t - pt);
      speed += (Math.hypot(x - px, y - py) / dt - speed) * (1 - Math.exp(-dt / 50));
    } else speed = 1;
    if (speed > STILL) calmAt = t;
    px = x; py = y; pt = t; has = true;
    point(under(x, y), t);
    think();
  }, { passive: true });
  window.addEventListener('scroll', function () {
    // something slid out from under a still pointer before the bird went to it: forget it
    if (!has || !hot || hot === seat || hot === spent || (hot === BIRD && !atHome())) return;
    if (under(px, py) !== hot) { point(null, performance.now()); think(); }
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', function () {
    has = false;
    point(null, performance.now());
    think();
  });
  // touch screens have no pointer to watch: a tap counts as a settled look
  var tap = null;
  document.addEventListener('pointerdown', function (e) {
    tap = e.pointerType === 'touch' ? [e.clientX, e.clientY, performance.now()] : null;
  }, { passive: true });
  document.addEventListener('pointercancel', function () { tap = null; }, { passive: true });
  document.addEventListener('pointerup', function (e) {
    var a = tap, t = performance.now();
    tap = null;
    if (!a || e.pointerType !== 'touch' || Math.hypot(e.clientX - a[0], e.clientY - a[1]) > 12 || t - a[2] > 600) return;
    px = e.clientX; py = e.clientY; has = true;
    point(under(px, py), t);
    hotAt = calmAt = t - LINGER;
    think();
  }, { passive: true });

  // the page changed shape under it: back home at once
  var width = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === width) return;     // only the height changed (a phone's toolbars)
    width = window.innerWidth;
    clearTimeout(timer);
    if (raf) cancelAnimationFrame(raf);
    raf = 0; job = null; state = 'home'; seat = null; spent = hot;
    still();
  });
})();
