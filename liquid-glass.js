/* =========================================================
   把页面元素升级为 SwiftUI Liquid Glass 材质
   自动套 material / tint / interactive，并让镜面光跟随光源
   ========================================================= */
(function () {
  /* 选择器 → material + tint + interactive */
  const MAP = [
    ['.topbar', 'lg-thin'],
    ['.settings-panel', 'lg-regular'],
    ['.hist-pane', 'lg-regular'],
    ['.seg', 'lg-thin'],
    ['.card', 'lg-regular'],
    ['.hist-card', 'lg-regular'],
    ['.candy-face', 'lg-regular'],
    ['.now', 'lg-thick'],
    ['.final', 'lg-thin lg-tint-green'],
    ['.formula', 'lg-thin'],
    ['.l-item', 'lg-thin'],
    ['.row', 'lg-thin'],
    ['.btn', 'lg-thin lg-interactive'],
    ['.btn.primary', 'lg-tint-silver'],
    ['.candy-btn', 'lg-tint-silver lg-interactive'],
    ['.clear-btn', 'lg-thin lg-interactive'],
    ['.quick button', 'lg-thin lg-interactive']
  ];

  const SKIP = ['INPUT', 'TEXTAREA', 'SELECT', 'BR'];

  function addGlass(el, extra) {
    if (!el.classList || SKIP.includes(el.tagName)) return;
    el.classList.add('glass');
    (extra || '').split(' ').forEach((c) => c && el.classList.add(c));
  }

  function decorate(root) {
    MAP.forEach(([sel, extra]) => {
      try {
        if (root.matches && root.matches(sel)) addGlass(root, extra);
        root.querySelectorAll(sel).forEach((el) => addGlass(el, extra));
      } catch (e) { /* 忽略非法选择器 */ }
    });
  }

  function boot() {
    decorate(document);
    document.querySelectorAll('#view-super, #view-flash').forEach((v) => v.classList.add('lg-container'));

    new MutationObserver((muts) => {
      muts.forEach((m) => {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === 1) decorate(n);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* ---------- 镜面光跟随指针（与 SwiftUI 的高光响应一致） ---------- */
  let px = innerWidth / 2, py = -80, queued = false;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function update() {
    queued = false;
    if (document.body.classList.contains('no-light')) return;
    const vh = innerHeight;
    document.querySelectorAll('.glass').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || r.bottom < -120 || r.top > vh + 120) return;
      const lx = ((px - r.left) / r.width) * 100;
      const ly = ((py - r.top) / r.height) * 100;
      el.style.setProperty('--lg-lx', clamp(lx, -60, 160).toFixed(1) + '%');
      el.style.setProperty('--lg-ly', clamp(ly, -60, 160).toFixed(1) + '%');
    });
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }

  addEventListener('pointermove', (e) => {
    px = e.clientX; py = e.clientY; schedule();
  }, { passive: true });
  addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (!t) return;
    px = t.clientX; py = t.clientY; schedule();
  }, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  update();
})();
