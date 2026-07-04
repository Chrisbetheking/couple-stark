import { SCENES, TOOLS, PROPS, BOUNDARY_ITEMS, DICE, WHEEL_PRESETS, BUILT_IN_CARDS, LEVEL_COPY } from './data.js';

const STORE_KEY = 'couple-spark-pro-v2';
const app = document.querySelector('#app');
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const defaultState = {
  accepted: false,
  lang: 'zh',
  p1: '你',
  p2: 'TA',
  maxLevel: 5,
  route: 'home',
  activeScene: 'warmup',
  history: [],
  selectedProps: [],
  customCards: [],
  customWheel: '',
  wheelPreset: 'spicy',
  wheelResult: '',
  wheelRotation: 0,
  diceResult: null,
  timerLeft: 60,
  timerTotal: 60,
  timerRunning: false,
  boundaries: {},
  lastCard: null,
};

let state = loadState();
let timerId = null;

const copy = {
  zh: {
    appName: '二人火花 Pro', tagline: '成年情侣线下互动 · 更大胆的内容库 · 本地隐私 PWA',
    adultTitle: '18+ 继续前确认', adultBody: '这里的内容面向已成年、清醒、自愿的情侣。所有任务都可以跳过、降级或立刻停止；不要偷拍、不要强迫、不要把隐私内容发给第三方。',
    adultA: '双方已成年且清醒', adultB: '任何一方可以随时说停', adultC: '只做共同 Yes 的内容', enter: '确认进入',
    names: '今晚称呼', p1: '你', p2: 'TA', save: '保存', comfort: '今晚默认尺度', comfortHelp: '已默认放开到 5 级；抽卡仍会尊重边界清单。',
    scenes: '玩法场景', tools: '工具箱', history: '今晚记录', emptyHistory: '还没有记录，先抽一张。',
    draw: '抽一张', again: '再来一张', softer: '降一级', bolder: '升一级', back: '返回首页', skip: '跳过',
    safety: '安全词：停', safetyHint: '任意一方说“停”，当前任务立即结束。', noCard: '当前筛选下没有内容，试试提高尺度或换一个场景。',
    wheel: '热辣转盘', spin: '开转', customWheel: '自定义转盘（每行一个选项）', usePreset: '使用预设', dice: '暧昧骰子', roll: '掷骰子',
    boundary: '边界清单', boundaryTip: '两个人分别点 Yes / Maybe / No。热辣内容只建议做共同 Yes。', match: '共同 Yes', maybe: '有 Maybe', no: '存在 No', yes: 'Yes', maybeBtn: 'Maybe', noBtn: 'No', clear: '清空',
    props: '道具选择', propsTip: '选择今晚真的准备好的东西，抽卡会优先显示相关玩法。',
    timer: '爱计时', start: '开始', pause: '暂停', reset: '重置',
    editor: '内容实验室', editorTip: '添加你们自己的真心话/大冒险。导入 JSON 也支持旧格式。', type: '类型', level: '强度', zhText: '中文内容', enText: '英文内容', add: '添加', export: '导出', import: '导入',
    settings: '设置', lang: '语言', backup: '导出备份', restore: '导入备份', resetAll: '清空本地数据', privacy: '数据只保存在当前浏览器 localStorage；没有账号、服务器或埋点。',
    saved: '已保存', added: '已添加', imported: '已导入', copied: '已生成文件',
    levelNames: LEVEL_COPY.zh,
  },
  en: {
    appName: 'Couple Spark Pro', tagline: 'Adult couples · richer spicy content · local-first PWA',
    adultTitle: '18+ Check-in', adultBody: 'For adult, sober and consenting couples. Every prompt can be skipped, softened or stopped. No coercion, no secret recording, no sharing private content.',
    adultA: 'Both adults and sober', adultB: 'Either can stop anytime', adultC: 'Mutual Yes only', enter: 'Enter',
    names: 'Tonight names', p1: 'You', p2: 'Partner', save: 'Save', comfort: 'Default heat level', comfortHelp: 'Default opens to level 5; boundary list still matters.',
    scenes: 'Scenes', tools: 'Tools', history: 'Tonight history', emptyHistory: 'No history yet. Draw a card first.',
    draw: 'Draw', again: 'Again', softer: 'Softer', bolder: 'Bolder', back: 'Home', skip: 'Skip',
    safety: 'Safeword: stop', safetyHint: 'If either says stop, the current task ends immediately.', noCard: 'No card under current filters. Raise heat or switch scenes.',
    wheel: 'Hot Wheel', spin: 'Spin', customWheel: 'Custom wheel, one option per line', usePreset: 'Use preset', dice: 'Spicy Dice', roll: 'Roll',
    boundary: 'Boundary Match', boundaryTip: 'Both choose Yes / Maybe / No. Hot prompts should stay within mutual Yes.', match: 'Mutual Yes', maybe: 'Has Maybe', no: 'Has No', yes: 'Yes', maybeBtn: 'Maybe', noBtn: 'No', clear: 'Clear',
    props: 'Prop Picker', propsTip: 'Choose what is actually ready tonight; prompts bias toward related play.',
    timer: 'Intimacy Timer', start: 'Start', pause: 'Pause', reset: 'Reset',
    editor: 'Content Lab', editorTip: 'Add your own truths/dares. JSON import supports old format.', type: 'Type', level: 'Level', zhText: 'Chinese text', enText: 'English text', add: 'Add', export: 'Export', import: 'Import',
    settings: 'Settings', lang: 'Language', backup: 'Export backup', restore: 'Import backup', resetAll: 'Reset local data', privacy: 'Data stays in this browser localStorage; no account, server or tracking.',
    saved: 'Saved', added: 'Added', imported: 'Imported', copied: 'File generated',
    levelNames: LEVEL_COPY.en,
  }
};

function loadState() {
  try { return { ...defaultState, ...(JSON.parse(localStorage.getItem(STORE_KEY)) || {}) }; }
  catch { return { ...defaultState }; }
}
function saveState() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function t(key) { return (copy[state.lang] || copy.zh)[key] || key; }
function langObj(obj) { return obj?.[state.lang] || obj?.zh || obj?.en || obj || ''; }
function esc(v = '') { return String(v).replace(/[&<>'"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[s])); }
function sample(list) { return list[Math.floor(Math.random() * list.length)]; }
function vibrate(ms = 16) { if (navigator.vibrate) navigator.vibrate(ms); }
function route(to, extra = {}) { state = { ...state, route: to, ...extra }; saveState(); render(); }
function toast(msg) { const node = document.createElement('div'); node.className = 'toast'; node.textContent = msg; document.body.appendChild(node); setTimeout(() => node.remove(), 1800); }

function render() {
  stopTimerIfNeeded();
  document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : 'en';
  app.innerHTML = `${adultGate()}${shell()}`;
  hydrateControls();
  if (state.route === 'wheel') drawWheel();
  if (state.route === 'timer' && state.timerRunning) startTimer();
}

function adultGate() {
  if (state.accepted) return '';
  return `<div class="gate">
    <section class="gate-card glass">
      <div class="brand-mark">18+</div>
      <h1>${t('adultTitle')}</h1>
      <p>${t('adultBody')}</p>
      <label><input type="checkbox" data-gate="a"> ${t('adultA')}</label>
      <label><input type="checkbox" data-gate="b"> ${t('adultB')}</label>
      <label><input type="checkbox" data-gate="c"> ${t('adultC')}</label>
      <button class="primary wide" data-action="accept" disabled>${t('enter')}</button>
    </section>
  </div>`;
}

function shell() {
  return `<div class="app-shell ${state.accepted ? '' : 'blurred'}">
    <header class="topbar glass">
      <button class="logo" data-action="home"><span>💞</span><b>${t('appName')}</b></button>
      <div class="top-actions">
        <button class="pill danger" data-action="safety">${t('safety')}</button>
        <button class="pill" data-action="lang">${state.lang === 'zh' ? 'EN' : '中'}</button>
      </div>
    </header>
    <main>${view()}</main>
    <nav class="bottom-nav glass">
      ${navItem('home','⌂', state.lang==='zh'?'首页':'Home')}
      ${navItem('wheel','🎡', state.lang==='zh'?'转盘':'Wheel')}
      ${navItem('dice','🎲', state.lang==='zh'?'骰子':'Dice')}
      ${navItem('boundary','✅', state.lang==='zh'?'边界':'Boundaries')}
      ${navItem('timer','⏱', state.lang==='zh'?'计时':'Timer')}
    </nav>
  </div>`;
}
function navItem(id, icon, label) { return `<button class="nav-item ${state.route===id?'active':''}" data-action="route" data-route="${id}"><span>${icon}</span>${label}</button>`; }
function view() {
  switch(state.route) {
    case 'scene': return sceneView();
    case 'wheel': return wheelView();
    case 'dice': return diceView();
    case 'boundary': return boundaryView();
    case 'propsTool': return propsView();
    case 'timer': return timerView();
    case 'editor': return editorView();
    case 'settings': return settingsView();
    default: return homeView();
  }
}

function homeView() {
  return `<section class="hero glass">
    <div><p class="eyebrow">Pro v2 · Local only</p><h1>${t('appName')}</h1><p>${t('tagline')}</p><p class="hint">${t('safetyHint')}</p></div>
    <div class="heat-card"><span>${t('comfort')}</span><strong>${state.maxLevel} · ${t('levelNames')[state.maxLevel]}</strong><input type="range" min="1" max="5" value="${state.maxLevel}" data-input="maxLevel"><small>${t('comfortHelp')}</small></div>
  </section>
  <section class="panel glass names-panel"><h2>${t('names')}</h2><div class="inline-form"><input data-input="p1" value="${esc(state.p1)}" placeholder="${t('p1')}"><input data-input="p2" value="${esc(state.p2)}" placeholder="${t('p2')}"><button data-action="saveNames">${t('save')}</button></div></section>
  <section><h2>${t('scenes')}</h2><div class="grid scene-grid">${SCENES.map(sceneCard).join('')}</div></section>
  <section><h2>${t('tools')}</h2><div class="grid tool-grid">${TOOLS.map(toolCard).join('')}</div></section>
  <section class="panel glass"><h2>${t('history')}</h2>${historyList()}</section>`;
}
function sceneCard(s) { const o=langObj(s); return `<button class="scene-card glass accent-${s.accent}" data-action="openScene" data-scene="${s.id}"><span class="icon">${s.icon}</span><b>${esc(o.title)}</b><small>${esc(o.subtitle)}</small><em>${esc(o.button)}</em></button>`; }
function toolCard(tool) { const o=langObj(tool); return `<button class="tool-card glass" data-action="route" data-route="${tool.id}"><span>${tool.icon}</span><b>${esc(o.title)}</b><small>${esc(o.subtitle)}</small></button>`; }

function sceneView() {
  const scene = SCENES.find(s => s.id === state.activeScene) || SCENES[0];
  if (scene.id === 'wheel') return wheelView();
  if (scene.id === 'dice') return diceView();
  const o = langObj(scene);
  return `<section class="scene-hero glass accent-${scene.accent}"><button class="ghost" data-action="home">← ${t('back')}</button><span class="big-icon">${scene.icon}</span><h1>${esc(o.title)}</h1><p>${esc(o.subtitle)}</p><div class="level-pills">${[1,2,3,4,5].map(l=>`<button class="mini ${state.maxLevel===l?'active':''}" data-action="setLevel" data-level="${l}">${l} ${esc(t('levelNames')[l])}</button>`).join('')}</div></section>
  <section class="draw-zone">${state.lastCard ? renderCard(state.lastCard) : `<div class="empty-card glass"><p>${esc(o.button)}</p><button class="primary big" data-action="draw">${t('draw')}</button></div>`}</section>
  <div class="floating-actions glass"><button data-action="draw">${t('again')}</button><button data-action="softer">${t('softer')}</button><button data-action="bolder">${t('bolder')}</button><button data-action="home">${t('back')}</button></div>`;
}
function renderCard(card) {
  const content = fill(langObj(card));
  return `<article class="prompt-card glass level-${card.level}"><div class="card-top"><span>${typeIcon(card.type)} ${esc(card.type)}</span><span>${card.level} · ${esc(t('levelNames')[card.level])}</span></div><p>${esc(content)}</p><div class="card-tags">${(card.tags||[]).slice(0,5).map(tag=>`<span>#${esc(tag)}</span>`).join('')}</div><div class="card-actions"><button class="primary" data-action="draw">${t('again')}</button><button data-action="skip">${t('skip')}</button></div></article>`;
}
function typeIcon(type) { return {truth:'💬', dare:'⚡', kiss:'💋', touch:'🫶', prop:'🧊', pose:'🛋', care:'🌙', aftercare:'🌙', role:'🎭'}[type] || '✨'; }
function fill(text) { return String(text).replaceAll('{giver}', Math.random() > .5 ? state.p1 : state.p2).replaceAll('{receiver}', Math.random() > .5 ? state.p2 : state.p1).replaceAll('{p1}', state.p1).replaceAll('{p2}', state.p2); }
function allCards() { return [...BUILT_IN_CARDS, ...state.customCards]; }
function drawCard() {
  const scene = SCENES.find(s => s.id === state.activeScene) || SCENES[0];
  const types = scene.types || [];
  const propBias = new Set(state.selectedProps);
  let pool = allCards().filter(c => c.level <= state.maxLevel && (!types.length || types.includes(c.type) || (c.tags||[]).some(tag => types.includes(tag))));
  if (state.activeScene === 'props' && propBias.size) pool = pool.filter(c => (c.tags||[]).includes('prop') || c.type === 'prop');
  if (!pool.length) { toast(t('noCard')); return; }
  const card = sample(pool);
  state.lastCard = card;
  state.history = [{ when: Date.now(), card }, ...state.history].slice(0, 30);
  saveState();
  render();
  burst();
  vibrate(24);
}
function historyList() {
  if (!state.history.length) return `<p class="muted">${t('emptyHistory')}</p>`;
  return `<div class="history-list">${state.history.slice(0,8).map(h=>`<div><span>${typeIcon(h.card.type)}</span><p>${esc(fill(langObj(h.card)))}</p><small>${new Date(h.when).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</small></div>`).join('')}</div>`;
}

function wheelView() {
  const presets = Object.keys(WHEEL_PRESETS[state.lang]);
  return `<section class="scene-hero glass accent-magenta"><button class="ghost" data-action="home">← ${t('back')}</button><span class="big-icon">🎡</span><h1>${t('wheel')}</h1><p>${state.lang==='zh'?'转盘不再只是抽文字：有预设、动画、结果反馈，也能自定义。':'Preset decks, animation, feedback and custom options.'}</p></section>
  <section class="wheel-layout"><div class="wheel-card glass"><div class="wheel-pointer">▼</div><div class="wheel" id="wheel"><div class="wheel-core">SPIN</div></div><button class="primary big" data-action="spin">${t('spin')}</button>${state.wheelResult?`<div class="wheel-result">${esc(state.wheelResult)}</div>`:''}</div>
  <div class="panel glass"><h2>${t('usePreset')}</h2><div class="preset-row">${presets.map(p=>`<button class="mini ${state.wheelPreset===p?'active':''}" data-action="preset" data-preset="${p}">${esc(p)}</button>`).join('')}</div><textarea data-input="customWheel" placeholder="${t('customWheel')}">${esc(state.customWheel)}</textarea><small>${state.lang==='zh'?'留空则使用预设；每行一个选项。':'Leave empty to use preset; one option per line.'}</small></div></section>`;
}
function wheelItems() {
  const custom = state.customWheel.split('\n').map(x=>x.trim()).filter(Boolean);
  return custom.length >= 2 ? custom : WHEEL_PRESETS[state.lang][state.wheelPreset] || WHEEL_PRESETS[state.lang].spicy;
}
function drawWheel() {
  const node = $('#wheel'); if (!node) return;
  const items = wheelItems();
  const colors = ['#ff4f91','#ff8b4a','#ffd166','#7bdff2','#b388ff','#ff6bcb','#4dd599','#f72585'];
  const step = 360 / items.length;
  const gradient = items.map((_,i)=>`${colors[i%colors.length]} ${i*step}deg ${(i+1)*step}deg`).join(',');
  node.style.background = `conic-gradient(${gradient})`;
  node.style.transform = `rotate(${state.wheelRotation}deg)`;
}
function spinWheel() {
  const items = wheelItems();
  const idx = Math.floor(Math.random()*items.length);
  const step = 360 / items.length;
  state.wheelRotation += 1440 + (360 - idx * step) - step/2 + Math.random()*step*.6;
  state.wheelResult = '';
  saveState(); render(); vibrate(35);
  setTimeout(() => { state.wheelResult = items[idx]; state.history = [{ when: Date.now(), card:{type:'wheel', level:state.maxLevel, zh:items[idx], en:items[idx], tags:['wheel']}}, ...state.history].slice(0,30); saveState(); render(); burst(); vibrate([30,40,30]); }, 1300);
}

function diceView() {
  const r = state.diceResult;
  return `<section class="scene-hero glass accent-gold"><button class="ghost" data-action="home">← ${t('back')}</button><span class="big-icon">🎲</span><h1>${t('dice')}</h1><p>${state.lang==='zh'?'动作 + 位置 + 时长，结果会自动进入今晚记录。':'Action + place + time, saved into tonight history.'}</p></section>
  <section class="dice-zone glass">
    <div class="dice-row ${r?'rolled':''}"><div class="die">${esc(r?.action || '？')}</div><div class="die">${esc(r?.area || '？')}</div><div class="die">${r?.time ? `${r.time}s` : '？'}</div></div>
    <button class="primary big" data-action="roll">${t('roll')}</button>
    ${r?`<p class="dice-sentence">${state.lang==='zh'?'任务：':'Task: '}${esc(r.action)} · ${esc(r.area)} · ${r.time}s</p>`:''}
  </section>`;
}
function rollDice() {
  const action = sample(DICE.actions), area = sample(DICE.areas), time = sample(DICE.times);
  const r = { action: langObj(action), area: langObj(area), time };
  state.diceResult = r;
  const line = state.lang === 'zh' ? `${r.action} · ${r.area} · ${time} 秒` : `${r.action} · ${r.area} · ${time}s`;
  state.history = [{ when: Date.now(), card:{ type:'dice', level:state.maxLevel, zh:line, en:line, tags:['dice'] } }, ...state.history].slice(0,30);
  saveState(); render(); burst(); vibrate([20,30,20]);
}

function boundaryView() {
  const rows = BOUNDARY_ITEMS.map(item => {
    const b = state.boundaries[item.id] || {};
    const status = statusFor(b);
    return `<div class="boundary-row glass ${status}"><div><b>${esc(langObj(item))}</b><small>${item.level} · ${esc(t('levelNames')[item.level])}</small></div>${personBoundary(item,'a',b.a)}${personBoundary(item,'b',b.b)}</div>`;
  }).join('');
  return `<section class="scene-hero glass accent-mint"><button class="ghost" data-action="home">← ${t('back')}</button><h1>${t('boundary')}</h1><p>${t('boundaryTip')}</p><div class="summary-pills">${boundarySummary()}</div></section><section class="boundary-list">${rows}</section><button class="danger-line" data-action="clearBoundaries">${t('clear')}</button>`;
}
function personBoundary(item, who, value) {
  const name = who === 'a' ? state.p1 : state.p2;
  return `<div class="choice"><span>${esc(name)}</span><button class="${value==='yes'?'on yes':''}" data-action="boundary" data-id="${item.id}" data-who="${who}" data-value="yes">${t('yes')}</button><button class="${value==='maybe'?'on maybe':''}" data-action="boundary" data-id="${item.id}" data-who="${who}" data-value="maybe">${t('maybeBtn')}</button><button class="${value==='no'?'on no':''}" data-action="boundary" data-id="${item.id}" data-who="${who}" data-value="no">${t('noBtn')}</button></div>`;
}
function statusFor(b) { if (b.a==='no'||b.b==='no') return 'has-no'; if (b.a==='yes'&&b.b==='yes') return 'has-yes'; if (b.a||b.b) return 'has-maybe'; return ''; }
function boundarySummary() {
  let yes=0, maybe=0, no=0;
  BOUNDARY_ITEMS.forEach(i => { const s = statusFor(state.boundaries[i.id]||{}); if(s==='has-yes') yes++; if(s==='has-maybe') maybe++; if(s==='has-no') no++; });
  return `<span>${t('match')} ${yes}</span><span>${t('maybe')} ${maybe}</span><span>${t('no')} ${no}</span>`;
}

function propsView() {
  return `<section class="scene-hero glass accent-ice"><button class="ghost" data-action="home">← ${t('back')}</button><h1>${t('props')}</h1><p>${t('propsTip')}</p></section><section class="prop-grid">${PROPS.map(p=>`<label class="prop-item glass"><input type="checkbox" data-prop="${p.id}" ${state.selectedProps.includes(p.id)?'checked':''}><span>${esc(langObj(p))}</span><small>${p.level} · ${esc(t('levelNames')[p.level])}</small></label>`).join('')}</section>`;
}

function timerView() {
  return `<section class="scene-hero glass accent-sky"><button class="ghost" data-action="home">← ${t('back')}</button><h1>${t('timer')}</h1><p>${state.lang==='zh'?'适合亲吻、按摩、暂停、眼罩、抱抱收尾。':'For kissing, massage, pauses, blindfold and aftercare.'}</p></section><section class="timer-card glass"><div class="timer-face">${formatTime(state.timerLeft)}</div><div class="preset-row">${[30,60,90,120,180,300].map(s=>`<button class="mini" data-action="timerPreset" data-seconds="${s}">${s<60?s+'s':s/60+'m'}</button>`).join('')}</div><div class="timer-actions"><button class="primary" data-action="timerToggle">${state.timerRunning?t('pause'):t('start')}</button><button data-action="timerReset">${t('reset')}</button></div></section>`;
}
function formatTime(s) { const m = Math.floor(s/60), sec = String(s%60).padStart(2,'0'); return `${m}:${sec}`; }
function startTimer() { clearInterval(timerId); timerId = setInterval(() => { if (!state.timerRunning) return; state.timerLeft = Math.max(0, state.timerLeft-1); if (state.timerLeft === 0) { state.timerRunning = false; vibrate([80,80,80]); toast(state.lang==='zh'?'时间到，先确认感受。':'Time. Check in.'); } saveState(); if (state.route === 'timer') render(); }, 1000); }
function stopTimerIfNeeded(){ if(state.route !== 'timer') clearInterval(timerId); }

function editorView() {
  return `<section class="scene-hero glass accent-violet"><button class="ghost" data-action="home">← ${t('back')}</button><h1>${t('editor')}</h1><p>${t('editorTip')}</p></section><section class="panel glass editor-form"><div class="two"><label>${t('type')}<select data-input="newType"><option>truth</option><option>dare</option><option>kiss</option><option>touch</option><option>role</option><option>prop</option><option>pose</option><option>aftercare</option></select></label><label>${t('level')}<input data-input="newLevel" type="number" min="1" max="5" value="3"></label></div><label>${t('zhText')}<textarea data-input="newZh" placeholder="{giver} / {receiver} 可作为占位符"></textarea></label><label>${t('enText')}<textarea data-input="newEn"></textarea></label><button class="primary" data-action="addCustom">${t('add')}</button><div class="two"><button data-action="exportCards">${t('export')}</button><button data-action="importCards">${t('import')}</button></div><textarea data-input="importBox" placeholder="JSON"></textarea></section>`;
}
function settingsView() {
  return `<section class="scene-hero glass accent-indigo"><button class="ghost" data-action="home">← ${t('back')}</button><h1>${t('settings')}</h1><p>${t('privacy')}</p></section><section class="panel glass settings-list"><button data-action="lang">${t('lang')}: ${state.lang === 'zh' ? '中文' : 'English'}</button><button data-action="backup">${t('backup')}</button><label class="file-label">${t('restore')}<input type="file" accept="application/json" data-action="restoreFile"></label><button class="danger" data-action="resetAll">${t('resetAll')}</button></section>`;
}

function hydrateControls() {
  $$('[data-input]').forEach(el => {
    el.addEventListener('input', e => {
      const k = e.target.dataset.input;
      if (k === 'maxLevel') state.maxLevel = Number(e.target.value);
      else if (['p1','p2','customWheel'].includes(k)) state[k] = e.target.value;
      saveState();
      if (k === 'maxLevel') render();
      if (k === 'customWheel') drawWheel();
    });
  });
  $$('[data-prop]').forEach(el => el.addEventListener('change', e => {
    const id = e.target.dataset.prop;
    state.selectedProps = e.target.checked ? [...new Set([...state.selectedProps, id])] : state.selectedProps.filter(x => x !== id);
    saveState();
  }));
  $$('[data-gate]').forEach(el => el.addEventListener('change', () => {
    const ok = $$('[data-gate]').every(x => x.checked);
    const btn = $('[data-action="accept"]'); if (btn) btn.disabled = !ok;
  }));
  const file = $('[data-action="restoreFile"]');
  if (file) file.addEventListener('change', restoreBackup);
}

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]'); if (!btn) return;
  const action = btn.dataset.action;
  if (action === 'accept') { state.accepted = true; saveState(); render(); }
  if (!state.accepted && action !== 'accept') return;
  if (action === 'home') route('home', { lastCard: null });
  if (action === 'route') route(btn.dataset.route, { lastCard: null });
  if (action === 'openScene') { const id = btn.dataset.scene; if (id==='wheel'||id==='dice') route(id); else route('scene', { activeScene:id, lastCard:null }); }
  if (action === 'lang') { state.lang = state.lang === 'zh' ? 'en' : 'zh'; saveState(); render(); }
  if (action === 'saveNames') { saveState(); toast(t('saved')); }
  if (action === 'setLevel') { state.maxLevel = Number(btn.dataset.level); saveState(); render(); }
  if (action === 'draw') drawCard();
  if (action === 'skip') { state.lastCard = null; saveState(); render(); }
  if (action === 'softer') { state.maxLevel = Math.max(1, state.maxLevel-1); drawCard(); }
  if (action === 'bolder') { state.maxLevel = Math.min(5, state.maxLevel+1); drawCard(); }
  if (action === 'safety') { state.timerRunning = false; state.lastCard = {type:'care',level:1,tags:['safety'],zh:'已暂停：抱抱、补水、确认感受。只有双方都想继续时再开始。',en:'Paused: hug, drink water and check in. Continue only if both want.'}; saveState(); route('scene',{activeScene:'aftercare'}); }
  if (action === 'preset') { state.wheelPreset = btn.dataset.preset; state.wheelResult=''; saveState(); render(); }
  if (action === 'spin') spinWheel();
  if (action === 'roll') rollDice();
  if (action === 'boundary') setBoundary(btn);
  if (action === 'clearBoundaries') { state.boundaries = {}; saveState(); render(); }
  if (action === 'timerPreset') { const s=Number(btn.dataset.seconds); state.timerTotal=s; state.timerLeft=s; state.timerRunning=false; saveState(); render(); }
  if (action === 'timerToggle') { state.timerRunning=!state.timerRunning; saveState(); render(); }
  if (action === 'timerReset') { state.timerLeft=state.timerTotal; state.timerRunning=false; saveState(); render(); }
  if (action === 'addCustom') addCustomCard();
  if (action === 'exportCards') downloadJSON('couple-spark-custom-cards.json', state.customCards);
  if (action === 'importCards') importCards();
  if (action === 'backup') downloadJSON('couple-spark-backup.json', state);
  if (action === 'resetAll') { if(confirm(state.lang==='zh'?'确定清空所有本地数据？':'Reset all local data?')) { localStorage.removeItem(STORE_KEY); state={...defaultState}; render(); } }
});
function setBoundary(btn) {
  const {id, who, value} = btn.dataset;
  const current = state.boundaries[id] || {};
  current[who] = current[who] === value ? '' : value;
  state.boundaries[id] = current;
  saveState(); render();
}
function addCustomCard() {
  const type = $('[data-input="newType"]')?.value || 'dare';
  const level = Math.max(1, Math.min(5, Number($('[data-input="newLevel"]')?.value || 3)));
  const zh = $('[data-input="newZh"]')?.value.trim();
  const en = $('[data-input="newEn"]')?.value.trim() || zh;
  if (!zh) return toast(state.lang==='zh'?'先写内容':'Write content first');
  state.customCards.unshift({ id:`custom-${Date.now()}`, type, level, tags:['custom', type], zh, en });
  saveState(); toast(t('added')); render();
}
function importCards() {
  const box = $('[data-input="importBox"]');
  try {
    const data = JSON.parse(box.value);
    const list = Array.isArray(data) ? data : data.customCards;
    if (!Array.isArray(list)) throw new Error('not array');
    state.customCards = [...list.map((c,i)=>({ id:c.id||`import-${Date.now()}-${i}`, type:c.type||'dare', level:Number(c.level)||3, tags:c.tags||['custom'], zh:c.zh||c.text||'', en:c.en||c.zh||c.text||'' })).filter(c=>c.zh), ...state.customCards];
    saveState(); toast(t('imported')); render();
  } catch { toast('JSON error'); }
}
function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click(); URL.revokeObjectURL(a.href); toast(t('copied'));
}
function restoreBackup(e) {
  const file = e.target.files?.[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { try { state = { ...defaultState, ...JSON.parse(reader.result) }; saveState(); render(); toast(t('imported')); } catch { toast('JSON error'); } };
  reader.readAsText(file);
}
function burst() {
  const wrap = document.createElement('div'); wrap.className = 'burst';
  for (let i=0; i<18; i++) { const s=document.createElement('i'); s.style.setProperty('--x', `${(Math.random()-.5)*220}px`); s.style.setProperty('--y', `${(Math.random()-.5)*220}px`); s.style.animationDelay = `${Math.random()*80}ms`; wrap.appendChild(s); }
  document.body.appendChild(wrap); setTimeout(()=>wrap.remove(), 900);
}

render();
