/* =========================================================
   设置模块：外观（玻璃厚度 / 镜面光 / 背景流线）与交互开关
   配置写入 localStorage，页面刷新后保留
   ========================================================= */
(function () {
  const KEY = 'fx.settings.v1';
  const DEFAULTS = {
    material: 'regular',   // clear | regular | thick
    light: true,           // 镜面光跟随指针
    lines: true,           // 背景金属流线
    flow: true,            // 条纹流动动画
    autoFlip: true,        // 投币后自动翻面
    autoHist: true         // 翻到背面时展开历史记录
  };

  let data = Object.assign({}, DEFAULTS);
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) data = Object.assign(data, JSON.parse(raw));
  } catch (e) { /* localStorage 不可用时忽略 */ }

  const listeners = [];
  const api = {
    get(k) { return data[k]; },
    all() { return Object.assign({}, data); },
    set(k, v) { data[k] = v; save(); apply(); },
    reset() { data = Object.assign({}, DEFAULTS); save(); apply(); },
    onChange(fn) { listeners.push(fn); }
  };
  window.FX = api;

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* 忽略 */ }
    listeners.forEach((fn) => { try { fn(api.all()); } catch (e) { /* 忽略 */ } });
  }

  /* ---------- 应用到页面 ---------- */
  function apply() {
    const b = document.body;
    b.classList.remove('mat-clear', 'mat-regular', 'mat-thick');
    b.classList.add('mat-' + data.material);
    b.classList.toggle('no-light', !data.light);
    b.classList.toggle('no-lines', !data.lines);
    b.classList.toggle('stripe-flow', !!data.flow);

    const box = document.getElementById('setMaterial');
    if (box) {
      box.querySelectorAll('.seg-item').forEach((btn) =>
        btn.classList.toggle('active', btn.dataset.mat === data.material));
      moveThumb(box, 'matThumb');
    }
    const map = { setLight: 'light', setLines: 'lines', setAutoFlip: 'autoFlip', setAutoHist: 'autoHist' };
    Object.keys(map).forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.checked = !!data[map[id]];
    });
  }

  /* ---------- 分段控件滑块 ---------- */
  function moveThumb(box, thumbId) {
    const active = box.querySelector('.seg-item.active');
    const thumb = document.getElementById(thumbId);
    if (!active || !thumb) return;
    thumb.style.width = active.offsetWidth + 'px';
    thumb.style.setProperty('--tx', active.offsetLeft + 'px');
  }

  /* ---------- 面板开合 ---------- */
  function togglePanel(force) {
    const panel = document.getElementById('settingsPanel');
    if (!panel) return;
    const open = force === undefined ? panel.hidden : force;
    panel.hidden = !open;
    if (open) {
      requestAnimationFrame(() => moveThumb(document.getElementById('setMaterial'), 'matThumb'));
    }
  }

  function bindPanel() {
    const panel = document.getElementById('settingsPanel');
    const btn = document.getElementById('settingsBtn');
    if (!panel || !btn) return;

    btn.addEventListener('click', (e) => { e.stopPropagation(); togglePanel(); });
    document.getElementById('settingsClose').addEventListener('click', () => togglePanel(false));
    document.addEventListener('click', (e) => {
      if (panel.hidden) return;
      if (e.target.closest('#settingsPanel') || e.target.closest('#settingsBtn')) return;
      togglePanel(false);
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') togglePanel(false); });

    document.getElementById('setMaterial').addEventListener('click', (e) => {
      const b = e.target.closest('.seg-item');
      if (!b) return;
      api.set('material', b.dataset.mat);
    });

    [['setLight', 'light'], ['setLines', 'lines'], ['setFlow', 'flow'],
     ['setAutoFlip', 'autoFlip'], ['setAutoHist', 'autoHist']].forEach(([id, key]) => {
      document.getElementById(id).addEventListener('change', (e) => api.set(key, e.target.checked));
    });

    document.getElementById('setReset').addEventListener('click', () => api.reset());
  }

  function boot() {
    apply();
    bindPanel();
    window.addEventListener('resize', () => {
      const box = document.getElementById('setMaterial');
      if (box && !document.getElementById('settingsPanel').hidden) moveThumb(box, 'matThumb');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
