import { SCENES, TOOLS, PROPS, BOUNDARY_ITEMS, DICE, WHEEL_PRESETS, BUILT_IN_CARDS } from './data.js';
import { getText } from './i18n.js';

const STORAGE_KEY = 'couple-spark-state-v1';
const app = document.querySelector('#app');
let timerHandle = null;
let toastHandle = null;

const DEFAULT_STATE = {
  accepted: false,
  route: 'home',
  previousRoute: 'home',
  lang: 'zh',
  names: { a: '1', b: '2' },
  intensity: 3,
  currentScene: null,
  currentCard: null,
  truthMode: 'both',
  history: [],
  customCards: [],
  selectedProps: [],
  wheel: { items: null, rotation: 0, result: '', spinning: false },
  diceResult: null,
  boundary: {},
  timer: { duration: 180, remaining: 180, running: false, vibrate: true },
  prefs: { lowMotion: false, snow: true },
};

let state = loadState();
applyBodyPrefs();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return deepMerge(structuredClone(DEFAULT_STATE), parsed);
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function deepMerge(target, source) {
  for (const [key, value] of Object.entries(source || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      target[key] = deepMerge(target[key] || {}, value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

function t(key) { return getText(state.lang, key); }
function l10n(item) { return item?.[state.lang] || item?.zh || item?.en || item; }
function esc(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
function clamp(num, min, max) { return Math.max(min, Math.min(max, Number(num))); }
function uid(prefix = 'id') { return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function sample(list) { return list[Math.floor(Math.random() * list.length)]; }
function shuffle(list) { return [...list].sort(() => Math.random() - .5); }
function allCards() { return [...BUILT_IN_CARDS, ...(state.customCards || [])]; }

function personLabels() {
  return {
    a: state.names.a?.trim() || t('personA'),
    b: state.names.b?.trim() || t('personB'),
  };
}

function assignText(text) {
  const names = personLabels();
  const giverIsA = Math.random() > 0.5;
  const giver = giverIsA ? names.a : names.b;
  const receiver = giverIsA ? names.b : names.a;
  return text
    .replaceAll('{giver}', giver)
    .replaceAll('{receiver}', receiver)
    .replaceAll('{p1}', names.a)
    .replaceAll('{p2}', names.b);
}

function toast(message) {
  clearTimeout(toastHandle);
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.appendChild(el);
  toastHandle = setTimeout(() => el.remove(), 1800);
}

function navigate(route, opts = {}) {
  state.previousRoute = state.route;
  state.route = route;
  if (opts.scene) state.currentScene = opts.scene;
  if (opts.draw) drawCard(opts.scene || state.currentScene || 'random', opts.typeMode);
  saveState();
  render();
}

function sceneById(id) { return SCENES.find(scene => scene.id === id) || SCENES.find(scene => scene.id === 'random'); }

function targetLevelForScene(scene) {
  const available = scene?.levels || [1, 2, 3, 4, 5];
  const max = clamp(state.intensity, 1, 5);
  const filtered = available.filter(level => level <= max);
  if (filtered.length) return filtered;
  return [Math.min(...available)];
}

function pickCard(sceneId = 'random', typeMode = null) {
  const scene = sceneById(sceneId);
  let cards = allCards();
  let allowedTypes = scene.types;

  if (typeMode === 'truth') allowedTypes = ['truth'];
  if (typeMode === 'dare') allowedTypes = ['dare', 'kiss', 'touch'];
  if (typeMode === 'both') allowedTypes = ['truth', 'dare', 'kiss', 'touch', 'care'];

  if (allowedTypes?.length) {
    cards = cards.filter(card => allowedTypes.includes(card.type));
  }

  const levels = targetLevelForScene(scene);
  if (sceneId === 'random') {
    const ramp = [1, 1, 2, 2, 3, 3, 4, 3, 2, 1, 5];
    const nextLevel = Math.min(state.intensity, ramp[(state.history?.length || 0) % ramp.length]);
    cards = cards.filter(card => card.level <= Math.max(1, nextLevel));
  } else {
    cards = cards.filter(card => levels.includes(card.level));
  }

  if (state.selectedProps?.length) {
    const propMatched = cards.filter(card => card.props?.some(prop => state.selectedProps.includes(prop)));
    if (propMatched.length >= 3) cards = propMatched;
  }

  if (!cards.length) return null;
  const recentIds = new Set((state.history || []).slice(0, 10).map(item => item.id));
  const fresh = cards.filter(card => !recentIds.has(card.id));
  return sample(fresh.length ? fresh : cards);
}

function cardTypeLabel(type) {
  const map = {
    truth: state.lang === 'zh' ? '真心话' : 'Truth',
    dare: state.lang === 'zh' ? '冒险' : 'Dare',
    kiss: state.lang === 'zh' ? '亲吻' : 'Kiss',
    touch: state.lang === 'zh' ? '触碰' : 'Touch',
    prop: state.lang === 'zh' ? '道具' : 'Prop',
    pose: state.lang === 'zh' ? '姿势' : 'Pose',
    aftercare: state.lang === 'zh' ? '收尾' : 'Aftercare',
    care: state.lang === 'zh' ? '照顾' : 'Care',
  };
  return map[type] || type;
}

function drawCard(sceneId = 'random', typeMode = null) {
  const card = pickCard(sceneId, typeMode);
  if (!card) {
    state.currentCard = null;
    return;
  }
  const text = assignText(card[state.lang] || card.zh || card.en);
  const current = {
    id: card.id,
    type: card.type,
    level: card.level,
    text,
    scene: sceneId,
    time: new Date().toISOString(),
  };
  state.currentCard = current;
  state.currentScene = sceneId;
  state.history = [current, ...(state.history || [])].slice(0, 50);
}

function render() {
  applyBodyPrefs();
  app.innerHTML = `
    ${renderSnow()}
    ${renderSilhouette()}
    <main class="app-shell">
      ${renderTopbar()}
      ${renderRoute()}
    </main>
    ${state.accepted ? '' : renderConsentModal()}
  `;
  if (state.route === 'timer') resumeTimerUi();
}

function renderTopbar() {
  const isHome = state.route === 'home';
  return `
    <header class="topbar">
      <div class="topbar-inner">
        <div class="brand">
          <button class="logo" data-action="home" aria-label="home">💞</button>
          <div>
            <h1>${esc(t('appName'))}</h1>
            <p>${esc(t('tagline'))}</p>
          </div>
        </div>
        <div class="actions">
          ${isHome ? '' : `<button class="btn dark" data-action="back">← <span class="hide-sm">${esc(t('back'))}</span></button>`}
          <button class="btn dark" data-action="safety">🛑 <span class="hide-sm">${esc(t('safety'))}</span></button>
          <button class="btn" data-action="toggle-lang">${state.lang === 'zh' ? 'EN' : '中文'}</button>
        </div>
      </div>
    </header>
  `;
}

function renderRoute() {
  const route = state.route;
  if (route === 'play') return renderPlayScreen();
  if (route === 'wheel') return renderWheelScreen();
  if (route === 'truthdare') return renderTruthDareScreen();
  if (route === 'dice') return renderDiceScreen();
  if (route === 'pose') return renderPoseScreen();
  if (route === 'props') return renderPropsScreen();
  if (route === 'boundary') return renderBoundaryScreen();
  if (route === 'timer') return renderTimerScreen();
  if (route === 'editor') return renderEditorScreen();
  if (route === 'settings') return renderSettingsScreen();
  return renderHome();
}

function renderHome() {
  return `
    <section class="hero screen">
      <div class="panel">
        <h2>${esc(t('guideTitle'))}</h2>
        <p>${esc(t('guideBody'))}</p>
        <p>${esc(t('adultOnly'))}</p>
        <div class="badges">
          <span class="badge">🔒 ${esc(t('localOnly'))}</span>
          <span class="badge">📱 ${esc(t('install'))}</span>
          <span class="badge">🧪 ${esc(t('customizable'))}</span>
          <span class="badge">🌐 ${esc(t('languageSwitch'))}</span>
        </div>
      </div>
      <div class="panel people-card">
        <h2 style="font-size:30px">${esc(t('peopleTitle'))}</h2>
        <div class="inline-fields">
          <div class="field">
            <label>${esc(t('personA'))}</label>
            <input data-bind="names.a" value="${esc(state.names.a)}" placeholder="${esc(t('personA'))}">
          </div>
          <div class="field">
            <label>${esc(t('personB'))}</label>
            <input data-bind="names.b" value="${esc(state.names.b)}" placeholder="${esc(t('personB'))}">
          </div>
        </div>
        <div class="field">
          <label>${esc(t('comfort'))}: ${comfortLabel()}</label>
          <div class="slider-row">
            <span>1</span><input type="range" min="1" max="5" step="1" data-bind="intensity" value="${state.intensity}"><span>5</span>
          </div>
          <small style="color:var(--muted)">${esc(t('comfortHelp'))}</small>
        </div>
        <button class="btn primary" data-action="start-random">✨ ${esc(sceneById('random')[state.lang].button)}</button>
      </div>
    </section>
    <section class="screen">
      <div class="section-head"><div><h2>${esc(t('scenes'))}</h2><p>${esc(t('adultOnly'))}</p></div></div>
      <div class="grid scene-grid">
        ${SCENES.map(scene => renderSceneCard(scene)).join('')}
      </div>
    </section>
    <section class="screen">
      <div class="section-head"><div><h2>${esc(t('tools'))}</h2><p>${esc(state.lang === 'zh' ? '先确认边界，再选择道具，最后按心情抽卡。' : 'Check boundaries, pick props, then draw prompts by mood.')}</p></div></div>
      <div class="grid tool-grid">
        ${TOOLS.map(tool => renderToolCard(tool)).join('')}
      </div>
    </section>
  `;
}

function comfortLabel() {
  if (state.intensity <= 2) return t('soft');
  if (state.intensity === 3) return t('medium');
  return t('bold');
}

function renderSceneCard(scene) {
  const text = l10n(scene);
  const route = ['wheel', 'dice', 'pose'].includes(scene.id) ? scene.id : scene.id === 'truth' ? 'truthdare' : 'play';
  const action = route === 'play' ? 'start-scene' : `open-${route}`;
  return `
    <article class="scene-card" data-accent="${esc(scene.accent)}" data-action="${action}" data-scene="${esc(scene.id)}" tabindex="0" role="button">
      <div>
        <div class="scene-icon">${esc(scene.icon)}</div>
        <h3>${esc(text.title)}</h3>
        <p>${esc(text.subtitle)}</p>
      </div>
      <button class="btn primary block" data-action="${action}" data-scene="${esc(scene.id)}">${esc(text.button)}</button>
    </article>
  `;
}

function renderToolCard(tool) {
  const text = l10n(tool);
  return `
    <article class="tool-card" data-action="open-tool" data-tool="${esc(tool.id)}" tabindex="0" role="button">
      <div>
        <div class="scene-icon">${esc(tool.icon)}</div>
        <h3>${esc(text.title)}</h3>
        <p>${esc(text.subtitle)}</p>
      </div>
      <button class="btn dark block" data-action="open-tool" data-tool="${esc(tool.id)}">${esc(t('start'))}</button>
    </article>
  `;
}

function renderPlayScreen() {
  if (!state.currentCard) drawCard(state.currentScene || 'random');
  const scene = sceneById(state.currentScene || 'random');
  const sceneText = l10n(scene);
  return `
    <section class="screen play-layout">
      <div>
        <div class="section-head"><div><h2>${esc(sceneText.title)}</h2><p>${esc(sceneText.subtitle)}</p></div></div>
        ${renderPromptCard(state.currentCard)}
      </div>
      <aside class="panel">
        <h3>${esc(t('history'))}</h3>
        <div class="history-list">
          ${(state.history || []).length ? state.history.map(renderHistoryItem).join('') : `<div class="empty">${esc(t('noHistory'))}</div>`}
        </div>
      </aside>
    </section>
  `;
}

function renderPromptCard(card) {
  if (!card) return `<div class="prompt-card"><div class="empty">${esc(t('noCard'))}</div><button class="btn primary" data-action="bolder">${esc(t('bolder'))}</button></div>`;
  return `
    <article class="prompt-card">
      <div>
        <div class="prompt-meta">
          <span class="badge">${esc(cardTypeLabel(card.type))}</span>
          <span class="badge">${esc(t('intensity'))} ${card.level}/5</span>
          <span class="badge">${esc(personLabels().a)} × ${esc(personLabels().b)}</span>
        </div>
        <div class="prompt-text">${esc(card.text)}</div>
        <p class="prompt-note">${esc(t('safewordTip'))}</p>
      </div>
      <div class="prompt-actions">
        <button class="btn primary" data-action="next-card">${esc(t('continue'))}</button>
        <button class="btn dark" data-action="skip-card">${esc(t('skip'))}</button>
        <button class="btn" data-action="softer">− ${esc(t('softer'))}</button>
        <button class="btn" data-action="bolder">+ ${esc(t('bolder'))}</button>
      </div>
    </article>
  `;
}

function renderHistoryItem(item) {
  return `<div class="history-item"><strong>${esc(cardTypeLabel(item.type))} · ${item.level}/5</strong><br>${esc(item.text)}</div>`;
}

function renderWheelScreen() {
  const items = getWheelItems();
  const gradient = wheelGradient(items.length);
  const labels = items.map((item, index) => {
    const angle = (index + .5) * 360 / items.length;
    return `<span class="wheel-label" style="transform: rotate(${angle}deg) translateY(-50%)">${esc(item)}</span>`;
  }).join('');
  return `
    <section class="screen wheel-wrap">
      <div class="panel wheel-stage">
        <div class="wheel-pointer"></div>
        <div id="wheelDisc" class="wheel-disc" style="--wheel-gradient:${gradient};--spin:${state.wheel.rotation || 0}deg">
          ${labels}
          <div class="wheel-center">${esc(t('wheel'))}</div>
        </div>
      </div>
      <div class="panel">
        <h2>${esc(t('wheel'))}</h2>
        <p>${esc(t('wheelHelp'))}</p>
        <div class="result-box">
          ${esc(t('wheelResult'))}
          <strong>${state.wheel.result ? esc(state.wheel.result) : '—'}</strong>
        </div>
        <div style="height:12px"></div>
        <button class="btn primary block" data-action="spin-wheel" ${state.wheel.spinning ? 'disabled' : ''}>🎡 ${esc(state.wheel.spinning ? t('spinning') : t('spin'))}</button>
        <div style="height:12px"></div>
        <div class="chip-grid">
          <button class="chip" data-action="wheel-preset" data-preset="soft">${esc(t('loadSoft'))}</button>
          <button class="chip" data-action="wheel-preset" data-preset="spicy">${esc(t('loadSpicy'))}</button>
          <button class="chip" data-action="wheel-preset" data-preset="aftercare">${esc(t('loadCare'))}</button>
        </div>
        <div style="height:12px"></div>
        <div class="field">
          <label>${esc(t('customWheel'))}</label>
          <textarea id="wheelText">${esc(items.join('\n'))}</textarea>
        </div>
        <button class="btn dark" data-action="save-wheel">${esc(t('save'))}</button>
      </div>
    </section>
  `;
}

function getWheelItems() {
  const list = state.wheel.items?.length ? state.wheel.items : WHEEL_PRESETS[state.lang].soft;
  return list.filter(Boolean).slice(0, 24);
}

function wheelGradient(n) {
  const colors = ['#d6247b', '#651a82', '#f03c88', '#40116d'];
  const stops = [];
  for (let i = 0; i < n; i++) {
    const start = (i * 100 / n).toFixed(4);
    const end = ((i + 1) * 100 / n).toFixed(4);
    stops.push(`${colors[i % colors.length]} ${start}% ${end}%`);
  }
  return `conic-gradient(${stops.join(',')})`;
}

function spinWheel() {
  const items = getWheelItems();
  const n = items.length;
  const index = Math.floor(Math.random() * n);
  const segment = 360 / n;
  const current = state.wheel.rotation || 0;
  const extraTurns = 5 + Math.floor(Math.random() * 3);
  const target = 360 - (index + .5) * segment;
  state.wheel.rotation = current + extraTurns * 360 + target;
  state.wheel.result = items[index];
  state.wheel.spinning = true;
  saveState();
  render();
  setTimeout(() => {
    state.wheel.spinning = false;
    saveState();
    render();
  }, 4200);
}

function renderTruthDareScreen() {
  if (!state.currentCard || state.currentCard.scene !== 'truth') drawCard('truth', state.truthMode);
  return `
    <section class="screen play-layout">
      <div>
        <div class="section-head"><div><h2>${esc(t('truthOrDare'))}</h2><p>${esc(t('safewordTip'))}</p></div></div>
        <div class="cards-row">
          ${['truth', 'dare', 'both'].map(mode => `<button class="choice-card ${state.truthMode === mode ? 'active' : ''}" data-action="truth-mode" data-mode="${mode}">${esc(t(mode))}</button>`).join('')}
        </div>
        <div style="height:14px"></div>
        ${renderPromptCard(state.currentCard)}
      </div>
      <aside class="panel">
        <h3>${esc(t('history'))}</h3>
        <div class="history-list">${(state.history || []).slice(0, 12).map(renderHistoryItem).join('') || `<div class="empty">${esc(t('noHistory'))}</div>`}</div>
      </aside>
    </section>
  `;
}

function renderDiceScreen() {
  const r = state.diceResult;
  return `
    <section class="screen play-layout">
      <div class="prompt-card">
        <div>
          <div class="prompt-meta"><span class="badge">🎲 ${esc(t('dice'))}</span><span class="badge">${esc(t('intensity'))} ${state.intensity}/5</span></div>
          <div class="prompt-text">${r ? esc(diceSentence(r)) : esc(state.lang === 'zh' ? '掷出今晚的小组合。' : 'Roll a tiny combo for tonight.')}</div>
          <p class="prompt-note">${esc(state.lang === 'zh' ? '骰子只给建议，执行前依然要得到明确同意。' : 'Dice only suggests; get clear consent before doing anything.')}</p>
        </div>
        <div class="prompt-actions">
          <button class="btn primary" data-action="roll-dice">🎲 ${esc(t('roll'))}</button>
          <button class="btn dark" data-action="open-boundary">${esc(t('boundary'))}</button>
        </div>
      </div>
      <aside class="panel">
        <h3>${esc(t('dice'))}</h3>
        ${r ? `<p><strong>${esc(t('action'))}:</strong> ${esc(r.action[state.lang])}</p><p><strong>${esc(t('area'))}:</strong> ${esc(r.area[state.lang])}</p><p><strong>${esc(t('time'))}:</strong> ${r.time} ${esc(t('seconds'))}</p>` : `<div class="empty">${esc(t('roll'))}</div>`}
      </aside>
    </section>
  `;
}

function rollDice() {
  state.diceResult = { action: sample(DICE.actions), area: sample(DICE.areas), time: sample(DICE.times) };
  saveState(); render();
}

function diceSentence(r) {
  if (state.lang === 'zh') return `${r.time} 秒：${r.action.zh} TA 的${r.area.zh}`;
  return `${r.time} sec: ${r.action.en} your partner's ${r.area.en}`;
}

function renderPoseScreen() {
  if (!state.currentCard || state.currentCard.type !== 'pose') drawCard('pose');
  return `
    <section class="screen play-layout">
      <div class="panel">
        <div class="section-head"><div><h2>${esc(t('pose'))}</h2><p>${esc(state.lang === 'zh' ? '抽到后先摆位置，不舒服就换。' : 'Set the position first; switch if anything feels wrong.')}</p></div></div>
        <div class="pose-art">${poseSvg()}</div>
        ${renderPromptCard(state.currentCard)}
      </div>
      <aside class="panel">
        <h3>${esc(t('props'))}</h3>
        <p>${esc((state.selectedProps || []).length ? selectedPropNames().join(' · ') : (state.lang === 'zh' ? '暂无道具，先玩无道具姿势更轻松。' : 'No props selected; prop-free poses are easier.'))}</p>
        <button class="btn dark block" data-action="open-props">${esc(t('props'))}</button>
      </aside>
    </section>
  `;
}

function poseSvg() {
  return `
    <svg viewBox="0 0 620 380" aria-hidden="true">
      <path d="M101 275 C160 230 202 220 270 247 C337 274 395 265 492 215" fill="none" stroke="white" stroke-width="10" stroke-linecap="round" opacity=".52"/>
      <path d="M158 170 C235 115 318 118 382 169 C432 209 473 205 523 178" fill="none" stroke="white" stroke-width="8" stroke-linecap="round" opacity=".68"/>
      <circle cx="146" cy="162" r="31" fill="none" stroke="white" stroke-width="8" opacity=".68"/>
      <circle cx="513" cy="170" r="31" fill="none" stroke="white" stroke-width="8" opacity=".68"/>
      <path d="M265 135 C284 94 338 90 360 132 C382 177 324 224 286 186 C271 172 263 153 265 135Z" fill="none" stroke="white" stroke-width="8" opacity=".55"/>
      <path d="M286 185 C250 234 199 260 134 285" fill="none" stroke="white" stroke-width="8" stroke-linecap="round" opacity=".55"/>
      <path d="M363 176 C405 232 449 266 535 278" fill="none" stroke="white" stroke-width="8" stroke-linecap="round" opacity=".55"/>
    </svg>`;
}

function renderPropsScreen() {
  return `
    <section class="screen panel">
      <div class="section-head"><div><h2>${esc(t('props'))}</h2><p>${esc(t('propsHelp'))}</p></div><button class="btn primary" data-action="start-random">${esc(t('continue'))}</button></div>
      <div class="chip-grid">
        ${PROPS.map(prop => `<button class="chip ${state.selectedProps.includes(prop.id) ? 'active' : ''}" data-action="toggle-prop" data-prop="${esc(prop.id)}">${esc(prop[state.lang])} · ${prop.level}/5</button>`).join('')}
      </div>
      <div style="height:20px"></div>
      <div class="panel">
        <h3>${esc(t('selectedProps'))}</h3>
        <p class="copy-area" id="propList">${esc(selectedPropNames().join('\n') || (state.lang === 'zh' ? '暂无' : 'None'))}</p>
        <button class="btn dark" data-action="copy-props">${esc(t('copyList'))}</button>
      </div>
    </section>
  `;
}

function selectedPropNames() {
  return PROPS.filter(prop => state.selectedProps.includes(prop.id)).map(prop => prop[state.lang]);
}

function renderBoundaryScreen() {
  const names = personLabels();
  return `
    <section class="screen panel">
      <div class="section-head"><div><h2>${esc(t('boundary'))}</h2><p>${esc(t('boundaryHelp'))}</p></div><button class="btn primary" data-action="start-random">${esc(t('continue'))}</button></div>
      <div class="boundary-table">
        ${BOUNDARY_ITEMS.map(item => renderBoundaryRow(item, names)).join('')}
      </div>
    </section>
  `;
}

function renderBoundaryRow(item, names) {
  const valueA = state.boundary?.[item.id]?.a || 'maybe';
  const valueB = state.boundary?.[item.id]?.b || 'maybe';
  const good = (valueA === 'yes' && valueB === 'yes') || ((valueA === 'yes' || valueA === 'maybe') && (valueB === 'yes' || valueB === 'maybe'));
  return `
    <div class="boundary-row">
      <div class="boundary-title"><strong>${esc(item[state.lang])}</strong><small>${esc(t('intensity'))} ${item.level}/5</small></div>
      ${renderSegment(item.id, 'a', names.a, valueA)}
      ${renderSegment(item.id, 'b', names.b, valueB)}
      <div class="match-pill ${good ? 'good' : ''}">${esc(good ? t('match') : t('mismatch'))}</div>
    </div>
  `;
}

function renderSegment(itemId, person, label, active) {
  return `
    <div>
      <strong style="font-size:12px;color:var(--muted);display:block;margin:0 0 5px 6px">${esc(label)}</strong>
      <div class="segment">
        ${['yes', 'maybe', 'no'].map(v => `<button class="${active === v ? 'active' : ''}" data-action="set-boundary" data-item="${esc(itemId)}" data-person="${person}" data-value="${v}">${esc(t(v))}</button>`).join('')}
      </div>
    </div>
  `;
}

function renderTimerScreen() {
  const min = Math.floor(state.timer.remaining / 60).toString().padStart(2, '0');
  const sec = Math.floor(state.timer.remaining % 60).toString().padStart(2, '0');
  const p = Math.max(0, Math.min(100, (1 - state.timer.remaining / Math.max(1, state.timer.duration)) * 100));
  return `
    <section class="screen play-layout">
      <div class="panel">
        <h2>${esc(t('timer'))}</h2>
        <div class="timer-face"><div class="ring" style="--p:${p}%"><div class="time-text">${min}:${sec}</div></div></div>
        <div class="prompt-actions">
          <button class="btn primary" data-action="timer-toggle">${esc(state.timer.running ? t('pause') : t('start'))}</button>
          <button class="btn dark" data-action="timer-reset">${esc(t('reset'))}</button>
        </div>
      </div>
      <aside class="panel">
        <div class="field">
          <label>${esc(t('minutes'))}</label>
          <input type="range" min="1" max="15" value="${Math.round(state.timer.duration / 60)}" data-bind="timer.durationMinutes">
        </div>
        <label class="chip ${state.timer.vibrate ? 'active' : ''}" data-action="toggle-vibrate">📳 ${esc(t('vibrate'))}</label>
        <p>${esc(state.lang === 'zh' ? '适合按摩、暂停、对视、亲吻和收尾。' : 'Useful for massage, pause, eye contact, kisses and aftercare.')}</p>
      </aside>
    </section>
  `;
}

function resumeTimerUi() {
  if (state.timer.running && !timerHandle) startTimer();
}
function startTimer() {
  clearInterval(timerHandle);
  timerHandle = setInterval(() => {
    if (!state.timer.running) { clearInterval(timerHandle); timerHandle = null; return; }
    state.timer.remaining = Math.max(0, state.timer.remaining - 1);
    if (state.timer.remaining <= 0) {
      state.timer.running = false;
      if (state.timer.vibrate && navigator.vibrate) navigator.vibrate([180, 80, 180]);
      toast(state.lang === 'zh' ? '时间到，先确认感受。' : 'Time is up. Check in first.');
      clearInterval(timerHandle); timerHandle = null;
    }
    saveState();
    if (state.route === 'timer') render();
  }, 1000);
}

function renderEditorScreen() {
  return `
    <section class="screen play-layout">
      <div class="panel">
        <div class="section-head"><div><h2>${esc(t('editor'))}</h2><p>${esc(t('editorHelp'))}</p></div></div>
        <div class="editor-list">
          ${(state.customCards || []).map(renderEditorItem).join('') || `<div class="empty">${esc(state.lang === 'zh' ? '暂无自定义内容。先新增一张。' : 'No custom cards yet. Add one first.')}</div>`}
        </div>
      </div>
      <aside class="panel">
        <h3>${esc(t('addCard'))}</h3>
        <div class="field"><label>${esc(t('titleZh'))}</label><textarea id="newZh" placeholder="${esc(state.lang === 'zh' ? '写一个你们的专属任务…' : 'Write your custom prompt…')}"></textarea></div>
        <div class="field"><label>${esc(t('titleEn'))}</label><textarea id="newEn" placeholder="Write the English version…"></textarea></div>
        <div class="inline-fields">
          <div class="field"><label>${esc(t('type'))}</label><select id="newType">${['truth','dare','kiss','touch','prop','pose','care','aftercare'].map(v => `<option value="${v}">${esc(cardTypeLabel(v))}</option>`).join('')}</select></div>
          <div class="field"><label>${esc(t('level'))}</label><input id="newLevel" type="number" min="1" max="5" value="2"></div>
        </div>
        <div class="field"><label>${esc(t('tags'))}</label><input id="newTags" value="custom"></div>
        <button class="btn primary block" data-action="add-card">${esc(t('addCard'))}</button>
        <div style="height:12px"></div>
        <button class="btn dark block" data-action="export-custom">${esc(t('exportData'))}</button>
        <div class="field"><label>${esc(t('importData'))}</label><textarea id="importCustom" placeholder='[{"zh":"...","en":"..."}]'></textarea></div>
        <button class="btn dark" data-action="import-custom">${esc(t('importData'))}</button>
        <button class="btn ghost" data-action="reset-custom">${esc(t('resetCustom'))}</button>
      </aside>
    </section>
  `;
}

function renderEditorItem(card) {
  return `
    <div class="editor-item" data-card-id="${esc(card.id)}">
      <div class="editor-line"><strong>${esc(cardTypeLabel(card.type))} · ${card.level}/5</strong><input data-edit="zh" value="${esc(card.zh || '')}"><button class="btn small" data-action="delete-card" data-card="${esc(card.id)}">${esc(t('delete'))}</button></div>
      <div class="editor-line"><span>EN</span><input data-edit="en" value="${esc(card.en || '')}"><span></span></div>
      <div class="editor-line"><span>${esc(t('tags'))}</span><input data-edit="tags" value="${esc((card.tags || []).join(','))}"><span></span></div>
    </div>
  `;
}

function renderSettingsScreen() {
  return `
    <section class="screen play-layout">
      <div class="panel">
        <h2>${esc(t('settings'))}</h2>
        <div class="chip-grid">
          <button class="chip ${state.lang === 'zh' ? 'active' : ''}" data-action="set-lang" data-lang="zh">中文</button>
          <button class="chip ${state.lang === 'en' ? 'active' : ''}" data-action="set-lang" data-lang="en">English</button>
          <button class="chip ${state.prefs.lowMotion ? 'active' : ''}" data-action="toggle-pref" data-pref="lowMotion">${esc(t('lowMotion'))}</button>
          <button class="chip ${state.prefs.snow ? 'active' : ''}" data-action="toggle-pref" data-pref="snow">${esc(t('snow'))}</button>
        </div>
        <div style="height:18px"></div>
        <div class="panel">
          <h3>${esc(t('privacy'))}</h3>
          <p>${esc(t('privacyBody'))}</p>
        </div>
      </div>
      <aside class="panel">
        <button class="btn dark block" data-action="export-all">${esc(t('exportAll'))}</button>
        <div class="field"><label>${esc(t('importAll'))}</label><textarea id="importAll" placeholder='{"lang":"zh",...}'></textarea></div>
        <button class="btn dark" data-action="import-all">${esc(t('importAll'))}</button>
        <button class="btn ghost" data-action="reset-all">${esc(t('resetAll'))}</button>
      </aside>
    </section>
  `;
}

function renderConsentModal() {
  return `
    <div class="modal">
      <div class="modal-card">
        <h2>${esc(t('acceptTitle'))}</h2>
        <p>${esc(t('acceptBody'))}</p>
        <div class="checks">
          <label><input type="checkbox" data-consent-check> ${esc(t('acceptA'))}</label>
          <label><input type="checkbox" data-consent-check> ${esc(t('acceptB'))}</label>
          <label><input type="checkbox" data-consent-check> ${esc(t('acceptC'))}</label>
        </div>
        <button class="btn primary block" data-action="accept" disabled>${esc(t('enter'))}</button>
      </div>
    </div>
  `;
}

function renderSnow() {
  const flakes = Array.from({ length: 54 }, (_, i) => {
    const left = Math.random() * 100;
    const delay = -Math.random() * 18;
    const duration = 14 + Math.random() * 16;
    const size = 10 + Math.random() * 20;
    const drift = `${-40 + Math.random() * 80}px`;
    const opacity = .35 + Math.random() * .6;
    return `<span class="snowflake" style="left:${left}%;animation-delay:${delay}s;animation-duration:${duration}s;font-size:${size}px;opacity:${opacity};--drift:${drift}">❄</span>`;
  }).join('');
  return `<div class="snowfield" aria-hidden="true">${flakes}</div>`;
}

function renderSilhouette() {
  return `<svg class="silhouette" viewBox="0 0 420 620" aria-hidden="true"><path d="M193 54c38-20 78 18 63 57-10 25-35 31-61 21-35 36-48 84-36 144 8 39 29 89 31 127 1 26-10 47-32 60-23 13-51 10-68-9-18-20-15-48 7-64 18-13 42-10 53 7-5-45-27-91-35-136-13-73 5-135 54-183 4-11 12-19 24-24Zm106 144c27 9 43 39 34 66-7 24-29 39-53 38-36 44-75 88-118 132 40 11 78 4 114-20 32-21 66 20 38 46-57 53-151 51-218-5-18-15-18-43-1-59 45-44 88-91 128-139-2-23 11-47 33-56 14-6 29-7 43-3Z" fill="none" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function applyBodyPrefs() {
  document.body.classList.toggle('low-motion', !!state.prefs.lowMotion);
  document.body.classList.toggle('no-snow', !state.prefs.snow);
}

function copyText(text) {
  navigator.clipboard?.writeText(text).then(() => toast(t('copied'))).catch(() => {
    const box = document.createElement('textarea');
    box.value = text; document.body.appendChild(box); box.select(); document.execCommand('copy'); box.remove(); toast(t('copied'));
  });
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function importCustomFromText(text) {
  const parsed = JSON.parse(text);
  const cards = Array.isArray(parsed) ? parsed : parsed.customCards;
  if (!Array.isArray(cards)) throw new Error('customCards not found');
  const clean = cards.map((card, index) => ({
    id: card.id || uid('custom'),
    type: ['truth','dare','kiss','touch','prop','pose','care','aftercare'].includes(card.type) ? card.type : 'dare',
    level: clamp(card.level || 2, 1, 5),
    tags: Array.isArray(card.tags) ? card.tags : String(card.tags || 'custom').split(',').map(s => s.trim()).filter(Boolean),
    zh: String(card.zh || card.text || `自定义卡牌 ${index + 1}`),
    en: String(card.en || card.textEn || card.zh || `Custom card ${index + 1}`),
  }));
  state.customCards = [...(state.customCards || []), ...clean].slice(-300);
}

function handleAction(action, target) {
  const ds = target.dataset;
  switch (action) {
    case 'home': state.route = 'home'; saveState(); render(); break;
    case 'back': state.route = state.previousRoute && state.previousRoute !== state.route ? state.previousRoute : 'home'; saveState(); render(); break;
    case 'toggle-lang': state.lang = state.lang === 'zh' ? 'en' : 'zh'; saveState(); render(); break;
    case 'set-lang': state.lang = ds.lang; saveState(); render(); break;
    case 'safety': toast(t('safewordTip')); break;
    case 'accept': state.accepted = true; saveState(); render(); break;
    case 'start-random': navigate('play', { scene: 'random', draw: true }); break;
    case 'start-scene': navigate('play', { scene: ds.scene || 'random', draw: true }); break;
    case 'open-wheel': navigate('wheel', { scene: ds.scene || 'wheel' }); break;
    case 'open-dice': navigate('dice', { scene: 'dice' }); break;
    case 'open-pose': navigate('pose', { scene: 'pose', draw: true }); break;
    case 'open-truthdare': navigate('truthdare', { scene: 'truth', draw: true, typeMode: state.truthMode }); break;
    case 'open-tool': navigate(ds.tool); break;
    case 'open-props': navigate('props'); break;
    case 'open-boundary': navigate('boundary'); break;
    case 'next-card': drawCard(state.currentScene || 'random', state.route === 'truthdare' ? state.truthMode : null); saveState(); render(); break;
    case 'skip-card': state.intensity = clamp(state.intensity - 1, 1, 5); drawCard(state.currentScene || 'random', state.route === 'truthdare' ? state.truthMode : null); saveState(); render(); break;
    case 'softer': state.intensity = clamp(state.intensity - 1, 1, 5); saveState(); render(); break;
    case 'bolder': state.intensity = clamp(state.intensity + 1, 1, 5); drawCard(state.currentScene || 'random', state.route === 'truthdare' ? state.truthMode : null); saveState(); render(); break;
    case 'truth-mode': state.truthMode = ds.mode; drawCard('truth', state.truthMode); saveState(); render(); break;
    case 'roll-dice': rollDice(); break;
    case 'spin-wheel': spinWheel(); break;
    case 'wheel-preset': state.wheel.items = WHEEL_PRESETS[state.lang][ds.preset]; state.wheel.result = ''; saveState(); render(); break;
    case 'save-wheel': {
      const items = document.querySelector('#wheelText')?.value.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 24) || [];
      if (items.length) state.wheel.items = items;
      saveState(); render(); toast(t('save'));
      break;
    }
    case 'toggle-prop': {
      const set = new Set(state.selectedProps || []);
      set.has(ds.prop) ? set.delete(ds.prop) : set.add(ds.prop);
      state.selectedProps = [...set]; saveState(); render(); break;
    }
    case 'copy-props': copyText(selectedPropNames().join('\n')); break;
    case 'set-boundary': {
      state.boundary[ds.item] ||= { a: 'maybe', b: 'maybe' };
      state.boundary[ds.item][ds.person] = ds.value;
      saveState(); render(); break;
    }
    case 'timer-toggle': {
      state.timer.running = !state.timer.running;
      if (state.timer.running) startTimer();
      saveState(); render(); break;
    }
    case 'timer-reset': state.timer.running = false; state.timer.remaining = state.timer.duration; clearInterval(timerHandle); timerHandle = null; saveState(); render(); break;
    case 'toggle-vibrate': state.timer.vibrate = !state.timer.vibrate; saveState(); render(); break;
    case 'add-card': addCardFromForm(); break;
    case 'delete-card': state.customCards = (state.customCards || []).filter(card => card.id !== ds.card); saveState(); render(); break;
    case 'export-custom': downloadJson('couple-spark-custom-cards.json', state.customCards || []); break;
    case 'import-custom': {
      try { importCustomFromText(document.querySelector('#importCustom')?.value || ''); saveState(); render(); toast(t('imported')); }
      catch { toast(t('importError')); }
      break;
    }
    case 'reset-custom': if (confirm(t('resetConfirm'))) { state.customCards = []; saveState(); render(); } break;
    case 'toggle-pref': state.prefs[ds.pref] = !state.prefs[ds.pref]; saveState(); render(); break;
    case 'export-all': downloadJson('couple-spark-backup.json', state); break;
    case 'import-all': {
      try { state = deepMerge(structuredClone(DEFAULT_STATE), JSON.parse(document.querySelector('#importAll')?.value || '{}')); saveState(); render(); toast(t('imported')); }
      catch { toast(t('importError')); }
      break;
    }
    case 'reset-all': if (confirm(t('resetConfirm'))) { localStorage.removeItem(STORAGE_KEY); state = structuredClone(DEFAULT_STATE); render(); } break;
    default: break;
  }
}

function addCardFromForm() {
  const zh = document.querySelector('#newZh')?.value.trim();
  const en = document.querySelector('#newEn')?.value.trim();
  const type = document.querySelector('#newType')?.value || 'dare';
  const level = clamp(document.querySelector('#newLevel')?.value || 2, 1, 5);
  const tags = (document.querySelector('#newTags')?.value || 'custom').split(',').map(s => s.trim()).filter(Boolean);
  if (!zh && !en) return toast(state.lang === 'zh' ? '先写内容。' : 'Write a prompt first.');
  state.customCards = [...(state.customCards || []), { id: uid('custom'), type, level, tags, zh: zh || en, en: en || zh }];
  saveState(); render();
}

app.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  event.preventDefault();
  handleAction(target.dataset.action, target);
});

app.addEventListener('input', (event) => {
  const target = event.target;
  if (target.matches('[data-consent-check]')) {
    const checks = [...document.querySelectorAll('[data-consent-check]')];
    const button = document.querySelector('[data-action="accept"]');
    if (button) button.disabled = !checks.every(box => box.checked);
    return;
  }
  const bind = target.dataset.bind;
  if (bind === 'names.a') state.names.a = target.value;
  if (bind === 'names.b') state.names.b = target.value;
  if (bind === 'intensity') state.intensity = clamp(target.value, 1, 5);
  if (bind === 'timer.durationMinutes') {
    const minutes = clamp(target.value, 1, 15);
    state.timer.duration = minutes * 60;
    if (!state.timer.running) state.timer.remaining = state.timer.duration;
  }
  if (bind) { saveState(); if (bind !== 'names.a' && bind !== 'names.b') render(); }
});

app.addEventListener('change', (event) => {
  const input = event.target;
  const editKey = input.dataset.edit;
  if (!editKey) return;
  const wrap = input.closest('[data-card-id]');
  const id = wrap?.dataset.cardId;
  const card = (state.customCards || []).find(c => c.id === id);
  if (!card) return;
  if (editKey === 'tags') card.tags = input.value.split(',').map(s => s.trim()).filter(Boolean);
  else card[editKey] = input.value;
  saveState();
});

window.addEventListener('beforeunload', saveState);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
}

render();
