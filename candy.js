/* =========================================================
   闪卡挑战：Apple 加工闪卡
   自定义 f(x) → 投币 x → 产出糖 → 历史记录
   ========================================================= */

(function () {
  const $ = (id) => document.getElementById(id);
  const DEVICE = '📱';
  const records = [];

  /* ---------- tab 切换（右侧分段控件） ---------- */
  const tabsEl = $('tabs');
  const thumbEl = $('segThumb');
  let curIndex = 0;

  function moveThumb() {
    const active = document.querySelector('#tabs .seg-item.active');
    if (!active) return;
    thumbEl.style.width = active.offsetWidth + 'px';
    thumbEl.style.setProperty('--tx', active.offsetLeft + 'px');
    curIndex = [...tabsEl.querySelectorAll('.seg-item')].indexOf(active);
  }

  function showView(v) {
    const flash = v === 'flash';
    $('view-super').hidden = flash;
    $('view-flash').hidden = !flash;
    document.querySelectorAll('#tabs .seg-item').forEach((b) =>
      b.classList.toggle('active', b.dataset.view === v));
    moveThumb();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.querySelectorAll('#tabs .seg-item').forEach((b) =>
    b.addEventListener('click', () => showView(b.dataset.view)));

  window.addEventListener('resize', moveThumb);
  window.addEventListener('load', moveThumb);
  requestAnimationFrame(moveThumb);
  moveThumb();

  /* ---------- 长按滑动切换：按住放大，左右拖动在「加工 / 闪卡」间滑动 ---------- */
  const items = [...tabsEl.querySelectorAll('.seg-item')];
  let drag = null;
  let suppressClick = false;

  tabsEl.addEventListener('pointerdown', (e) => {
    if (e.target.closest('input, textarea, select')) return;
    const item = e.target.closest('.seg-item');
    if (!item) return;
    tabsEl.classList.add('pressed');
    thumbEl.style.setProperty('--ts', '1.18');   // 圆圈按下时放大（比原翻圈更大）
    const cs = getComputedStyle(thumbEl);
    drag = {
      x0: e.clientX,
      tx0: parseFloat(cs.getPropertyValue('--tx')) || 0,
      pid: e.pointerId,
      moved: false
    };
    tabsEl.classList.add('dragging');
    try { tabsEl.setPointerCapture(e.pointerId); } catch (_) {}
  });

  tabsEl.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.pid) return;
    const dx = e.clientX - drag.x0;
    if (Math.abs(dx) > 5) drag.moved = true;
    const minX = items[0].offsetLeft;
    const maxX = items[items.length - 1].offsetLeft;
    const tx = Math.max(minX, Math.min(maxX, drag.tx0 + dx));
    thumbEl.style.setProperty('--tx', tx + 'px');
  });

  function endDrag(e) {
    if (!drag) return;
    const dx = e.clientX - drag.x0;
    tabsEl.classList.remove('pressed', 'dragging');
    thumbEl.style.setProperty('--ts', '1');
    if (drag.moved) {
      // 向左拖 → 上一项；向右拖 → 下一项
      const target = dx < -6 ? Math.max(0, curIndex - 1)
                             : dx > 6 ? Math.min(items.length - 1, curIndex + 1)
                             : curIndex;
      showView(items[target].dataset.view);
      suppressClick = true;                       // 拖动后吞掉随之而来的 click，避免重复切换
      setTimeout(() => { suppressClick = false; }, 80);
    }
    drag = null;
  }
  tabsEl.addEventListener('pointerup', endDrag);
  tabsEl.addEventListener('pointercancel', endDrag);
  // 捕获阶段拦截 click：拖动触发的 click 直接取消，不影响正常点击
  tabsEl.addEventListener('click', (e) => {
    if (suppressClick) { e.stopPropagation(); e.preventDefault(); }
  }, true);

  /* ---------- 历史记录：独立按钮开合 ---------- */
  function setHist(open) {
    const body = $('flashBody');
    body.classList.toggle('hist-open', open);
    const btn = $('histToggle');
    btn.classList.toggle('on', open);
    btn.setAttribute('aria-pressed', String(open));
  }
  const histOpen = () => $('flashBody').classList.contains('hist-open');
  $('histToggle').addEventListener('click', () => setHist(!histOpen()));

  /* ---------- 三张隐藏公式卡 ---------- */
  const FORMS = [
    { text: 'y = 7x − 5',      f: x => 7 * x - 5 },
    { text: 'y = 4x + 13',     f: x => 4 * x + 13 },
    { text: 'y = 4.5x − 5.3',  f: x => 4.5 * x - 5.3 }
  ];
  const cards = [...document.querySelectorAll('#cardSlot .candy-card')];

  function renderCard(i, x) {
    const y = FORMS[i].f(x);
    $('cbX' + i).textContent = '投币 x = ' + x;
    const count = Math.round(y);
    $('cbOut' + i).textContent = y < 0
      ? '0 台设备（参数不足，停线）'
      : `产出 ${count} 台设备`;
    const n = Math.max(0, Math.min(count, 12));
    $('cbIcons' + i).innerHTML = (count > 0 ? DEVICE.repeat(n) : '🚫') +
      (count > 12 ? `<span class="cb-more">+${count - 12}</span>` : '');
  }

  /* ---------- 翻面：单卡点翻 / 投币全翻 ---------- */
  function anyFlipped() { return cards.some(c => c.classList.contains('flipped')); }
  function syncState() {
    const f = anyFlipped();
    $('flashBody').classList.toggle('card-right', f);
    if (!window.FX || FX.get('autoHist')) setHist(f);
  }
  function flipCard(card, on) {
    card.classList.toggle('flipped', on === undefined ? !card.classList.contains('flipped') : on);
    syncState();
  }
  cards.forEach(c => c.addEventListener('click', (e) => {
    if (e.target.closest('input, button')) return;
    flipCard(c);
  }));
  function revealAll(on) { cards.forEach(c => flipCard(c, on)); }

  /* ---------- 提示 ---------- */
  function hint(text, cls) {
    const n = $('cxHint');
    n.textContent = text;
    n.className = 'candy-hint ' + (cls || '');
  }

  /* ---------- 投币（任意数字，2-6 为快捷选数） ---------- */
  function curX() { return Number($('cxNum').value); }
  function renderAll() { FORMS.forEach((_, i) => renderCard(i, curX())); }
  function setActive(x) {
    document.querySelectorAll('#numPick .np').forEach(b =>
      b.classList.toggle('active', Number(b.dataset.x) === x));
  }
  function shoot() {
    const raw = $('cxNum').value.trim();
    const x = Number(raw);
    if (raw === '' || !Number.isFinite(x)) return hint('投币 x 要填一个数字', 'err');
    renderAll();
    const ys = FORMS.map(f => Math.max(0, Math.round(f.f(x))));
    addRecord(x, ys);

    const autoFlip = !window.FX || FX.get('autoFlip');
    if (autoFlip) revealAll(true);
    hint(autoFlip
      ? `✅ 已投币！三张卡片的产出已揭晓（x = ${x}）`
      : '✅ 已投币！点任意卡片翻面看产出', 'ok');
  }

  /* ---------- 历史记录 ---------- */
  function addRecord(x, ys) {
    records.unshift({ x, ys });
    if (records.length > 30) records.pop();
    renderHistory();
  }

  function renderHistory() {
    const box = $('cxHist');
    $('cxCount').textContent = records.length ? `共 ${records.length} 条` : '';
    $('histBadge').textContent = records.length;
    $('histBadge').hidden = records.length === 0;
    if (!records.length) {
      box.innerHTML = '<div class="empty">还没有投币记录</div>';
      return;
    }
    box.innerHTML = records.map((r, i) => `
      <button class="rec" data-i="${i}">
        <span class="rec-l">x = ${r.x}</span>
        <span class="rec-r">${r.ys.join(' / ')}</span>
      </button>`).join('');

    box.querySelectorAll('.rec').forEach((b) =>
      b.addEventListener('click', () => {
        const r = records[+b.dataset.i];
        $('cxNum').value = r.x;
        setActive(r.x);
        renderAll();
        revealAll(true);
        hint('已填入这条记录', '');
      }));
  }

  /* ---------- 绑定 ---------- */
  $('cxShoot').addEventListener('click', shoot);
  $('cxClear').addEventListener('click', () => { records.length = 0; renderHistory(); hint('历史记录已清空', ''); });

  const numPick = $('numPick');
  numPick.querySelectorAll('.np').forEach(b => b.addEventListener('click', () => {
    $('cxNum').value = b.dataset.x;
    setActive(Number(b.dataset.x));
    renderAll();
    hint(`已选 x = ${b.dataset.x}，点投币看三张卡片的产出`, '');
  }));
  $('cxNum').addEventListener('input', () => {
    const x = curX();
    if (Number.isFinite(x)) { setActive(x); renderAll(); }   // 已翻开的卡片实时更新
  });
  $('cxNum').addEventListener('keydown', (e) => { if (e.key === 'Enter') shoot(); });

  /* 初始：用默认 x = 4 渲染三张卡的背面 */
  setActive(4); renderAll();
  renderHistory();
})();
