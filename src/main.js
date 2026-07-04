import { SCENES, TOOLS, PROPS, BOUNDARY_ITEMS, DICE, WHEEL_PRESETS, BUILT_IN_CARDS, LEVEL_COPY } from './data.js';

const STORE_KEY = 'couple-spark-pro-v3';
const OLD_KEYS = ['couple-spark-pro-v2', 'couple-spark-pro'];
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
  activeScene: 'script',
  scriptStep: 0,
  history: [],
  selectedProps: [],
  customCards: [],
  customWheel: '',
  wheelDeck: 'dirty',
  wheelResult: '',
  wheelModal: null,
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
let spinTimer = null;

const copy = {
  zh: {
    appName: '二人火花 Pro',
    version: 'Pro v3 · 私密成人版',
    tagline: '情侣线下互动，不再清汤寡水：转盘、骰子、剧本、角色、道具、热辣题库。',
    adultTitle: '18+ 进入前确认',
    adultBody: '这里只适合已成年、清醒、彼此愿意的情侣。内容可以大胆，但每一轮都可以跳过、降级或立刻停。',
    adultA: '双方已成年且清醒', adultB: '任何一方说停就停', adultC: '只玩共同愿意的内容', enter: '确认进入',
    names: '今晚称呼', p1: '你', p2: 'TA', save: '保存',
    comfort: '今晚默认尺度', comfortHelp: '默认开放到 5 级；你们可以随时降级。',
    scenes: '玩法场景', tools: '工具箱', history: '今晚记录', emptyHistory: '还没有记录，先开一轮。',
    draw: '抽一张', again: '再来一张', softer: '轻一点', bolder: '加码', back: '返回', skip: '换一个',
    safety: '安全词：停', safetyHint: '说“停”就是立刻结束当前任务。', noCard: '当前筛选没有内容，换个场景或提高尺度。',
    wheel: '欲望转盘', spin: '开转', spinning: '转动中…', customWheel: '想玩自己的规则？一行写一个玩法，留空就用当前模式。', usePreset: '选择今晚氛围', wheelLive: '当前结果', wheelQueue: '本轮选项', wheelUnlock: '今晚任务已解锁', accept: '我接受', reroll: '换一个', close: '先收起',
    dice: '暧昧骰子', roll: '掷骰子', diceTask: '马上执行',
    boundary: '边界清单', boundaryTip: '两个人分别点 Yes / Maybe / No。热辣内容建议只玩共同 Yes。', match: '共同 Yes', maybe: '有 Maybe', no: '存在 No', yes: 'Yes', maybeBtn: 'Maybe', noBtn: 'No', clear: '清空',
    props: '今晚道具', propsTip: '勾选今晚真的准备好的东西，后续抽卡会更贴近场景。',
    timer: '心跳计时', start: '开始', pause: '暂停', reset: '重置', oneMin: '1 分钟', threeMin: '3 分钟', fiveMin: '5 分钟',
    editor: '内容实验室', editorTip: '添加你们自己的玩法。只存在当前浏览器。', type: '类型', level: '强度', zhText: '中文内容', enText: '英文内容', add: '添加', export: '导出', import: '导入',
    settings: '设置', lang: '语言', backup: '导出备份', restore: '导入备份', resetAll: '清空本地数据', privacy: '数据只保存在这个浏览器里，没有账号、服务器或埋点。',
    saved: '已保存', added: '已添加', imported: '已导入', copied: '已生成文件',
    script: '今晚剧本', scriptNext: '下一步', scriptReset: '重开剧本', complete: '完成',
    levelNames: LEVEL_COPY.zh,
  },
  en: {
    appName: 'Couple Spark Pro',
    version: 'Pro v3 · private adult edition',
    tagline: 'A local couples game with wheel, dice, script, role play, props and hotter prompts.',
    adultTitle: '18+ Check-in',
    adultBody: 'For adult, sober and mutually willing couples only. Prompts can be skipped, softened or stopped anytime.',
    adultA: 'Both adults and sober', adultB: 'Stop means stop', adultC: 'Mutual willingness only', enter: 'Enter',
    names: 'Tonight names', p1: 'You', p2: 'Partner', save: 'Save',
    comfort: 'Tonight heat level', comfortHelp: 'Default is level 5; soften anytime.',
    scenes: 'Scenes', tools: 'Tools', history: 'Tonight history', emptyHistory: 'No records yet. Start a round.',
    draw: 'Draw', again: 'Again', softer: 'Softer', bolder: 'Hotter', back: 'Back', skip: 'Swap',
    safety: 'Safeword: stop', safetyHint: 'Saying “stop” ends the current task immediately.', noCard: 'No prompt found. Switch scene or raise heat.',
    wheel: 'Desire Wheel', spin: 'Spin', spinning: 'Spinning…', customWheel: 'Want your own rules? One option per line. Leave blank for current deck.', usePreset: 'Choose tonight mood', wheelLive: 'Current result', wheelQueue: 'This round', wheelUnlock: 'Tonight task unlocked', accept: 'Accept', reroll: 'Swap it', close: 'Hide',
    dice: 'Spicy Dice', roll: 'Roll dice', diceTask: 'Do it now',
    boundary: 'Boundary List', boundaryTip: 'Both choose Yes / Maybe / No. Hot prompts should stay within mutual Yes.', match: 'Mutual Yes', maybe: 'Has Maybe', no: 'Has No', yes: 'Yes', maybeBtn: 'Maybe', noBtn: 'No', clear: 'Clear',
    props: 'Tonight Props', propsTip: 'Select what is actually ready tonight. Draws will better match the scene.',
    timer: 'Heat Timer', start: 'Start', pause: 'Pause', reset: 'Reset', oneMin: '1 min', threeMin: '3 min', fiveMin: '5 min',
    editor: 'Content Lab', editorTip: 'Add your own private prompts. Stored in this browser only.', type: 'Type', level: 'Level', zhText: 'Chinese text', enText: 'English text', add: 'Add', export: 'Export', import: 'Import',
    settings: 'Settings', lang: 'Language', backup: 'Export backup', restore: 'Import backup', resetAll: 'Reset local data', privacy: 'Data stays in this browser only; no account, server or tracking.',
    saved: 'Saved', added: 'Added', imported: 'Imported', copied: 'File generated',
    script: 'Tonight Script', scriptNext: 'Next step', scriptReset: 'Restart script', complete: 'Done',
    levelNames: LEVEL_COPY.en,
  }
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORE_KEY) || OLD_KEYS.map(k => localStorage.getItem(k)).find(Boolean);
    return { ...defaultState, ...(saved ? JSON.parse(saved) : {}) };
  } catch { return { ...defaultState }; }
}
function saveState() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function t(key) { return (copy[state.lang] || copy.zh)[key] || key; }
function langObj(obj) { return obj?.[state.lang] || obj?.zh || obj?.en || obj || ''; }
function esc(v = '') { return String(v).replace(/[&<>'"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[s])); }
function sample(list) { return list[Math.floor(Math.random() * list.length)]; }
function vibrate(pattern = 18) { if (navigator.vibrate) navigator.vibrate(pattern); }
function toast(msg) { const node = document.createElement('div'); node.className = 'toast'; node.textContent = msg; document.body.appendChild(node); setTimeout(() => node.remove(), 1800); }
function route(to, extra = {}) { state = { ...state, route: to, ...extra }; saveState(); render(); }

function render() {
  stopTimerIfNeeded();
  clearTimeout(spinTimer);
  document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : 'en';
  app.innerHTML = `${adultGate()}${shell()}${resultModal()}`;
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
      ${navItem('home','⌂', state.lang === 'zh' ? '首页' : 'Home')}
      ${navItem('script','🌙', state.lang === 'zh' ? '今晚' : 'Script')}
      ${navItem('wheel','🎡', state.lang === 'zh' ? '转盘' : 'Wheel')}
      ${navItem('dice','🎲', state.lang === 'zh' ? '骰子' : 'Dice')}
      ${navItem('boundary','✅', state.lang === 'zh' ? '边界' : 'Boundaries')}
    </nav>
  </div>`;
}
function navItem(id, icon, label) { const active = (state.route === id) || (id === 'script' && state.route === 'scene' && state.activeScene === 'script'); return `<button class="nav-item ${active?'active':''}" data-action="${id==='script'?'openScene':'route'}" ${id==='script'?'data-scene="script"':`data-route="${id}"`}><span>${icon}</span>${label}</button>`; }

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
    <div>
      <p class="eyebrow">${t('version')}</p>
      <h1>${t('appName')}</h1>
      <p>${t('tagline')}</p>
      <p class="hint">${t('safetyHint')}</p>
      <div class="hero-actions"><button class="primary" data-action="openScene" data-scene="script">${t('script')}</button><button data-action="route" data-route="wheel">${t('wheel')}</button></div>
    </div>
    <div class="heat-card">
      <span>${t('comfort')}</span>
      <strong>${state.maxLevel} · ${t('levelNames')[state.maxLevel]}</strong>
      <input type="range" min="1" max="5" value="${state.maxLevel}" data-input="maxLevel">
      <small>${t('comfortHelp')}</small>
    </div>
  </section>
  <section class="panel glass names-panel"><h2>${t('names')}</h2><div class="inline-form"><input data-input="p1" value="${esc(state.p1)}" placeholder="${t('p1')}"><input data-input="p2" value="${esc(state.p2)}" placeholder="${t('p2')}"><button data-action="saveNames">${t('save')}</button></div></section>
  <section><h2>${t('scenes')}</h2><div class="grid scene-grid">${SCENES.map(sceneCard).join('')}</div></section>
  <section><h2>${t('tools')}</h2><div class="grid tool-grid">${TOOLS.map(toolCard).join('')}</div></section>
  <section class="panel glass"><h2>${t('history')}</h2>${historyList()}</section>`;
}
function sceneCard(s) { const o=langObj(s); return `<button class="scene-card glass accent-${s.accent}" data-action="openScene" data-scene="${s.id}"><span class="icon">${s.icon}</span><b>${esc(o.title)}</b><small>${esc(o.subtitle)}</small><em>${esc(o.button)}</em></button>`; }
function toolCard(tool) { const o=langObj(tool); return `<button class="tool-card glass" data-action="route" data-route="${tool.id}"><span>${tool.icon}</span><b>${esc(o.title)}</b><small>${esc(o.subtitle)}</small></button>`; }

const scriptPlan = [
  { scene: 'truth', level: 2, zh: '破冰问题', en: 'Warm truth' },
  { scene: 'tease', level: 3, zh: '开始升温', en: 'Heat up' },
  { scene: 'wheel', level: 4, zh: '转盘加码', en: 'Wheel escalation' },
  { scene: 'dirty', level: 5, zh: '热辣任务', en: 'Hot task' },
  { scene: 'dice', level: 4, zh: '骰子执行', en: 'Dice task' },
  { scene: 'aftercare', level: 1, zh: '余韵收尾', en: 'Aftercare' },
];

function sceneView() {
  const scene = SCENES.find(s => s.id === state.activeScene) || SCENES[0];
  if (scene.id === 'wheel') return wheelView();
  if (scene.id === 'dice') return diceView();
  if (scene.id === 'script') return scriptView();
  const o = langObj(scene);
  return `<section class="scene-hero glass accent-${scene.accent}"><button class="ghost" data-action="home">← ${t('back')}</button><span class="big-icon">${scene.icon}</span><h1>${esc(o.title)}</h1><p>${esc(o.subtitle)}</p><div class="level-pills">${[1,2,3,4,5].map(l=>`<button class="mini ${state.maxLevel===l?'active':''}" data-action="setLevel" data-level="${l}">${l} ${esc(t('levelNames')[l])}</button>`).join('')}</div></section>
  <section class="draw-zone">${state.lastCard ? renderCard(state.lastCard) : `<div class="empty-card glass"><p>${esc(o.button)}</p><button class="primary big" data-action="draw">${t('draw')}</button></div>`}</section>
  <div class="floating-actions glass"><button data-action="draw">${t('again')}</button><button data-action="softer">${t('softer')}</button><button data-action="bolder">${t('bolder')}</button><button data-action="home">${t('back')}</button></div>`;
}

function scriptView() {
  const step = scriptPlan[Math.min(state.scriptStep, scriptPlan.length - 1)];
  const progress = Math.round(((state.scriptStep + 1) / scriptPlan.length) * 100);
  return `<section class="scene-hero glass accent-peach"><button class="ghost" data-action="home">← ${t('back')}</button><span class="big-icon">🌙</span><h1>${t('script')}</h1><p>${state.lang==='zh'?'按步骤推进：先聊、再撩、再转盘加码，最后收尾。':'A paced flow: talk, tease, wheel, heat, then aftercare.'}</p><div class="script-progress"><i style="width:${progress}%"></i></div></section>
  <section class="script-board glass">
    <div class="script-steps">${scriptPlan.map((s,i)=>`<button class="script-step ${i===state.scriptStep?'active':''} ${i<state.scriptStep?'done':''}" data-action="setScript" data-step="${i}"><span>${i+1}</span>${esc(state.lang==='zh'?s.zh:s.en)}</button>`).join('')}</div>
    <div class="script-main">
      <p class="eyebrow">${state.scriptStep + 1} / ${scriptPlan.length}</p>
      <h2>${esc(state.lang==='zh'?step.zh:step.en)}</h2>
      ${state.lastCard ? renderCard(state.lastCard) : `<p class="muted">${state.lang==='zh'?'点下面按钮，抽这一阶段的任务。':'Draw a prompt for this stage.'}</p>`}
      <div class="card-actions"><button class="primary" data-action="scriptDraw">${t('draw')}</button><button data-action="scriptNext">${t('scriptNext')}</button><button data-action="scriptReset">${t('scriptReset')}</button></div>
    </div>
  </section>`;
}

function renderCard(card) {
  const content = fill(langObj(card));
  return `<article class="prompt-card glass level-${card.level}"><div class="card-top"><span>${typeIcon(card.type)} ${esc(typeName(card.type))}</span><span>${card.level} · ${esc(t('levelNames')[card.level])}</span></div><p>${esc(content)}</p><div class="card-tags">${(card.tags||[]).slice(0,5).map(tag=>`<span>#${esc(tag)}</span>`).join('')}</div><div class="card-actions"><button class="primary" data-action="draw">${t('again')}</button><button data-action="skip">${t('skip')}</button></div></article>`;
}
function typeIcon(type) { return {truth:'💬', dare:'⚡', kiss:'💋', touch:'🫶', prop:'🧊', pose:'🛋', care:'🌙', aftercare:'🫧', role:'🎭', dirty:'💦', wheel:'🎡', dice:'🎲'}[type] || '✨'; }
function typeName(type) { return state.lang === 'zh' ? ({truth:'真心话',dare:'任务',kiss:'亲吻',touch:'触碰',prop:'道具',pose:'姿势',aftercare:'收尾',role:'角色',dirty:'热辣'}[type] || type) : type; }
function fill(text) { return String(text).replaceAll('{giver}', Math.random() > .5 ? state.p1 : state.p2).replaceAll('{receiver}', Math.random() > .5 ? state.p2 : state.p1).replaceAll('{p1}', state.p1).replaceAll('{p2}', state.p2); }
function allCards() { return [...BUILT_IN_CARDS, ...state.customCards]; }
function drawCard(options = {}) {
  const scene = SCENES.find(s => s.id === (options.scene || state.activeScene)) || SCENES[0];
  const level = Math.min(options.level || state.maxLevel, state.maxLevel);
  const types = scene.types || [];
  let pool = allCards().filter(c => c.level <= level && (!types.length || types.includes(c.type) || (c.tags||[]).some(tag => types.includes(tag))));
  if (scene.id === 'props' && state.selectedProps.length) pool = pool.filter(c => (c.tags||[]).includes('prop') || c.type === 'prop');
  if (!pool.length) { toast(t('noCard')); return; }
  const card = sample(pool);
  state.lastCard = card;
  state.history = [{ when: Date.now(), card }, ...state.history].slice(0, 50);
  saveState(); render(); burst(); vibrate(24);
}
function historyList() {
  if (!state.history.length) return `<p class="muted">${t('emptyHistory')}</p>`;
  return `<div class="history-list">${state.history.slice(0,10).map(h=>`<div><span>${typeIcon(h.card.type)}</span><p>${esc(fill(langObj(h.card)))}</p><small>${new Date(h.when).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</small></div>`).join('')}</div>`;
}

function currentDeck() { return (WHEEL_PRESETS[state.lang] || WHEEL_PRESETS.zh)[state.wheelDeck] || Object.values(WHEEL_PRESETS[state.lang] || WHEEL_PRESETS.zh)[0]; }
function currentDecks() { return WHEEL_PRESETS[state.lang] || WHEEL_PRESETS.zh; }
function wheelItems() {
  const custom = state.customWheel.split('\n').map(x=>x.trim()).filter(Boolean);
  return custom.length >= 2 ? custom : currentDeck().items;
}
function wheelView() {
  const decks = currentDecks();
  const deck = currentDeck();
  const items = wheelItems();
  return `<section class="scene-hero glass accent-magenta"><button class="ghost" data-action="home">← ${t('back')}</button><span class="big-icon">🎡</span><h1>${t('wheel')}</h1><p>${state.lang==='zh'?'这版不是普通彩虹盘：有真实减速、指针反馈、结果弹窗和加码闭环。':'This wheel has inertia, pointer feedback, result modal and escalation.'}</p></section>
  <section class="wheel-layout">
    <div class="wheel-card glass">
      <div class="wheel-stage">
        <div class="wheel-pointer"><span>▼</span></div>
        <div class="wheel-shadow"></div>
        <div class="wheel" id="wheel"><div class="wheel-core"><b>${state.lang==='zh'?'开转':'SPIN'}</b><small>${items.length}</small></div></div>
      </div>
      <button class="primary big spin-btn" data-action="spin">${t('spin')}</button>
      <div class="wheel-result ${state.wheelResult?'hot':''}"><small>${t('wheelLive')}</small><b>${esc(state.wheelResult || (state.lang==='zh'?'还没开转':'Not spun yet'))}</b></div>
    </div>
    <aside class="wheel-side glass">
      <h2>${t('usePreset')}</h2>
      <div class="preset-row">${Object.entries(decks).map(([id,d])=>`<button class="deck-pill ${state.wheelDeck===id?'active':''}" data-action="preset" data-preset="${id}"><b>${esc(d.label)}</b><small>${esc(d.desc)}</small></button>`).join('')}</div>
      <label class="custom-wheel"><span>${state.lang==='zh'?'自定义转盘':'Custom wheel'}</span><textarea data-input="customWheel" placeholder="${t('customWheel')}">${esc(state.customWheel)}</textarea></label>
      <div class="round-list"><h3>${t('wheelQueue')}</h3>${items.slice(0,12).map((it,i)=>`<p><span>${i+1}</span>${esc(it)}</p>`).join('')}</div>
    </aside>
  </section>`;
}
function drawWheel() {
  const node = $('#wheel'); if (!node) return;
  const items = wheelItems();
  const colors = ['#ff2f6d','#ff4f91','#ff7a59','#ffc061','#e64980','#a855f7','#7c3aed','#ff1744','#ff6bcb','#f72585'];
  const step = 360 / items.length;
  const gradient = items.map((_,i)=>`${colors[i%colors.length]} ${i*step}deg ${(i+1)*step}deg`).join(',');
  node.style.background = `conic-gradient(${gradient})`;
  node.style.transform = `rotate(${state.wheelRotation}deg)`;
}
function spinWheel() {
  if ($('.wheel-card')?.classList.contains('is-spinning')) return;
  const items = wheelItems();
  const idx = Math.floor(Math.random()*items.length);
  const step = 360 / items.length;
  const base = ((state.wheelRotation % 360) + 360) % 360;
  const target = 360 - (idx * step + step / 2);
  const extra = 360 * (7 + Math.floor(Math.random()*3));
  state.wheelRotation += extra + target - base + (Math.random() - .5) * step * .3;
  state.wheelResult = '';
  state.wheelModal = null;
  saveState();
  const wheel = $('#wheel');
  const card = $('.wheel-card');
  const btn = $('.spin-btn');
  if (btn) btn.textContent = t('spinning');
  card?.classList.add('is-spinning');
  if (wheel) wheel.style.transform = `rotate(${state.wheelRotation}deg)`;
  vibrate([12, 20, 12]);
  spinTimer = setTimeout(() => {
    const text = items[idx];
    state.wheelResult = text;
    state.wheelModal = { text, level: state.maxLevel, deck: currentDeck().label };
    state.history = [{ when: Date.now(), card:{type:'wheel', level:state.maxLevel, zh:text, en:text, tags:['wheel', state.wheelDeck]}}, ...state.history].slice(0,50);
    saveState(); render(); burst(); vibrate([30, 40, 30, 40, 60]);
  }, 3600);
}
function resultModal() {
  if (!state.wheelModal) return '';
  return `<div class="modal-backdrop"><section class="result-modal glass">
    <p class="eyebrow">${esc(state.wheelModal.deck)} · ${state.wheelModal.level} ${esc(t('levelNames')[state.wheelModal.level])}</p>
    <h2>${t('wheelUnlock')}</h2>
    <p class="result-text">${esc(state.wheelModal.text)}</p>
    <div class="modal-actions"><button class="primary" data-action="acceptWheel">${t('accept')}</button><button data-action="rerollWheel">${t('reroll')}</button><button data-action="softerWheel">${t('softer')}</button><button data-action="bolderWheel">${t('bolder')}</button><button class="ghost" data-action="closeModal">${t('close')}</button></div>
  </section></div>`;
}

function diceView() {
  const r = state.diceResult;
  return `<section class="scene-hero glass accent-gold"><button class="ghost" data-action="home">← ${t('back')}</button><span class="big-icon">🎲</span><h1>${t('dice')}</h1><p>${state.lang==='zh'?'动作 + 位置 + 时长 + 语气，结果跟随当前尺度。':'Action + area + time + tone, based on heat level.'}</p></section>
  <section class="dice-zone glass">
    <div class="dice-row ${r?'rolled':''}"><div class="die"><small>${state.lang==='zh'?'动作':'Action'}</small>${esc(r?.action || '？')}</div><div class="die"><small>${state.lang==='zh'?'位置':'Area'}</small>${esc(r?.area || '？')}</div><div class="die"><small>${state.lang==='zh'?'时长':'Time'}</small>${r?.time ? `${r.time}s` : '？'}</div><div class="die"><small>${state.lang==='zh'?'语气':'Tone'}</small>${esc(r?.tone || '？')}</div></div>
    <button class="primary big" data-action="roll">${t('roll')}</button>
    ${r?`<p class="dice-sentence"><small>${t('diceTask')}</small>${esc(r.action)} · ${esc(r.area)} · ${r.time}s · ${esc(r.tone)}</p>`:''}
  </section>`;
}
function dicePick(list) { const filtered = list.filter(x => Number(x[0]) <= state.maxLevel); return sample(filtered.length ? filtered : list); }
function diceLabel(item) { return state.lang === 'zh' ? item[1] : item[2]; }
function rollDice() {
  const action = dicePick(DICE.actions), area = dicePick(DICE.areas), tone = dicePick(DICE.tones), time = dicePick(DICE.times);
  const r = { action: diceLabel(action), area: diceLabel(area), tone: diceLabel(tone), time: time[1] };
  state.diceResult = r;
  const line = `${r.action} · ${r.area} · ${r.time}s · ${r.tone}`;
  state.history = [{ when: Date.now(), card:{ type:'dice', level:state.maxLevel, zh:line, en:line, tags:['dice'] } }, ...state.history].slice(0,50);
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
  const min = Math.floor(state.timerLeft / 60).toString().padStart(2,'0');
  const sec = Math.floor(state.timerLeft % 60).toString().padStart(2,'0');
  return `<section class="scene-hero glass accent-gold"><button class="ghost" data-action="home">← ${t('back')}</button><h1>${t('timer')}</h1><p>${state.lang==='zh'?'亲吻、挑逗、角色任务都可以直接倒计时。':'Timer for kisses, teasing and role tasks.'}</p></section><section class="timer-card glass"><div class="timer-face">${min}:${sec}</div><input type="range" min="15" max="300" step="15" value="${state.timerTotal}" data-input="timerTotal"><div class="timer-actions"><button data-action="timerPreset" data-sec="60">${t('oneMin')}</button><button data-action="timerPreset" data-sec="180">${t('threeMin')}</button><button data-action="timerPreset" data-sec="300">${t('fiveMin')}</button><button class="primary" data-action="timerToggle">${state.timerRunning?t('pause'):t('start')}</button><button data-action="timerReset">${t('reset')}</button></div></section>`;
}
function startTimer() {
  clearInterval(timerId);
  timerId = setInterval(() => {
    state.timerLeft -= 1;
    if (state.timerLeft <= 0) { state.timerLeft = 0; state.timerRunning = false; clearInterval(timerId); burst(); vibrate([60,40,60]); }
    saveState();
    if (state.route === 'timer') render();
  }, 1000);
}
function stopTimerIfNeeded() { clearInterval(timerId); timerId = null; }

function editorView() {
  return `<section class="scene-hero glass"><button class="ghost" data-action="home">← ${t('back')}</button><h1>${t('editor')}</h1><p>${t('editorTip')}</p></section><section class="panel glass editor-form"><label>${t('type')}<select data-field="type"><option value="truth">truth</option><option value="dare">dare</option><option value="kiss">kiss</option><option value="touch">touch</option><option value="role">role</option><option value="prop">prop</option><option value="dirty">dirty</option></select></label><label>${t('level')}<input type="number" min="1" max="5" value="3" data-field="level"></label><label>${t('zhText')}<textarea data-field="zh"></textarea></label><label>${t('enText')}<textarea data-field="en"></textarea></label><button class="primary" data-action="addCustom">${t('add')}</button></section>`;
}
function settingsView() {
  return `<section class="scene-hero glass"><button class="ghost" data-action="home">← ${t('back')}</button><h1>${t('settings')}</h1><p>${t('privacy')}</p></section><section class="settings-list"><button data-action="lang">${t('lang')}: ${state.lang === 'zh' ? '中文' : 'English'}</button><button data-action="exportBackup">${t('backup')}</button><label class="file-label">${t('restore')}<input type="file" accept="application/json" data-file="restore"></label><button class="danger-line" data-action="resetAll">${t('resetAll')}</button></section>`;
}

function hydrateControls() {
  $$('[data-gate]').forEach(el => el.addEventListener('change', () => { const all = $$('[data-gate]').every(x => x.checked); const btn = $('[data-action="accept"]'); if (btn) btn.disabled = !all; }));
  $$('[data-action]').forEach(btn => btn.addEventListener('click', onAction));
  $$('[data-input]').forEach(input => input.addEventListener('input', e => {
    const key = e.currentTarget.dataset.input;
    const value = e.currentTarget.type === 'range' || e.currentTarget.type === 'number' ? Number(e.currentTarget.value) : e.currentTarget.value;
    state[key] = value;
    if (key === 'maxLevel') state.maxLevel = Number(value);
    if (key === 'timerTotal') { state.timerTotal = Number(value); state.timerLeft = Number(value); }
    saveState();
    if (key === 'customWheel') drawWheel();
  }));
  $$('[data-prop]').forEach(input => input.addEventListener('change', e => {
    const id = e.currentTarget.dataset.prop;
    state.selectedProps = e.currentTarget.checked ? [...new Set([...state.selectedProps,id])] : state.selectedProps.filter(x=>x!==id);
    saveState();
  }));
  $$('[data-file="restore"]').forEach(input => input.addEventListener('change', restoreBackup));
}

function onAction(e) {
  const el = e.currentTarget;
  const action = el.dataset.action;
  if (action === 'accept') { state.accepted = true; saveState(); render(); }
  if (action === 'home') route('home', { lastCard: null });
  if (action === 'route') route(el.dataset.route, { lastCard: null });
  if (action === 'lang') { state.lang = state.lang === 'zh' ? 'en' : 'zh'; saveState(); render(); }
  if (action === 'safety') { state.timerRunning = false; state.wheelModal = null; state.lastCard = null; saveState(); toast(t('safetyHint')); render(); }
  if (action === 'saveNames') { saveState(); toast(t('saved')); }
  if (action === 'openScene') route('scene', { activeScene: el.dataset.scene, lastCard: null });
  if (action === 'setLevel') { state.maxLevel = Number(el.dataset.level); saveState(); render(); }
  if (action === 'draw' || action === 'skip') drawCard();
  if (action === 'softer') { state.maxLevel = Math.max(1, state.maxLevel - 1); drawCard(); }
  if (action === 'bolder') { state.maxLevel = Math.min(5, state.maxLevel + 1); drawCard(); }
  if (action === 'scriptDraw') { const step = scriptPlan[state.scriptStep]; drawCard({ scene: step.scene, level: step.level }); }
  if (action === 'scriptNext') { state.scriptStep = Math.min(scriptPlan.length - 1, state.scriptStep + 1); state.lastCard = null; saveState(); render(); }
  if (action === 'scriptReset') { state.scriptStep = 0; state.lastCard = null; saveState(); render(); }
  if (action === 'setScript') { state.scriptStep = Number(el.dataset.step); state.lastCard = null; saveState(); render(); }
  if (action === 'preset') { state.wheelDeck = el.dataset.preset; state.wheelResult = ''; state.wheelModal = null; saveState(); render(); }
  if (action === 'spin') spinWheel();
  if (action === 'acceptWheel') { state.wheelModal = null; saveState(); render(); toast(t('complete')); }
  if (action === 'rerollWheel') { state.wheelModal = null; saveState(); render(); setTimeout(spinWheel, 60); }
  if (action === 'softerWheel') { state.maxLevel = Math.max(1, state.maxLevel - 1); state.wheelModal = null; saveState(); render(); }
  if (action === 'bolderWheel') { state.maxLevel = Math.min(5, state.maxLevel + 1); state.wheelModal = null; saveState(); render(); }
  if (action === 'closeModal') { state.wheelModal = null; saveState(); render(); }
  if (action === 'roll') rollDice();
  if (action === 'boundary') { const {id, who, value} = el.dataset; state.boundaries[id] = { ...(state.boundaries[id] || {}), [who]: value }; saveState(); render(); }
  if (action === 'clearBoundaries') { state.boundaries = {}; saveState(); render(); }
  if (action === 'timerToggle') { state.timerRunning = !state.timerRunning; saveState(); render(); }
  if (action === 'timerReset') { state.timerRunning = false; state.timerLeft = state.timerTotal; saveState(); render(); }
  if (action === 'timerPreset') { state.timerRunning = false; state.timerTotal = Number(el.dataset.sec); state.timerLeft = state.timerTotal; saveState(); render(); }
  if (action === 'addCustom') addCustomCard();
  if (action === 'exportBackup') exportBackup();
  if (action === 'resetAll') { if (confirm(state.lang==='zh'?'确定清空本地数据？':'Reset all local data?')) { localStorage.removeItem(STORE_KEY); state = { ...defaultState, accepted: true, lang: state.lang }; render(); } }
}

function addCustomCard() {
  const type = $('[data-field="type"]')?.value || 'dare';
  const level = Math.min(5, Math.max(1, Number($('[data-field="level"]')?.value || 3)));
  const zh = $('[data-field="zh"]')?.value.trim();
  const en = $('[data-field="en"]')?.value.trim() || zh;
  if (!zh) return;
  state.customCards.push({ id:`u${Date.now()}`, type, level, zh, en, tags:['custom'] });
  saveState(); toast(t('added')); render();
}
function exportBackup() {
  const blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `couple-spark-backup-${Date.now()}.json`; a.click(); URL.revokeObjectURL(a.href); toast(t('copied'));
}
function restoreBackup(e) {
  const file = e.currentTarget.files?.[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { try { state = { ...defaultState, ...JSON.parse(reader.result) }; saveState(); render(); toast(t('imported')); } catch { toast('Import failed'); } };
  reader.readAsText(file);
}
function burst() {
  const wrap = document.createElement('div'); wrap.className = 'burst';
  for (let i=0;i<28;i++) { const dot = document.createElement('i'); const a = Math.random()*Math.PI*2; const d = 70 + Math.random()*180; dot.style.setProperty('--x', `${Math.cos(a)*d}px`); dot.style.setProperty('--y', `${Math.sin(a)*d}px`); wrap.appendChild(dot); }
  document.body.appendChild(wrap); setTimeout(()=>wrap.remove(), 900);
}

render();
