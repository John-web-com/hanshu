/* =========================================================
   iOS 27 液态手感
   按住 → 放大、变通透；往下拖 → 跟着变大；松手 → 弹簧回弹
   ========================================================= */
(function () {
  const SEL = '.seg-item, .btn, .candy-btn, .clear-btn, .candy-card, .card, .quick button, .rec';
  const LIFT = 0.055;   // 按下瞬间放大
  const MAX = 0.17;     // 下拉可放大的上限
  const THRESHOLD = 6;  // 超过这个位移算拖拽

  let el = null, y0 = 0, moved = false, pid = null;

  const damp = (dy) => {
    const t = dy / 340;
    return Math.max(-0.02, Math.min(MAX, t));
  };

  document.addEventListener('pointerdown', (e) => {
    if (e.button && e.button !== 0) return;
    const target = e.target.closest(SEL);
    if (!target || e.target.closest('input, textarea, select')) return;

    el = target; pid = e.pointerId; y0 = e.clientY; moved = false;
    el.classList.add('liquid-press');
    el.style.transition = 'transform .14s cubic-bezier(.2,.9,.25,1)';
    el.style.transform = `scale(${1 + LIFT})`;
  });

  document.addEventListener('pointermove', (e) => {
    if (!el || e.pointerId !== pid) return;
    const dy = e.clientY - y0;
    if (Math.abs(dy) > THRESHOLD) moved = true;
    el.style.transition = 'none';
    el.style.transform =
      `translateY(${dy * 0.22}px) scale(${1 + LIFT + damp(Math.max(0, dy))})`;
  });

  function release() {
    if (!el) return;
    const node = el;
    el = null; pid = null;
    node.classList.remove('liquid-press');
    node.style.transition = 'transform .58s cubic-bezier(.16,1.25,.3,1)';
    node.style.transform = '';
    setTimeout(() => { node.style.transition = ''; }, 620);
    if (moved) suppressClickOnce();
  }

  /* 拖拽后不要触发点击（iOS 同款行为） */
  let suppress = false;
  function suppressClickOnce() {
    suppress = true;
    setTimeout(() => { suppress = false; }, 60);
  }
  document.addEventListener('click', (e) => {
    if (!suppress) return;
    e.stopPropagation();
    e.preventDefault();
  }, true);

  document.addEventListener('pointerup', release);
  document.addEventListener('pointercancel', release);
  window.addEventListener('blur', release);
})();
