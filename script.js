'use strict';
const KEY = 'pocketPals.v1';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const PETS = {
  cat: ['🐱', 'Cat'], dog: ['🐶', 'Dog'], bunny: ['🐰', 'Bunny'],
  panda: ['🐼', 'Panda'], dragon: ['🐲', 'Dragon'], fox: ['🦊', 'Fox']
};
const SAD = { cat: '😿', dog: '🐶', bunny: '🐰', panda: '🐼', dragon: '🐲', fox: '🦊' };
const FOODS = [
  { id: 'kibble', name: 'Kibble', ico: '🥣', gain: 15, cost: 0, lvl: 1, xp: 4 },
  { id: 'apple', name: 'Apple', ico: '🍎', gain: 20, cost: 0, lvl: 1, xp: 5 },
  { id: 'pizza', name: 'Pizza', ico: '🍕', gain: 35, cost: 5, lvl: 2, xp: 8 },
  { id: 'cake', name: 'Cake', ico: '🍰', gain: 50, cost: 10, lvl: 4, xp: 12 }
];
const ITEMS = [
  { id: 'bow', name: 'Bow', ico: '🎀', type: 'acc', cost: 15, lvl: 1 },
  { id: 'glasses', name: 'Shades', ico: '🕶️', type: 'acc', cost: 25, lvl: 2 },
  { id: 'hat', name: 'Top hat', ico: '🎩', type: 'acc', cost: 30, lvl: 3 },
  { id: 'crown', name: 'Crown', ico: '👑', type: 'acc', cost: 80, lvl: 5 },
  { id: 'garden', name: 'Garden', ico: '🌳', type: 'room', cost: 40, lvl: 2 },
  { id: 'space', name: 'Space', ico: '🚀', type: 'room', cost: 90, lvl: 4 },
  { id: 'ball', name: 'Squeaky ball', ico: '⚽', type: 'toy', cost: 20, lvl: 1, note: '+5 play joy' }
];
const ACHS = [
  { id: 'meal', name: 'First Meal', ico: '🍽️', test: s => s.c.feeds >= 1 },
  { id: 'play10', name: 'Played 10 Times', ico: '🎾', test: s => s.c.plays >= 10 },
  { id: 'lvl5', name: 'Reached Level 5', ico: '⭐', test: s => s.level >= 5 },
  { id: 'rich', name: 'Saved 500 Coins', ico: '💰', test: s => s.coins >= 500 },
  { id: 'perfect', name: 'Perfect Health', ico: '💖', test: s => s.health >= 100 },
  { id: 'gamer', name: 'Star Catcher', ico: '🌠', test: s => s.c.games >= 1 }
];
const STATS = [
  ['hunger', 'Hunger', '🍗'], ['happiness', 'Happiness', '😊'],
  ['energy', 'Energy', '⚡'], ['health', 'Health', '❤️']
];

let S = null, selected = null, sleepTimer = null, bubbleTimer = null, sessionStart = Date.now();

/* ---------- save / load ---------- */
const save = () => { S.last = Date.now(); S.c.playtime += (Date.now() - sessionStart) / 1000; sessionStart = Date.now(); localStorage.setItem(KEY, JSON.stringify(S)); };
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
const clamp = v => Math.max(0, Math.min(100, v));
const xpNeeded = () => 50 + (S.level - 1) * 30;

/* ---------- adoption ---------- */
function buildAdoption() {
  const box = $('#petChoices');
  Object.entries(PETS).forEach(([k, [ico, label]]) => {
    const b = document.createElement('button');
    b.className = 'choice'; b.innerHTML = `${ico}<small>${label}</small>`;
    b.onclick = () => { selected = k; $$('.choice').forEach(c => c.classList.remove('sel')); b.classList.add('sel'); $('#nameError').textContent = ''; };
    box.append(b);
  });
  $('#adoptBtn').onclick = () => {
    const name = $('#nameInput').value.trim();
    if (!selected) return ($('#nameError').textContent = 'Choose a pet first.');
    if (name.length < 2) return ($('#nameError').textContent = 'Name must be at least 2 characters.');
    if (!/^[\p{L}\p{N} '-]+$/u.test(name)) return ($('#nameError').textContent = 'Use letters and numbers only.');
    S = {
      name, type: selected, hunger: 80, happiness: 80, energy: 80, health: 100,
      level: 1, xp: 0, coins: 20, owned: ['kibble', 'apple'], acc: null, room: 'bedroom',
      adopted: Date.now(), last: Date.now(), ach: [], favFood: '—',
      c: { feeds: 0, plays: 0, cleans: 0, sleeps: 0, games: 0, playtime: 0, foodCount: {} }
    };
    save(); start();
  };
}

function start() {
  $('#adopt').classList.add('hidden'); $('#game').classList.remove('hidden');
  applyOffline(); renderAll(); say(`Hi, I'm ${S.name}!`);
}

/* ---------- time system ---------- */
function decay(minutes) {
  S.hunger = clamp(S.hunger - 1.5 * minutes);
  S.happiness = clamp(S.happiness - 1 * minutes);
  S.energy = clamp(S.energy - 0.6 * minutes);
  if (S.hunger < 20 || S.happiness < 15) S.health = clamp(S.health - 1.2 * minutes);
  else if (S.hunger > 60 && S.happiness > 50) S.health = clamp(S.health + 0.3 * minutes);
}
function applyOffline() {
  const mins = Math.min((Date.now() - S.last) / 60000, 600);
  if (mins > 1) { decay(mins * 0.4); toast(`You were away ${Math.round(mins)} min. ${S.name} missed you!`); }
}
setInterval(() => { if (!S || !$('#game') || $('#game').classList.contains('hidden')) return; decay(0.25); renderStats(); save(); }, 15000);

/* ---------- mood ---------- */
function mood() {
  if (S.sleeping) return ['Sleeping', 'sleeping'];
  if (S.health < 30) return ['Sick', 'sad'];
  if (S.hunger < 25) return ['Hungry', 'sad'];
  if (S.energy < 20) return ['Tired', 'sad'];
  if (S.happiness < 30) return ['Sad', 'sad'];
  if (S.happiness > 75 && S.energy > 60) return ['Excited', 'happy'];
  return ['Calm', ''];
}

/* ---------- render ---------- */
function renderAll() { renderStats(); renderFood(); renderShop(); renderWardrobe(); renderProfile(); applyTheme(); }
function renderStats() {
  const [m, cls] = mood();
  $('#petName').textContent = S.name; $('#petType').textContent = PETS[S.type][1];
  $('#level').textContent = S.level; $('#coins').textContent = S.coins;
  $('#xpFill').style.width = (S.xp / xpNeeded() * 100) + '%';
  $('#mood').textContent = m;
  $('#condition').textContent = S.health > 75 ? 'Healthy' : S.health > 40 ? 'Feeling meh' : 'Needs care';
  const pet = $('#pet'); pet.className = 'pet ' + cls;
  $('#face').textContent = (mood()[0] === 'Sad' && S.type === 'cat') ? SAD.cat : PETS[S.type][0];
  $('#acc').textContent = S.acc ? ITEMS.find(i => i.id === S.acc).ico : '';
  $('#zzz').classList.toggle('hidden', !S.sleeping);
  $('#stats').innerHTML = STATS.map(([k, label, ico]) => {
    const v = Math.round(S[k]); const col = v > 60 ? 'var(--mint)' : v > 30 ? 'var(--sun)' : 'var(--berry)';
    return `<div class="stat"><label><span>${ico} ${label}</span><span>${v}%</span></label><div class="bar"><i style="width:${v}%;background:${col}"></i></div></div>`;
  }).join('');
  checkAch();
}
function applyTheme() {
  const h = new Date().getHours();
  document.body.className = h >= 6 && h < 17 ? '' : h >= 17 && h < 20 ? 'sunset' : 'night';
  $('#stage').className = 'stage ' + S.room;
}

/* ---------- feedback ---------- */
function say(text, ms = 2200) {
  const b = $('#bubble'); b.textContent = text; b.classList.add('show');
  clearTimeout(bubbleTimer); bubbleTimer = setTimeout(() => b.classList.remove('show'), ms);
}
function anim(cls) { const p = $('#pet'); p.classList.remove('shake', 'celebrate'); void p.offsetWidth; p.classList.add(cls); setTimeout(() => p.classList.remove(cls), 900); }
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2600); }
function gain(xp, coins = 0) {
  S.xp += xp; S.coins += coins;
  while (S.xp >= xpNeeded()) { S.xp -= xpNeeded(); S.level++; S.coins += 10; anim('celebrate'); toast(`Level ${S.level}! +10 coins. New items may be unlocked.`); renderFood(); renderShop(); }
}
function blocked() { if (S.sleeping) { say('Zzz… let me sleep'); return true; } return false; }
function commit() { renderStats(); renderProfile(); save(); }

/* ---------- actions ---------- */
function feed(id) {
  if (blocked()) return;
  const f = FOODS.find(x => x.id === id);
  if (S.hunger >= 95) { say("I'm stuffed!"); return anim('shake'); }
  if (!S.owned.includes(id)) { if (S.coins < f.cost) return toast('Not enough coins.'); S.coins -= f.cost; }
  S.hunger = clamp(S.hunger + f.gain); S.c.feeds++; S.c.foodCount[f.name] = (S.c.foodCount[f.name] || 0) + 1;
  S.favFood = Object.entries(S.c.foodCount).sort((a, b) => b[1] - a[1])[0][0];
  gain(f.xp, 1); say('Yummy!'); anim('celebrate'); commit();
}
const actions = {
  play() {
    if (S.energy < 15) { say("I'm too tired right now."); return anim('shake'); }
    S.happiness = clamp(S.happiness + 18 + (S.owned.includes('ball') ? 5 : 0));
    S.energy = clamp(S.energy - 15); S.hunger = clamp(S.hunger - 6); S.c.plays++;
    gain(8, 3); say('Wheee!'); anim('celebrate');
  },
  sleep() {
    if (S.energy > 90) { say("I'm not sleepy."); return; }
    S.sleeping = true; say('Goodnight…', 1500); renderStats();
    sleepTimer = setTimeout(() => { S.sleeping = false; S.energy = clamp(S.energy + 55); S.c.sleeps++; gain(5, 1); say('Good morning!'); commit(); }, 4000);
    return;
  },
  clean() { S.health = clamp(S.health + 10); S.happiness = clamp(S.happiness + 4); S.c.cleans++; gain(5, 1); say('So fresh!'); },
  heal() { S.health = clamp(S.health + 20); S.hunger = clamp(S.hunger - 3); gain(6, 1); say('Thank you!'); }
};
function act(a) { if (blocked()) return; actions[a](); commit(); }

/* ---------- lists ---------- */
function card(ico, name, sub, btnHtml, cls = '') { return `<div class="card ${cls}"><span class="ico">${ico}</span><b>${name}</b><small>${sub}</small>${btnHtml}</div>`; }
function renderFood() {
  $('#foodList').innerHTML = FOODS.map(f => {
    const lock = S.level < f.lvl;
    const cost = S.owned.includes(f.id) || f.cost === 0 ? 'Free' : `🪙 ${f.cost}`;
    return card(f.ico, f.name, lock ? `Unlocks at level ${f.lvl}` : `+${f.gain} hunger · ${cost}`, `<button class="btn" data-feed="${f.id}" ${lock ? 'disabled' : ''}>Feed</button>`, lock ? 'locked' : '');
  }).join('');
}
function renderShop() {
  $('#shopList').innerHTML = ITEMS.map(i => {
    const own = S.owned.includes(i.id), lock = S.level < i.lvl;
    const btn = own ? '<button class="btn" disabled>Owned</button>' : `<button class="btn" data-buy="${i.id}" ${lock ? 'disabled' : ''}>🪙 ${i.cost}</button>`;
    return card(i.ico, i.name, lock ? `Unlocks at level ${i.lvl}` : (i.note || i.type), btn, own ? 'done' : lock ? 'locked' : '');
  }).join('');
}
function renderWardrobe() {
  const mine = t => ITEMS.filter(i => i.type === t && S.owned.includes(i.id));
  $('#accList').innerHTML = mine('acc').map(i => card(i.ico, i.name, S.acc === i.id ? 'Wearing' : '', `<button class="btn ghost" data-equip="${i.id}">${S.acc === i.id ? 'Take off' : 'Wear'}</button>`, S.acc === i.id ? 'equipped' : '')).join('') || '<p>Buy accessories in the shop.</p>';
  const rooms = [{ id: 'bedroom', name: 'Bedroom', ico: '🛏️' }, ...mine('room')];
  $('#roomList').innerHTML = rooms.map(r => card(r.ico, r.name, S.room === r.id ? 'Current' : '', `<button class="btn ghost" data-room="${r.id}">Use</button>`, S.room === r.id ? 'equipped' : '')).join('');
}
function renderProfile() {
  const t = Math.round(S.c.playtime / 60);
  const days = Math.max(0, Math.floor((Date.now() - S.adopted) / 864e5));
  const f = [['Name', S.name], ['Type', PETS[S.type][1]], ['Age', days + ' day' + (days === 1 ? '' : 's')], ['Level', S.level],
    ['Adopted', new Date(S.adopted).toLocaleDateString()], ['Favorite food', S.favFood], ['Playtime', t + ' min'], ['Meals / plays', `${S.c.feeds} / ${S.c.plays}`]];
  $('#facts').innerHTML = f.map(([k, v]) => `<li><b>${k}</b>${v}</li>`).join('');
  $('#achList').innerHTML = ACHS.map(a => card(a.ico, a.name, S.ach.includes(a.id) ? 'Unlocked' : 'Locked', '', S.ach.includes(a.id) ? 'done' : 'locked')).join('');
}
function checkAch() {
  ACHS.forEach(a => { if (!S.ach.includes(a.id) && a.test(S)) { S.ach.push(a.id); toast(`Achievement: ${a.name}`); S.coins += 5; renderProfile(); } });
}

/* ---------- mini-game ---------- */
let gTimer = null, gSpawn = null;
function startGame() {
  if (blocked()) return;
  if (S.energy < 10) return say("I'm too tired right now.");
  let score = 0, time = 15; const arena = $('#arena');
  arena.innerHTML = ''; arena.style.display = 'block';
  $('#gScore').textContent = 0; $('#gTime').textContent = time; $('#startGame').disabled = true;
  gSpawn = setInterval(() => {
    const s = document.createElement('button'); s.className = 'star'; s.textContent = '⭐'; s.setAttribute('aria-label', 'Catch star');
    s.style.left = Math.random() * (arena.clientWidth - 50) + 'px'; s.style.top = Math.random() * (arena.clientHeight - 50) + 'px';
    s.onclick = () => { score++; $('#gScore').textContent = score; s.remove(); };
    arena.append(s); setTimeout(() => s.remove(), 1100);
  }, 550);
  gTimer = setInterval(() => {
    $('#gTime').textContent = --time;
    if (time <= 0) {
      clearInterval(gTimer); clearInterval(gSpawn); arena.innerHTML = `<p>Finished! ${score} stars.</p>`; arena.style.display = 'grid';
      $('#startGame').disabled = false; S.c.games++; S.energy = clamp(S.energy - 8); S.happiness = clamp(S.happiness + 10);
      gain(score * 2, score); toast(`+${score} coins`); commit();
    }
  }, 1000);
}

/* ---------- events ---------- */
function bind() {
  $('#tabs').onclick = e => {
    const t = e.target.dataset.tab; if (!t) return;
    $$('#tabs button').forEach(b => b.classList.toggle('active', b === e.target));
    $$('.panel').forEach(p => p.classList.toggle('hidden', p.id !== 'panel-' + t));
    if (t === 'profile') renderProfile();
  };
  $('#panel-room').onclick = e => { const a = e.target.dataset.act; if (a) act(a); };
  $('#foodList').onclick = e => { if (e.target.dataset.feed) feed(e.target.dataset.feed); };
  $('#shopList').onclick = e => {
    const i = ITEMS.find(x => x.id === e.target.dataset.buy); if (!i) return;
    if (S.coins < i.cost) return toast('Not enough coins.');
    S.coins -= i.cost; S.owned.push(i.id); toast(`Bought ${i.name}!`); renderShop(); renderWardrobe(); commit();
  };
  $('#panel-wardrobe').onclick = e => {
    const d = e.target.dataset;
    if (d.equip) S.acc = S.acc === d.equip ? null : d.equip;
    if (d.room) S.room = d.room;
    if (d.equip || d.room) { renderWardrobe(); applyTheme(); commit(); }
  };
  $('#startGame').onclick = startGame;
  const poke = () => { if (S.sleeping) return; S.happiness = clamp(S.happiness + 1); say(['Hehe!', 'That tickles!', 'Love you!'][Math.floor(Math.random() * 3)]); anim('celebrate'); renderStats(); };
  $('#pet').onclick = poke; $('#pet').onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); poke(); } };
  $('#resetBtn').onclick = () => $('#modal').classList.remove('hidden');
  $('#cancelReset').onclick = () => $('#modal').classList.add('hidden');
  $('#confirmReset').onclick = () => { localStorage.removeItem(KEY); location.reload(); };
  window.addEventListener('beforeunload', () => { if (S) save(); });
}

/* ---------- init ---------- */
buildAdoption(); bind();
S = load();
if (S) { S.sleeping = false; start(); }
