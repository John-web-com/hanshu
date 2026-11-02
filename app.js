/* =========================================================
   几倍工厂：f(x) = k × x
   输入数字 → 放大 k 倍 → 把结果再投进去 → 再放大 k 倍
   ========================================================= */

const $ = (id) => document.getElementById(id);

const state = {
  round: 0,      // 投了几次
  totalK: 1,     // 累计倍数 k^n
  last: null,    // 上一次的产出
  base: null,    // 最开始投进去的数字
  chain: []      // 每一步记录
};

const clean = (v) => Math.round(v * 1e6) / 1e6;
const fmt = (v) => clean(v).toLocaleString('en-US');
const fmtK = (v) => String(clean(v));
const pctText = (k) => `${clean(k * 100)}%`;
const chengText = (k) => `${clean(k * 10)} 成`;

function parseNums(raw) {
  return raw.split(/[\s,，、;；]+/).filter(Boolean).map(Number);
}

function hint(text, cls) {
  const n = $('hint');
  n.textContent = text;
  n.className = 'hint ' + (cls || '');
}

function currentK() {
  const raw = $('kIn').value.trim();
  if (raw === '') return null;
  const k = Number(raw);
  return Number.isFinite(k) ? k : null;
}

/* ---------- 加工 ---------- */
function run(again) {
  const raw = $('numIn').value.trim();
  const k = currentK();
  if (k === null) return hint('倍数要填数字，例如 2 或 1.5', 'err');

  let xs;
  if (again) {
    if (!state.last) return hint('先点「加工一次」产出结果', 'err');
    xs = state.last.slice();
  } else {
    xs = parseNums(raw);
    if (!xs.length) return hint('先投一个数字进去', 'err');
    if (xs.some((v) => !Number.isFinite(v))) return hint('只能投数字，多个用空格或逗号隔开', 'err');
    if (xs.length > 6) xs = xs.slice(0, 6);
  }

  if (!again) {              // 新一轮：重置链条
    state.base = xs.slice();
    state.totalK = 1;
    state.chain = [];
    state.round = 0;
  }

  state.round += 1;
  state.totalK = clean(state.totalK * k);
  const ys = xs.map((x) => clean(x * k));
  state.last = ys;

  state.chain.push({
    round: state.round,
    k,
    total: state.totalK,
    xs: xs.slice(),
    ys: ys.slice()
  });

  $('numIn').value = ys.join(' ');   // 产出自动填回输入框，方便再投一次
  render();
  hint(`第 ${state.round} 次加工：×${fmtK(k)}，产出已填回输入框，可继续投`, 'ok');
}

function reset() {
  state.round = 0; state.totalK = 1; state.last = null; state.base = null; state.chain = [];
  $('numIn').value = '3';
  $('flow').textContent = '—';
  $('timesBig').textContent = '×' + fmtK(currentK() ?? 2);
  $('pct').textContent = '等待第一次加工';
  $('chain').innerHTML = '<div class="empty">还没有加工记录，先点「加工一次」</div>';
  $('final').hidden = true;
  hint('已重置，重新投一个数字试试', '');
}

/* ---------- 渲染 ---------- */
function render() {
  const last = state.chain[state.chain.length - 1];
  if (!last) return;

  $('flow').textContent = `${last.xs.map(fmt).join(', ')} → ${last.ys.map(fmt).join(', ')}`;
  $('timesBig').textContent = '×' + fmtK(last.k);
  $('pct').textContent =
    `是原来的 ${pctText(state.totalK)} · ${chengText(state.totalK)}`;

  $('chain').innerHTML = state.chain.map((r) => `
    <div class="row">
      <span class="r-no">第 ${r.round} 次</span>
      <span class="r-k">×${fmtK(r.k)}</span>
      <span class="r-flow">${r.xs.map(fmt).join(', ')} → ${r.ys.map(fmt).join(', ')}</span>
      <span class="r-total">累计 <b>×${fmtK(r.total)}</b></span>
    </div>`).join('');

  const base = state.base ? state.base.map(fmt).join(', ') : '—';
  $('final').hidden = false;
  $('finalText').textContent = `投了 ${state.round} 次（起始 x₀ = ${base}）：`;
  $('finalK').textContent = fmtK(state.totalK);
  $('finalPct').textContent = pctText(state.totalK);
  $('finalCheng').textContent = chengText(state.totalK);
  $('chainHint').textContent = `每投一次就再乘一个 k，现在累计 ×${fmtK(state.totalK)}`;
}

/* ---------- 倍数联动 ---------- */
function setK(v, syncInput) {
  const k = Number(v);
  if (!Number.isFinite(k)) return;
  if (syncInput) $('kIn').value = fmtK(k);
  const r = $('kRange');
  if (k >= +r.min && k <= +r.max) r.value = k;
  document.querySelectorAll('#quickK button').forEach((b) =>
    b.classList.toggle('on', Number(b.dataset.k) === k));
}

/* ---------- 事件 ---------- */
$('runBtn').addEventListener('click', () => {
  const raw = $('numIn').value.trim();
  const continuing = state.last && raw === state.last.join(' ');
  run(continuing);
});

$('againBtn').addEventListener('click', () => {
  if (!state.last) return hint('先点「加工一次」产出结果', 'err');
  $('numIn').value = state.last.join(' ');
  run(true);
});

$('resetBtn').addEventListener('click', reset);

$('kRange').addEventListener('input', (e) => setK(e.target.value, true));
$('kIn').addEventListener('input', (e) => setK(e.target.value, false));

document.querySelectorAll('#quickK button').forEach((b) =>
  b.addEventListener('click', () => { setK(b.dataset.k, true); hint('倍数已设为 ×' + fmtK(+b.dataset.k)); }));

document.querySelectorAll('#quickNum button').forEach((b) =>
  b.addEventListener('click', () => { $('numIn').value = b.dataset.v; hint('已填入：' + b.dataset.v); }));

[$('numIn'), $('kIn')].forEach((el) =>
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('runBtn').click(); }));

setK(2, true);
