/* =========================================================
   لسان — محرك التطبيق
   يعمل بالكامل على الجهاز دون إنترنت، بلا اشتراكات.
   التخزين: IndexedDB (store.js) + نسخة احتياطية في localStorage.
   المراجعة: FSRS (fsrs.js). سجل الأحداث = طابور المزامنة القادمة.
   ========================================================= */
(function () {
'use strict';

/* ---------------- أدوات عامة ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const app = $('#app');
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const en = s => `<bdi class="en" dir="ltr">${esc(s)}</bdi>`;
const dkey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = () => dkey(new Date());
const addDays = (k, n) => { const [y, m, d] = k.split('-').map(Number); return dkey(new Date(y, m - 1, d + n)); };
const IN_CLAUDE = !!(window.claude && typeof window.claude.use === 'function');
const VIEWER_THEME = document.documentElement.dataset.theme;

const CONTR = { "i'm": "i am", "you're": "you are", "we're": "we are", "they're": "they are", "he's": "he is", "she's": "she is", "it's": "it is", "that's": "that is", "what's": "what is", "here's": "here is", "there's": "there is", "isn't": "is not", "aren't": "are not", "wasn't": "was not", "weren't": "were not", "don't": "do not", "doesn't": "does not", "didn't": "did not", "can't": "cannot", "won't": "will not", "i'll": "i will", "you'll": "you will", "we'll": "we will", "they'll": "they will", "she'll": "she will", "he'll": "he will", "haven't": "have not", "hasn't": "has not", "mustn't": "must not", "shouldn't": "should not", "let's": "let us", "i've": "i have" };
function norm(s) {
  let t = String(s).toLowerCase().replace(/[’‘`]/g, "'").replace(/can not/g, 'cannot').replace(/[^a-z0-9'\s-]+/g, ' ').replace(/-/g, ' ');
  return t.split(/\s+/).filter(Boolean).map(w => CONTR[w] || w).join(' ').trim();
}
function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
  return prev[n];
}
function wordSim(a, b) { // تشابه على مستوى الكلمات (LCS)
  const x = norm(a).split(' '), y = norm(b).split(' ');
  const dp = Array.from({ length: x.length + 1 }, () => new Array(y.length + 1).fill(0));
  for (let i = 1; i <= x.length; i++) for (let j = 1; j <= y.length; j++) dp[i][j] = x[i - 1] === y[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return (2 * dp[x.length][y.length]) / (x.length + y.length);
}
const tok = s => s.replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean);
/* مقارنة مرنة: تقبل أي صياغة صحيحة من القائمة، مع خطأ إملائي بسيط */
function matchAny(input, accepted) {
  const a = norm(input); if (!a) return { ok: false };
  for (const x of accepted) if (norm(x) === a) return { ok: true, exact: true, hit: x };
  for (const x of accepted) { const b = norm(x); const tol = b.length > 24 ? 3 : b.length > 10 ? 2 : b.length >= 4 ? 1 : 0; if (lev(a, b) <= tol) return { ok: true, exact: false, hit: x }; }
  return { ok: false };
}
const fmtDate = ms => { const d = new Date(ms); return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`; };
const hashPin = pin => { let h = 2166136261; for (const c of 'lisan:' + pin) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); };

/* ---------------- المنهج ---------------- */
const C = window.LISAN_COURSES.en;
const LESSONS = [];
C.units.forEach((u, ui) => u.lessons.forEach((l, li) => { l.id = `u${ui + 1}l${li + 1}`; l.ui = ui; l.li = li; l.gi = LESSONS.length; LESSONS.push(l); }));
const UNIT_START = C.units.map((u, ui) => LESSONS.findIndex(l => l.ui === ui));
const UNIT_LESSONS = C.units.map((u, ui) => LESSONS.filter(l => l.ui === ui));
const NU = C.units.length;
const ALLV = LESSONS.flatMap(l => l.vocab.map(v => ({ en: v[0], ar: v[1], lid: l.id, ui: l.ui })));
const VMAP = {}; ALLV.forEach(v => { if (!VMAP[v.en]) VMAP[v.en] = v; });
const SMAP = {}, BMAP = {}; // للمراجعة: الجمل والفراغات التي أخطأ فيها المتعلم
LESSONS.forEach(l => { l.sentences.forEach(s => { SMAP[s[0]] = { s, L: l }; }); l.blanks.forEach(b => { BMAP[b[0]] = { b, L: l }; }); });

/* القاموس المدمج للترجمة الفورية: مفردات الدروس + أزواج النطق + gloss-en.js */
const GL = {};
ALLV.forEach(v => { const k = v.en.toLowerCase(); if (!GL[k]) GL[k] = { ar: v.ar }; });
LESSONS.forEach(l => (l.pairs || []).forEach(pr => [[pr[0], pr[2]], [pr[1], pr[3]]].forEach(([w, a]) => { const k = w.toLowerCase(); if (!GL[k] && a) GL[k] = { ar: a }; })));
(() => { const G2 = (window.LISAN_GLOSS || {}).en || {}; for (const k in G2) { const v = G2[k]; const cur = GL[k]; const e = Array.isArray(v) ? { ar: v[0], note: v[1] } : { ar: v }; GL[k] = cur ? Object.assign({}, cur, { note: cur.note || e.note }) : e; } })();
function lookup(w) {
  w = String(w).toLowerCase().trim().replace(/'s$/, '');
  if (GL[w]) return Object.assign({ w }, GL[w]);
  const c = [w.replace(/ies$/, 'y'), w.replace(/es$/, ''), w.replace(/s$/, ''), w.replace(/ied$/, 'y'), w.replace(/ed$/, ''), w.replace(/ed$/, 'e'), w.replace(/(.)\1ed$/, '$1'), w.replace(/ing$/, ''), w.replace(/ing$/, 'e'), w.replace(/(.)\1ing$/, '$1'), w.replace(/er$/, ''), w.replace(/est$/, '')];
  for (const x of c) if (x !== w && GL[x]) return Object.assign({ w: x }, GL[x]);
  return null;
}
function exampleFor(w) { const re = new RegExp('\\b' + w.replace(/[^a-z']/gi, '') + '\\b', 'i'); for (const L of LESSONS) for (const s of L.sentences) if (re.test(s[0])) return s; return null; }
const ALLWORDS = [...new Set(LESSONS.flatMap(l => l.sentences.flatMap(s => tok(s[0]))))];
const TAGS = { s: 'الفاعل', v: 'الفعل', x: 'فعل مساعد / أداة', o: 'التكملة / المفعول', t: 'زمان / تكرار / شرط', q: 'أداة سؤال', p: 'حرف جر / مكان' };

/* ---------------- التخزين ---------------- */
const KEY = 'lisan.v1';
const Store = window.LisanStore, FS = window.FSRS;
let DB = loadDB();
function loadDB() { try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && Array.isArray(d.profiles)) return d; } catch (e) { } return { v: 2, profiles: [], current: null, family: null }; }
function save() { DB.updated = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { } Store.saveState(DB); cloudQueue(); }
/* سجل الأحداث: كل نشاط تعليمي يُسجَّل بمعرّف فريد (أساس التقارير والمزامنة) */
function logEv(type, data) { const p = P(); Store.addEvent(Object.assign({ type, lid: p ? p.id : null, t: Date.now(), day: today() }, data || {})); }

/* ---------- المزامنة عبر الحساب (عند الفتح من رابط claude.ai) ----------
   كل مستخدم مسجّل يحصل على نسخة خاصة به (data/users/<id>) لا يراها غيره.
   تُرفع التغييرات تلقائياً وتُسحب على أي جهاز آخر يفتح الرابط بالحساب نفسه. */
const DEVICE = (() => { try { let d = localStorage.getItem('lisan.device'); if (!d) { d = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); localStorage.setItem('lisan.device', d); } return d; } catch (e) { return 'd0'; } })();
const CLOUD = { ref: null, on: false, timer: null, writing: false, again: false, pending: null };
let SCREEN = 'boot';
const packDB = () => { const { current, ...rest } = DB; return JSON.stringify(rest); };
const saveLocal = () => { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { } };
function cloudQueue() { if (!CLOUD.on) return; clearTimeout(CLOUD.timer); CLOUD.timer = setTimeout(cloudPush, 1500); }
async function cloudPush() {
  if (!CLOUD.on) return; if (CLOUD.writing) { CLOUD.again = true; return; }
  CLOUD.writing = true;
  try { await CLOUD.ref.set({ json: packDB(), updated: DB.updated || Date.now(), device: DEVICE }); } catch (e) { }
  CLOUD.writing = false; if (CLOUD.again) { CLOUD.again = false; cloudPush(); }
}
function cloudApply(d) {
  try { const remote = JSON.parse(d.json); if (!remote || !Array.isArray(remote.profiles)) return;
    const cur = DB.current; DB = remote; fixDB(); DB.updated = d.updated;
    DB.current = DB.profiles.some(p => p.id === cur) ? cur : null; saveLocal();
  } catch (e) { }
}
function cloudIncoming(d) {
  if (!d || !d.json || !(d.updated > (DB.updated || 0))) return;
  if (SCREEN === 'home' || SCREEN === 'profiles') { const sc = SCREEN; cloudApply(d); go(sc); toast('☁️ تم تحديث تقدّمك من جهاز آخر'); }
  else CLOUD.pending = d;
}
async function cloudInit() {
  if (!IN_CLAUDE) return;
  try {
    const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    if (!db || !user) return; const id = await user.id(); if (!id) return;
    CLOUD.ref = db.doc('data/users/' + id + '/lisan');
    const snap = await CLOUD.ref.get(); const d = snap.exists ? snap.data() : null;
    CLOUD.on = true;
    if (d && d.json && (d.updated || 0) > (DB.updated || 0)) { cloudApply(d); }
    else if (DB.profiles.length && (!d || (DB.updated || 0) > (d.updated || 0))) cloudPush();
    CLOUD.ref.onSnapshot(s2 => { const x = s2.exists ? s2.data() : null; if (x && x.device !== DEVICE) cloudIncoming(x); }, () => { });
    if (SCREEN === 'home' || SCREEN === 'profiles') go(SCREEN);
  } catch (e) { CLOUD.on = false; }
}
const syncLine = () => CLOUD.on ? '☁️ متزامن مع حسابك: افتح الرابط نفسه من أي جهاز' : 'كل البيانات محفوظة على هذا الجهاز فقط · بلا حسابات وبلا اشتراكات';
function P() { return DB.profiles.find(p => p.id === DB.current) || null; }
function newProfile(name, avatar, goal) {
  return { id: 'p' + Date.now().toString(36) + rnd(1e4), name, avatar, goal, lang: 'en', xp: 0, streak: 0, lastDay: null, xpLog: {},
    pin: null, placement: null, startUnit: 0, passed: {}, tests: [], done: {}, convos: {}, srs: {}, badges: [],
    stats: { lessons: 0, perfect: 0, reviews: 0, talks: 0, tests: 0 }, settings: { rate: 0.9, mic: true, sfx: true, theme: 'auto', timer: true }, created: Date.now() };
}
function fixProfile(p) { // ترقية آمنة لملفات الإصدار السابق دون فقدان أي تقدّم
  const base = newProfile(p.name || 'متعلّم', p.avatar || '🦊', p.goal || 30);
  for (const k in base) if (p[k] === undefined) p[k] = base[k];
  for (const k in base.settings) if (p.settings[k] === undefined) p.settings[k] = base.settings[k];
  for (const k in base.stats) if (p.stats[k] === undefined) p.stats[k] = base.stats[k];
  if (p.startIndex !== undefined) { // نظام الفتح في الإصدار 1 (كل وحدة 4 دروس) ← نظام الوحدات
    const si = p.startIndex; p.startUnit = Math.max(p.startUnit || 0, Math.min(NU, Math.floor(si / 4))); delete p.startIndex;
    const NEW_V2 = ['u1l5']; // دروس أضيفت في الإصدار 2 لا تُحسب ضد المتعلم القديم
    const maxU = Math.max(-1, ...Object.keys(p.done).map(id => { const L = LESSONS.find(l => l.id === id); return L ? L.ui : -1; }));
    UNIT_LESSONS.forEach((ls, ui) => {
      const oldDone = ls.filter(l => !NEW_V2.includes(l.id)).every(l => p.done[l.id]);
      if ((oldDone || ui < maxU) && !p.passed[ui]) p.passed[ui] = { score: null, day: today(), legacy: 1 };
    });
  }
  for (const k in p.srs) { const c = p.srs[k]; if (c && c.box !== undefined && c.s === undefined) p.srs[k] = FS.fromBox(c.box, c.due); } // صناديق ← FSRS
  delete p.hearts; delete p.heartsTs; delete p.settings.unlimited;
  return p;
}
function fixDB() { DB.profiles.forEach(fixProfile); if (DB.family && !DB.family.pin) delete DB.family; DB.v = 3; }
fixDB();

/* ---------------- منطق التقدّم ---------------- */
function streakNow(p) { if (!p.lastDay) return 0; const t = today(); return (p.lastDay === t || p.lastDay === addDays(t, -1)) ? p.streak : 0; }
function todayXP(p) { return p.xpLog[today()] || 0; }
function addXP(p, n) {
  p.xp += n; const t = today(); p.xpLog[t] = (p.xpLog[t] || 0) + n;
  if (p.lastDay !== t) { p.streak = p.lastDay === addDays(t, -1) ? p.streak + 1 : 1; p.lastDay = t; }
}
/* فتح الوحدات: الوحدة التالية تُفتح باجتياز اختبار نهاية الوحدة السابقة */
const unitOpen = (p, u) => u === 0 || u <= p.startUnit || !!p.passed[u - 1];
const unitSkipped = (p, u) => u < p.startUnit;
const allLessonsDone = (p, u) => UNIT_LESSONS[u].every(l => p.done[l.id]);
function lessonOpen(p, L) { if (!unitOpen(p, L.ui)) return false; if (L.li === 0 || unitSkipped(p, L.ui)) return true; return !!p.done[UNIT_LESSONS[L.ui][L.li - 1].id]; }
function testOpen(p, u) { return unitOpen(p, u) && (allLessonsDone(p, u) || unitSkipped(p, u)); }
function currentItem(p) {
  for (let u = 0; u < NU; u++) {
    if (unitSkipped(p, u)) continue;
    for (const L of UNIT_LESSONS[u]) if (!p.done[L.id]) return { lesson: L };
    if (!p.passed[u]) return { test: u };
  }
  return null;
}
function nodeState(p, L, cur) { if (p.done[L.id]) return 'done'; if (unitSkipped(p, L.ui)) return 'skip'; if (cur && cur.lesson === L) return 'cur'; return lessonOpen(p, L) ? 'open' : 'lock'; }
function testState(p, u, cur) { if (p.passed[u]) return 'done'; if (cur && cur.test === u) return 'cur'; return testOpen(p, u) ? 'open' : 'lock'; }
function levelLabel(p) { const c = currentItem(p); if (!c) return p.placement ? p.placement.level : C.units[NU - 1].lvl; const u = c.lesson ? c.lesson.ui : c.test; return C.units[u].lvl; }

/* المراجعة المتباعدة — FSRS
   المفاتيح: كلمة («book»)، جملة («S:…»)، فراغ قواعد («B:…»)، زوج نطق («P:…») */
function srsAdd(p, key) { if (!p.srs[key]) p.srs[key] = FS.create(3, today()); }
function srsHit(p, key, ok, mode, hard) {
  const c = p.srs[key];
  if (!ok) { p.srs[key] = c ? FS.review(c, 1, today()) : FS.create(1, today()); return; } // الخطأ يعود قريباً
  if (!c) return;
  if (mode === 'review' || c.due <= today()) p.srs[key] = FS.review(c, hard ? 2 : 3, today());
}
const dueKeys = p => { const t = today(); return Object.keys(p.srs).filter(k => p.srs[k].due <= t); };
const isWordKey = k => !/^[SBP]:/.test(k);

/* الشارات */
const BADGES = [
  { id: 'first', i: '🌱', t: 'الخطوة الأولى', d: 'أكمل أول درس', c: p => p.stats.lessons >= 1 },
  { id: 'place', i: '🎯', t: 'عرفت مستواك', d: 'أنهِ اختبار المستوى', c: p => !!p.placement },
  { id: 's3', i: '🔥', t: 'ثلاثة أيام', d: 'سلسلة 3 أيام', c: p => p.streak >= 3 },
  { id: 's7', i: '⚡', t: 'أسبوع كامل', d: 'سلسلة 7 أيام', c: p => p.streak >= 7 },
  { id: 's30', i: '🏆', t: 'شهر التزام', d: 'سلسلة 30 يوماً', c: p => p.streak >= 30 },
  { id: 'x100', i: '⭐', t: '100 نقطة', d: 'اجمع 100 XP', c: p => p.xp >= 100 },
  { id: 'x500', i: '🌟', t: '500 نقطة', d: 'اجمع 500 XP', c: p => p.xp >= 500 },
  { id: 'x2000', i: '💎', t: '2000 نقطة', d: 'اجمع 2000 XP', c: p => p.xp >= 2000 },
  { id: 'perfect', i: '🎖️', t: 'بلا أخطاء', d: 'درس بدقة 100%', c: p => p.stats.perfect >= 1 },
  { id: 'unit', i: '📘', t: 'أنهيت وحدة', d: 'اجتز اختبار وحدة', c: p => Object.keys(p.passed).length >= 1 },
  { id: 'ace', i: '🏅', t: 'اختبار كامل', d: 'اختبار وحدة 100%', c: p => (p.tests || []).some(t => t.score === 100) },
  { id: 'talk', i: '💬', t: 'أول محادثة', d: 'أكمل محادثة', c: p => p.stats.talks >= 1 },
  { id: 'talkall', i: '🎙️', t: 'متحدث واثق', d: 'كل المحادثات', c: p => C.convos.every(c => p.convos[c.id]) },
  { id: 'rev5', i: '🧠', t: 'ذاكرة قوية', d: '5 جلسات مراجعة', c: p => p.stats.reviews >= 5 },
  { id: 'w50', i: '📚', t: '50 كلمة', d: 'تعلّم 50 كلمة', c: p => Object.keys(p.srs).filter(isWordKey).length >= 50 },
  { id: 'all', i: '👑', t: 'أنهيت المنهج', d: 'كل الدروس', c: p => LESSONS.every(l => p.done[l.id]) }
];
function checkBadges(p) { const nw = BADGES.filter(b => !p.badges.includes(b.id) && b.c(p)); nw.forEach(b => p.badges.push(b.id)); return nw; }

/* ---------------- الصوت ---------------- */
const synth = window.speechSynthesis || null;
let voice = null;
function pickVoice() {
  if (!synth) return; const vs = synth.getVoices(); if (!vs.length) return;
  const enUS = vs.filter(v => /^en[-_]US/i.test(v.lang));
  voice = enUS.find(v => /Google|Samantha|Natural|Aria|Jenny|Ava|Allison/i.test(v.name)) || enUS[0] || vs.find(v => /^en/i.test(v.lang)) || null;
}
if (synth) { pickVoice(); if (synth.addEventListener) synth.addEventListener('voiceschanged', pickVoice); else synth.onvoiceschanged = pickVoice; }
/* إصلاح الصوت:
   1) لا نوقف الصوت السابق إلا إذا كان يعمل فعلاً، لأن الإيقاف ثم التشغيل الفوري يُسكت الصوت في كروم وسامسونج.
   2) نستأنف المحرك إن كان متوقفاً (خلل معروف في كروم).
   3) نفتح محرك الصوت في الآيفون بأول لمسة للمستخدم.
   4) إن لم يبدأ الصوت خلال ثانيتين ونصف، نعرض للمستخدم سبب المشكلة وحلها. */
let ttsUnlocked = false, ttsWarned = false, ttsOK = null;
function unlockTTS() { if (ttsUnlocked || !synth) return; ttsUnlocked = true; try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; u.lang = C.voice; synth.speak(u); } catch (e) { } }
document.addEventListener('pointerdown', unlockTTS, true);
function ttsTrouble(why) {
  ttsOK = false; if (ttsWarned) return; ttsWarned = true;
  toast(why === 'unsupported' ? '🔇 هذا المتصفح لا يدعم القراءة الصوتية' : '🔇 لا يصدر صوت؟ افتح «ملفي» ثم «اختبار الصوت» لمعرفة الحل');
}
function say(text, slow, onFail) {
  if (!text) return;
  if (!synth || !window.SpeechSynthesisUtterance) { ttsTrouble('unsupported'); onFail && onFail('unsupported'); return; }
  try {
    if (!voice) pickVoice();
    if (synth.speaking || synth.pending) synth.cancel();
    if (synth.paused) synth.resume();
    const u = new SpeechSynthesisUtterance(text); u.lang = C.voice; if (voice) u.voice = voice;
    const p = P(); u.rate = slow ? 0.55 : (p ? p.settings.rate : 0.9); u.volume = 1;
    let started = false;
    u.onstart = () => { started = true; ttsOK = true; };
    u.onerror = e => { if (e.error !== 'interrupted' && e.error !== 'canceled') { ttsTrouble(e.error); onFail && onFail(e.error); } };
    synth.speak(u);
    setTimeout(() => { if (!started && !synth.speaking && ttsOK !== true) { ttsTrouble('silent'); onFail && onFail('silent'); } }, 2500);
  } catch (e) { ttsTrouble('error'); onFail && onFail('error'); }
}
/* شاشة اختبار الصوت مع الحلول حسب الجهاز */
function soundCheck() {
  const vs = synth ? synth.getVoices() : []; const enVoices = vs.filter(v => /^en/i.test(v.lang));
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(navigator.userAgent);
  sheet(`<h3>🔊 اختبار الصوت</h3><p class="muted">اضغط الزر، ويجب أن تسمع جملة إنجليزية.</p>
    <button class="btn acc" data-test>▶️ تشغيل جملة تجريبية</button><div class="snd-res" style="min-height:26px;margin:10px 0;font-weight:700"></div>
    <div class="card" style="text-align:start"><b>إذا لم تسمع شيئاً:</b>
      ${isIOS ? `<p style="margin:6px 0 0">1. <b>زر الصامت</b> على جانب الآيفون: حرّكه حتى يختفي اللون البرتقالي. الآيفون يكتم صوت القارئ في الوضع الصامت.</p><p style="margin:6px 0 0">2. ارفع الصوت من الأزرار الجانبية أثناء التشغيل.</p><p style="margin:6px 0 0">3. أغلق سفاري تماماً ثم افتحه من جديد.</p>`
      : isAndroid ? `<p style="margin:6px 0 0">1. ارفع <b>صوت الوسائط</b> (وليس صوت الرنين) من الأزرار الجانبية.</p><p style="margin:6px 0 0">2. افتح <b>الإعدادات</b>، ثم <b>الإدارة العامة</b>، ثم <b>تحويل النص إلى كلام</b>. اختر محرك جوجل، وتأكد من تنزيل اللغة الإنجليزية.</p><p style="margin:6px 0 0">3. استخدم متصفح كروم.</p>`
      : `<p style="margin:6px 0 0">1. تأكد أن صوت الجهاز غير مكتوم.</p><p style="margin:6px 0 0">2. استخدم متصفح كروم أو إيدج أو سفاري.</p>`}
      <p class="muted" style="margin:10px 0 0;font-size:13px">أصوات إنجليزية متوفرة على جهازك: <b class="en">${enVoices.length}</b>${voice ? ` · المستخدم: <span class="en">${esc(voice.name)}</span>` : ''}</p></div>`, s => {
    const res = $('.snd-res', s);
    $('[data-test]', s).onclick = () => {
      res.textContent = '⏳ جارٍ التشغيل…'; res.style.color = 'var(--muted)'; ttsOK = null;
      say('Hello! If you can hear me, the sound is working.', false, () => { res.textContent = '❌ لم يبدأ الصوت. جرّب الحلول أدناه.'; res.style.color = 'var(--bad)'; });
      setTimeout(() => { if (ttsOK) { res.textContent = '✅ الصوت يعمل'; res.style.color = 'var(--pri)'; } }, 1500);
    };
  });
}
const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
function micOK() { const p = P(); return !!SR && !IN_CLAUDE && (!p || p.settings.mic); }
function listen(cb) {
  if (!SR) return cb(null, 'unsupported');
  let done = false; const r = new SR(); r.lang = C.voice; r.interimResults = false; r.maxAlternatives = 4;
  r.onresult = e => { done = true; cb(Array.from(e.results[0]).map(a => a.transcript)); };
  r.onerror = e => { if (!done) { done = true; cb(null, e.error); } };
  r.onend = () => { if (!done) { done = true; cb(null, 'no-speech'); } };
  try { synth && synth.cancel(); r.start(); } catch (e) { done = true; cb(null, 'start'); }
  return r;
}
let AC = null;
function tone(seq) {
  const p = P(); if (p && !p.settings.sfx) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)(); let t = AC.currentTime;
    seq.forEach(([f, d]) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + 0.03); t += d * 0.75; });
  } catch (e) { }
}
const SFX = { ok: () => tone([[660, .12], [990, .2]]), bad: () => tone([[196, .28]]), win: () => tone([[523, .12], [659, .12], [784, .12], [1046, .35]]), pair: () => tone([[880, .08]]) };

/* ---------------- مكونات واجهة ---------------- */
function toast(msg) { const t = $('#toast'); t.innerHTML = msg; t.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('on'), 2600); }
function sheet(html, bind) {
  const w = document.createElement('div'); w.className = 'sheet-wrap'; w.innerHTML = `<div class="sheet" role="dialog">${html}</div>`;
  const close = () => { w.classList.remove('on'); setTimeout(() => w.remove(), 200); };
  w.addEventListener('click', e => { if (e.target === w) close(); });
  document.body.appendChild(w); requestAnimationFrame(() => w.classList.add('on'));
  bind && bind($('.sheet', w), close); return close;
}
function confirmBox(msg, yes, yesTxt = 'نعم') {
  sheet(`<p class="cf">${msg}</p><button class="btn bad" data-y>${yesTxt}</button><button class="btn ghost" data-n>إلغاء</button>`, (s, close) => {
    $('[data-y]', s).onclick = () => { close(); yes(); }; $('[data-n]', s).onclick = close; });
}
function bindSay(root) { $$('[data-say]', root).forEach(b => b.onclick = e => { e.stopPropagation(); say(b.dataset.say, b.dataset.slow === '1'); }); }
const spkBtn = (t, cls = '') => `<button class="spk ${cls}" data-say="${esc(t)}" aria-label="استمع">🔊</button>`;
function applyTheme() { const p = P(); const th = p ? p.settings.theme : 'auto'; if (th === 'auto') { if (VIEWER_THEME) document.documentElement.dataset.theme = VIEWER_THEME; else delete document.documentElement.dataset.theme; } else document.documentElement.dataset.theme = th; }
let onKey = null;
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') { const c = $('#chk'); if (c && !c.disabled && document.activeElement !== c) { e.preventDefault(); c.click(); } return; }
  if (/^[1-9]$/.test(e.key) && document.activeElement && document.activeElement.tagName !== 'INPUT') {
    const o = $(`.opt[data-i="${+e.key - 1}"]`) || $(`.chip[data-i="${+e.key - 1}"]`); if (o) o.click();
  }
  onKey && onKey(e);
});
function leave() { SCREEN = 'busy'; onKey = null; GLOSS_OFF = false; clearTimeout(TIMER.t); clearInterval(TIMER.i); closeGloss(); try { synth && synth.cancel(); } catch (e) { } window.scrollTo(0, 0); }

/* ---------- الترجمة الفورية: ضغطة مطوّلة (ثانية واحدة) على كلمة إنجليزية من 4 أحرف فأكثر ----------
   تُعطَّل أثناء الاختبارات وتحدي السرعة حتى لا تكشف الإجابة. */
const LONGPRESS_MS = 1000;
let GLOSS_OFF = false, glossEl = null;
function closeGloss() { if (glossEl) { glossEl.remove(); glossEl = null; } }
function showGloss(word, x, y) {
  closeGloss(); const g = lookup(word); const ex = g ? exampleFor(g.w) : null;
  const d = document.createElement('div'); d.className = 'gloss'; d.setAttribute('role', 'dialog');
  d.innerHTML = `<div class="gl-h"><b dir="ltr" class="en">${esc(word)}</b><button class="spk sm" data-say="${esc(word)}" aria-label="استمع">🔊</button><button class="icon-btn gl-x" aria-label="إغلاق">✕</button></div>
    ${g ? `<div class="gl-ar">${esc(g.ar)}</div>${g.note ? `<div class="gl-n">${esc(g.note)}</div>` : ''}${ex ? `<div class="gl-ex"><div dir="ltr" class="en">${esc(ex[0])}</div><div>${esc(ex[1])}</div></div>` : ''}` : '<div class="gl-n">هذه الكلمة غير موجودة في القاموس بعد، لكن يمكنك سماع نطقها.</div>'}`;
  document.body.appendChild(d); glossEl = d; bindSay(d); $('.gl-x', d).onclick = closeGloss;
  const r = d.getBoundingClientRect(); d.style.left = Math.max(10, (innerWidth - r.width) / 2) + 'px'; d.style.top = (y - r.height - 18 > 10 ? y - r.height - 18 : y + 24) + 'px';
  say(word); logEv('gloss', { word: word.toLowerCase(), found: !!g });
}
(function longPress() {
  let t = null, sx = 0, sy = 0, fired = false;
  const wordAt = (x, y, target) => {
    const box = target && target.closest && target.closest('.tile,.chip,.mbtn,.tkw,.opt,.ropt');
    if (box) { const tx = box.textContent.replace(/^\d+/, '').trim(); if (/^[A-Za-z' -]+$/.test(tx) && (tx.includes(' ') ? lookup(tx) : true)) return tx; }
    let node, off;
    if (document.caretRangeFromPoint) { const r = document.caretRangeFromPoint(x, y); if (!r) return null; node = r.startContainer; off = r.startOffset; }
    else if (document.caretPositionFromPoint) { const r = document.caretPositionFromPoint(x, y); if (!r) return null; node = r.offsetNode; off = r.offset; }
    if (!node || node.nodeType !== 3) return null;
    const s = node.textContent; let a = off, b = off;
    while (a > 0 && /[A-Za-z']/.test(s[a - 1])) a--; while (b < s.length && /[A-Za-z']/.test(s[b])) b++;
    return s.slice(a, b).replace(/^'+|'+$/g, '');
  };
  document.addEventListener('pointerdown', e => {
    if (glossEl && !glossEl.contains(e.target)) closeGloss();
    if (GLOSS_OFF || !e.target.closest('#app') || e.target.closest('input,textarea,.pin-pad')) return;
    sx = e.clientX; sy = e.clientY; fired = false; clearTimeout(t); const tg = e.target;
    t = setTimeout(() => { const w = wordAt(sx, sy, tg); if (w && w.replace(/[^A-Za-z]/g, '').length >= 4) { fired = true; showGloss(w, sx, sy); } }, LONGPRESS_MS);
  });
  ['pointerup', 'pointercancel'].forEach(ev => document.addEventListener(ev, () => clearTimeout(t)));
  document.addEventListener('pointermove', e => { if (Math.abs(e.clientX - sx) > 12 || Math.abs(e.clientY - sy) > 12) clearTimeout(t); });
  document.addEventListener('click', e => { if (fired) { e.stopPropagation(); e.preventDefault(); fired = false; } }, true); // الضغط المطوّل لا يختار الإجابة
  document.addEventListener('contextmenu', e => { if (e.target.closest('#app') && !e.target.closest('input,textarea')) e.preventDefault(); });
})();

/* ---------- المؤقت ---------- */
const TIMER = { t: null, i: null };
function startTimer(secs, onEnd) {
  const bar = $('.tbar i'); if (!bar) return; const t0 = Date.now(); clearTimeout(TIMER.t); clearInterval(TIMER.i);
  bar.parentElement.hidden = false; bar.style.width = '100%';
  TIMER.i = setInterval(() => { const left = Math.max(0, 1 - (Date.now() - t0) / (secs * 1000)); bar.style.width = (left * 100) + '%'; bar.parentElement.classList.toggle('late', left < 0.3); const s = $('.tbar b'); if (s) s.textContent = Math.ceil(left * secs); }, 100);
  TIMER.t = setTimeout(() => { clearInterval(TIMER.i); onEnd(); }, secs * 1000);
  return () => { clearTimeout(TIMER.t); clearInterval(TIMER.i); return Math.max(0, secs - (Date.now() - t0) / 1000); };
}

/* ---------------- توليد التمارين ---------------- */
const okey = s => /[a-z]/i.test(s) ? norm(s) : String(s).trim();
function distract(correct, pool, n) { const c = okey(correct); const seen = new Set([c]); const out = [];
  for (const x of shuffle(pool)) { const k = okey(x); if (!seen.has(k)) { seen.add(k); out.push(x); if (out.length >= n) break; } } return out; }
function unitVocab(L) { return ALLV.filter(v => v.ui === L.ui).map(v => [v.en, v.ar]); }
function exMcArEn(v, L) {
  const pool = L ? L.vocab.map(x => x[0]).concat(unitVocab(L).map(x => x[0])) : ALLV.map(x => x.en);
  return { type: 'mc', key: v[0], q: 'اختر الترجمة الصحيحة', big: v[1], options: shuffle([v[0], ...distract(v[0], pool, 2)]), answer: v[0], optEn: true };
}
function exMcEnAr(v, L) {
  const pool = L ? L.vocab.map(x => x[1]).concat(unitVocab(L).map(x => x[1])) : ALLV.map(x => x.ar);
  return { type: 'mc', key: v[0], q: 'ما معنى هذه الكلمة؟', bigEn: v[0], options: shuffle([v[1], ...distract(v[1], pool, 2)]), answer: v[1] };
}
function exListenWord(v) {
  return { type: 'mc', key: v[0], q: 'استمع واختر ما سمعته', audio: v[0], options: shuffle([v[0], ...distract(v[0], ALLV.map(x => x.en), 3)]), answer: v[0], optEn: true, note: esc(v[1]) };
}
function exFill(b) {
  const m = b[0].match(/^(.*)\{(.+?)\}(.*)$/);
  return { type: 'fill', key: 'B:' + b[0], pre: m[1], post: m[3], options: shuffle(b[1]), answer: m[2], ar: b[2], why: b[3] || '', full: b[0].replace(/[{}]/g, ''), sayAfter: b[0].replace(/[{}]/g, '') };
}
const accepted = s => [s[0]].concat(Array.isArray(s[2]) ? s[2] : []);
function extraWords(words, n) { const low = words.map(w => w.toLowerCase()); return shuffle(ALLWORDS.filter(w => !low.includes(w.toLowerCase()) && w.length < 9)).slice(0, n); }
function exOrder(s) { const w = tok(s[0]); return { type: 'order', key: 'S:' + s[0], en: s[0], ar: s[1], alts: accepted(s), tiles: shuffle(w.concat(extraWords(w, 2))), answer: w.join(' '), sayAfter: s[0] }; }
function exListen(s) { const w = tok(s[0]); return { type: 'order', key: 'S:' + s[0], listen: true, en: s[0], ar: s[1], alts: [s[0]], tiles: shuffle(w.concat(extraWords(w, 1))), answer: w.join(' ') }; }
function exTrans(s, L) {
  const pool = L.sentences.map(x => x[1]).concat(UNIT_LESSONS[L.ui].flatMap(l => l.sentences.map(x => x[1])));
  return { type: 'mc', q: 'ما ترجمة هذه الجملة؟', bigEn: s[0], options: shuffle([s[1], ...distract(s[1], pool, 2)]), answer: s[1] };
}
function exWrite(v) { return { type: 'write', key: v[0], ar: v[1], answer: v[0], sayAfter: v[0] }; }
function exDict(s) { return { type: 'dict', key: 'S:' + s[0], en: s[0], ar: s[1], sayAfter: s[0] }; }               // استمع واكتب
function exTType(s) { return { type: 'ttype', key: 'S:' + s[0], en: s[0], ar: s[1], alts: accepted(s), sayAfter: s[0] }; } // ترجمة مكتوبة حرّة
function exSpeak(s) { return { type: 'speak', en: s[0], ar: s[1] }; }
function exPair(pr) { // أزواج النطق المتقاربة: استمع وميّز
  const target = pick([pr[0], pr[1]]);
  return { type: 'mc', key: 'P:' + pr[0] + '|' + pr[1], q: 'استمع جيداً: أي كلمة سمعت؟', audio: target, options: shuffle([pr[0], pr[1]]), answer: target, optEn: true, note: `${en(pr[0])} = ${esc(pr[2] || '')} · ${en(pr[1])} = ${esc(pr[3] || '')}` };
}

/* درس كامل: 16 إلى 20 تمريناً ≈ من 6 إلى 10 دقائق */
function genLesson(L) {
  const V = shuffle(L.vocab), S = shuffle(L.sentences), B = shuffle(L.blanks);
  const typed = S.filter(s => Array.isArray(s[2]));
  const rest = [
    exMcArEn(V[0], L), exMcArEn(V[1], L), exMcEnAr(V[2], L),
    ...B.map(exFill),
    exOrder(S[0]), exOrder(S[1]), exTrans(S[2], L), exListen(S[3]), exDict(S[4] || S[0]), exWrite(V[3])
  ];
  if (typed.length) rest.push(exTType(typed.find(s => s !== S[0] && s !== S[1]) || typed[0]));
  if (L.pairs) shuffle(L.pairs).slice(0, 4).forEach(pr => rest.push(exPair(pr)));
  shuffle(rest.filter(e => TIMED_TYPES.includes(e.type) && !e.audio)).slice(0, 2).forEach(e => { e.timed = 15; });
  const out = [{ type: 'match', pairs: V.slice(0, 5) }, ...shuffle(rest)];
  out.splice(out.length - 2, 0, exSpeak(L.speak ? pick(L.speak) : (S[5] || S[2])));
  return out;
}
/* اختبار نهاية الوحدة: أسئلة من كل دروسها، بلا شرح وبلا إعادة */
function genUnitTest(u, p) {
  const last = new Set(((p && p.lastTest) || {})[u] || []); const ls = UNIT_LESSONS[u]; const per = Math.ceil(18 / ls.length);
  let out = [];
  ls.forEach(L => {
    const cands = [
      ...L.blanks.map(b => ({ k: 'B:' + b[0], f: () => exFill(b) })),
      ...L.vocab.map(v => ({ k: 'V:' + v[0], f: () => pick([exMcArEn, exMcEnAr])(v, L) })),
      ...L.sentences.map(s => ({ k: 'S:' + s[0], f: () => pick(Array.isArray(s[2]) && s[2].length ? [exOrder, exDict, exTType] : [exOrder, exDict])(s) })),
      ...(L.pairs || []).map(pr => ({ k: 'P:' + pr[0], f: () => exPair(pr) }))
    ];
    const fresh = shuffle(cands.filter(c => !last.has(c.k))), old = shuffle(cands.filter(c => last.has(c.k)));
    fresh.concat(old).slice(0, per).forEach(c => { const e = c.f(); e.tkey = c.k; out.push(e); });
  });
  out = shuffle(out).slice(0, 18);
  if (p) { p.lastTest = p.lastTest || {}; p.lastTest[u] = out.map(e => e.tkey); }
  return out;
}

/* ---------------- مُشغّلات التمارين ---------------- */
const R = {};
R.mc = (ex, el, ready) => {
  let sel = -1;
  const top = ex.audio ? `<div class="audio-row">${spkBtn(ex.audio, 'xl')}<button class="spk slow" data-say="${esc(ex.audio)}" data-slow="1" aria-label="ببطء">🐢</button></div>`
    : ex.bigEn ? `<div class="big">${spkBtn(ex.bigEn)}${en(ex.bigEn)}</div>` : `<div class="big ar">${esc(ex.big)}</div>`;
  el.innerHTML = `<h2 class="q">${ex.q}</h2>${top}<div class="opts">${ex.options.map((o, i) => `<button class="opt" data-i="${i}"><span class="k">${i + 1}</span>${ex.optEn ? en(o) : esc(o)}</button>`).join('')}</div>`;
  bindSay(el);
  $$('.opt', el).forEach(b => b.onclick = () => { sel = +b.dataset.i; $$('.opt', el).forEach(x => x.classList.toggle('sel', x === b)); if (ex.optEn && !ex.audio) say(ex.options[sel]); ready(true); });
  setTimeout(() => say(ex.audio || ex.bigEn), 280);
  return { check() {
    const ok = ex.options[sel] === ex.answer; el.classList.add('locked');
    $$('.opt', el).forEach((b, i) => { if (ex.options[i] === ex.answer) b.classList.add('right'); else if (i === sel) b.classList.add('wrong'); b.classList.remove('sel'); });
    if (ex.optEn) ex.sayAfter = ex.answer;
    return { ok, correct: ex.optEn ? en(ex.answer) : esc(ex.answer), note: ex.note || '', given: sel < 0 ? '' : ex.options[sel] };
  } };
};
R.fill = (ex, el, ready) => {
  let sel = -1;
  el.innerHTML = `<h2 class="q">أكمل الفراغ</h2><div class="fill-s" dir="ltr">${esc(ex.pre)}<span class="slot">&nbsp;</span>${esc(ex.post)}</div><div class="fill-ar">${esc(ex.ar)}</div><div class="chips" dir="ltr">${ex.options.map((o, i) => `<button class="chip" data-i="${i}">${esc(o)}</button>`).join('')}</div>`;
  $$('.chip', el).forEach(b => b.onclick = () => { sel = +b.dataset.i; $$('.chip', el).forEach(x => x.classList.toggle('sel', x === b)); $('.slot', el).textContent = ex.options[sel]; ready(true); });
  return { check() { el.classList.add('locked'); const ok = ex.options[sel] === ex.answer; return { ok, correct: en(ex.full), note: ex.why ? '💡 ' + esc(ex.why) : '', given: sel < 0 ? '' : ex.pre + ex.options[sel] + ex.post }; } };
};
R.order = (ex, el, ready) => {
  const chosen = [];
  const head = ex.listen
    ? `<h2 class="q">استمع ورتّب ما تسمعه</h2><div class="audio-row">${spkBtn(ex.en, 'xl')}<button class="spk slow" data-say="${esc(ex.en)}" data-slow="1" aria-label="ببطء">🐢</button></div>`
    : `<h2 class="q">ترجم إلى الإنجليزية</h2><div class="big ar">${esc(ex.ar)}</div>`;
  el.innerHTML = `${head}<div class="ans"></div><div class="bank">${ex.tiles.map((t, i) => `<button class="tile" data-i="${i}">${esc(t)}</button>`).join('')}</div>`;
  bindSay(el);
  const ans = $('.ans', el);
  function draw() {
    ans.innerHTML = chosen.map(i => `<button class="tile" data-i="${i}">${esc(ex.tiles[i])}</button>`).join('');
    $$('.bank .tile', el).forEach(b => b.classList.toggle('used', chosen.includes(+b.dataset.i)));
    $$('.tile', ans).forEach(b => b.onclick = () => { chosen.splice(chosen.indexOf(+b.dataset.i), 1); draw(); });
    ready(chosen.length > 0);
  }
  $$('.bank .tile', el).forEach(b => b.onclick = () => { const i = +b.dataset.i; if (chosen.includes(i)) return; chosen.push(i); if (!ex.listen) say(ex.tiles[i]); draw(); });
  if (ex.listen) setTimeout(() => say(ex.en), 300);
  draw();
  return { check() {
    el.classList.add('locked'); const got = norm(chosen.map(i => ex.tiles[i]).join(' '));
    const ok = (ex.alts || [ex.answer]).concat(ex.answer).some(x => norm(x) === got);
    return { ok, correct: en(ex.en), note: esc(ex.ar), given: chosen.map(i => ex.tiles[i]).join(' ') };
  } };
};
/* حقل كتابة جملة (يُستخدم في الإملاء والترجمة الحرة وبديل النطق) */
function sentenceInput(el, ready, ph) {
  el.insertAdjacentHTML('beforeend', `<textarea class="write-inp" rows="2" dir="ltr" autocomplete="off" autocapitalize="sentences" autocorrect="off" spellcheck="false" placeholder="${ph || 'type in English…'}" aria-label="الإجابة"></textarea>`);
  const inp = $('textarea', el); inp.oninput = () => ready(inp.value.trim().length > 0);
  inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); const c = $('#chk'); if (c && !c.disabled) c.click(); } };
  setTimeout(() => inp.focus(), 150); return inp;
}
function diffWords(got, target) { // تلوين الكلمات: الصحيحة بالأخضر والناقصة بالأحمر
  const g = norm(got).split(' ');
  return tok(target).map(w => { const n = norm(w); const hit = n.split(' ').every(x => g.some(y => y === x || (x.length > 4 && lev(x, y) <= 1))); return `<span class="${hit ? 'w-ok' : 'w-bad'}">${esc(w)}</span>`; }).join(' ');
}
R.dict = (ex, el, ready) => {
  el.innerHTML = `<h2 class="q">استمع واكتب ما تسمعه</h2><div class="audio-row">${spkBtn(ex.en, 'xl')}<button class="spk slow" data-say="${esc(ex.en)}" data-slow="1" aria-label="ببطء">🐢</button></div>${ex.fallback ? `<div class="gnote" style="margin-bottom:12px">${ex.fallback}</div>` : ''}`;
  bindSay(el); const inp = sentenceInput(el, ready); setTimeout(() => say(ex.en), 300);
  return { check() {
    inp.disabled = true; const m = matchAny(inp.value, [ex.en]);
    return { given: inp.value.trim(), ok: m.ok, correct: en(ex.en), note: m.ok && m.exact ? esc(ex.ar) : `<div dir="ltr" style="text-align:left">${diffWords(inp.value, ex.en)}</div>${esc(ex.ar)}` };
  } };
};
R.ttype = (ex, el, ready) => {
  el.innerHTML = `<h2 class="q">اكتب الترجمة بالإنجليزية</h2><div class="big ar">${esc(ex.ar)}</div>`;
  const inp = sentenceInput(el, ready);
  return { check() {
    inp.disabled = true; const m = matchAny(inp.value, ex.alts);
    const others = ex.alts.filter(x => norm(x) !== norm(m.hit || '')).slice(0, 2);
    let note = m.ok && !m.exact ? `انتبه للإملاء الصحيح: ${en(m.hit)}` : '';
    if (others.length && m.ok) note += `${note ? '<br>' : ''}صياغات صحيحة أخرى: ${others.map(en).join(' · ')}`;
    if (!m.ok) note = `<div dir="ltr" style="text-align:left">${diffWords(inp.value, ex.en)}</div>${others.length ? 'وتُقبل أيضاً: ' + others.map(en).join(' · ') : ''}`;
    return { ok: m.ok, correct: en(m.ok ? m.hit : ex.en), note, given: inp.value.trim() };
  } };
};
R.write = (ex, el, ready) => {
  el.innerHTML = `<h2 class="q">اكتب الكلمة بالإنجليزية</h2><div class="big ar">${esc(ex.ar)}</div><input class="write-inp" dir="ltr" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="type here…" aria-label="الإجابة">`;
  const inp = $('input', el); inp.oninput = () => ready(inp.value.trim().length > 0); setTimeout(() => inp.focus(), 150);
  return { check() {
    inp.disabled = true; const a = norm(inp.value), b = norm(ex.answer);
    const given = inp.value.trim();
    if (a === b) return { ok: true, correct: en(ex.answer), given };
    if (b.length >= 4 && lev(a, b) <= 1) return { ok: true, correct: en(ex.answer), note: `انتبه للإملاء الصحيح: ${en(ex.answer)}`, given };
    return { ok: false, correct: en(ex.answer), given };
  } };
};
/* النطق: تقييم كل كلمة عبر خدمة التعرّف على الصوت في المتصفح (تحتاج إنترنت).
   عند عدم توفر الميكروفون أو الإنترنت أو فشل الالتقاط مرتين ← تحويل تلقائي إلى تمرين كتابة. */
function wordScores(heard, target) {
  const h = norm(heard).split(' ');
  return tok(target).map(w => { const n = norm(w).split(' '); return { w, ok: n.every(x => h.some(y => y === x || (x.length > 4 && lev(x, y) <= 1))) }; });
}
R.speak = (ex, el, ready, api) => {
  const toWriting = why => { ex.fallback = why; el.innerHTML = ''; const r = R.dict(ex, el, ready, api); impl.check = r.check; };
  const impl = { check: null };
  if (!micOK() || !navigator.onLine) { toWriting(!navigator.onLine ? '📴 لا يوجد إنترنت الآن، لذا تحوّل تمرين النطق إلى كتابة.' : '🎤 الميكروفون غير متاح هنا، لذا تحوّل تمرين النطق إلى كتابة.'); return impl; }
  let res = null, heard = '', fails = 0;
  el.innerHTML = `<h2 class="q">انطق هذه الجملة</h2><div class="big">${spkBtn(ex.en)}${en(ex.en)}</div><div class="fill-ar">${esc(ex.ar)}</div>
    <button class="mic" aria-label="تحدّث">🎤</button><div class="heard">اضغط الميكروفون ثم تحدّث بوضوح</div>`;
  bindSay(el);
  const mic = $('.mic', el), hd = $('.heard', el);
  mic.onclick = () => {
    if (mic.classList.contains('rec')) return; mic.classList.add('rec'); hd.textContent = 'أستمع إليك…';
    listen((alts, err) => {
      mic.classList.remove('rec');
      if (!alts) { fails++; if (err === 'not-allowed' || err === 'network' || fails >= 2) return toWriting('🎤 تعذّر التقاط الصوت، لذا تحوّل التمرين إلى كتابة. يمكنك تجربة النطق في الدرس القادم.'); hd.textContent = 'لم أسمع شيئاً واضحاً، حاول مرة أخرى.'; return; }
      let best = null; alts.forEach(a => { const sc = wordScores(a, ex.en); const k = sc.filter(x => x.ok).length; if (!best || k > best.k) best = { k, sc, a }; });
      res = best; heard = best.a;
      hd.innerHTML = `<div dir="ltr" class="word-score">${best.sc.map(x => `<span class="${x.ok ? 'w-ok' : 'w-bad'}">${esc(x.w)}</span>`).join(' ')}</div>`; ready(true);
    });
  };
  api.showSkip('اكتب بدلاً من ذلك', () => { api.hideSkip(); toWriting('✍️ اخترت الكتابة بدلاً من النطق.'); });
  impl.check = () => {
    const pct = Math.round(res.k / res.sc.length * 100); const weak = res.sc.filter(x => !x.ok).map(x => x.w);
    const ok = pct >= 70; logEv('speak', { en: ex.en, pct, weak });
    return { ok, soft: !ok, given: heard, correct: en(ex.en), note: `درجة النطق: <b class="en">${pct}%</b>${weak.length ? ` · كلمات تحتاج تدريباً: ${weak.map(en).join(' ، ')}` : ' · نطق واضح لكل الكلمات 👏'}` };
  };
  return impl;
};
R.match = (ex, el, ready, api) => {
  const left = shuffle(ex.pairs.map((p, i) => ({ i, t: p[1] })));   // العربية (يمين)
  const right = shuffle(ex.pairs.map((p, i) => ({ i, t: p[0] })));  // الإنجليزية
  el.innerHTML = `<h2 class="q">طابِق الأزواج</h2><div class="match"><div class="mcol">${left.map(x => `<button class="mbtn" data-s="a" data-i="${x.i}">${esc(x.t)}</button>`).join('')}</div><div class="mcol">${right.map(x => `<button class="mbtn" data-s="e" data-i="${x.i}">${en(x.t)}</button>`).join('')}</div></div>`;
  let sel = null, got = 0, miss = 0;
  $$('.mbtn', el).forEach(b => b.onclick = () => {
    if (b.classList.contains('ok')) return;
    if (b.dataset.s === 'e') say(ex.pairs[+b.dataset.i][0]);
    if (!sel || sel.dataset.s === b.dataset.s) { $$('.mbtn.sel', el).forEach(x => x.classList.remove('sel')); sel = b; b.classList.add('sel'); return; }
    const a = sel; sel = null; a.classList.remove('sel');
    if (a.dataset.i === b.dataset.i) { a.classList.add('ok'); b.classList.add('ok'); SFX.pair(); got++; if (got === ex.pairs.length) setTimeout(() => api.autoOk(miss === 0), 350); }
    else { miss++; [a, b].forEach(x => { x.classList.add('bad'); setTimeout(() => x.classList.remove('bad'), 450); }); SFX.bad(); }
  });
  return { check() { return null; } };
};

/* ---------------- مشغّل الجلسات ---------------- */
const PRAISE = ['أحسنت! 🎉', 'ممتاز!', 'رائع! 👏', 'إجابة صحيحة!', 'عمل متقن!', 'استمر هكذا! 💪', 'مذهل! ✨'];
const TYPE_NAME = { mc: 'اختيار', fill: 'إكمال فراغ', order: 'ترتيب جملة', write: 'كتابة كلمة', dict: 'استمع واكتب', ttype: 'ترجمة مكتوبة', speak: 'نطق', match: 'مطابقة' };
/* نص السؤال كما يُعرض في شاشة «راجع إجاباتك» */
function promptOf(ex) {
  switch (ex.type) {
    case 'mc': return ex.audio ? `🔊 ${ex.q}` : ex.bigEn ? en(ex.bigEn) : esc(ex.big);
    case 'fill': return `<span dir="ltr" class="en">${esc(ex.pre)}___${esc(ex.post)}</span><br><small>${esc(ex.ar)}</small>`;
    case 'order': return ex.listen ? '🔊 استمع ورتّب' : esc(ex.ar);
    case 'write': return esc(ex.ar);
    case 'dict': return '🔊 استمع واكتب';
    case 'ttype': return esc(ex.ar);
    case 'speak': return en(ex.en);
    default: return '';
  }
}
const showGiven = (ex, g) => !g ? '<i class="muted">لم تُجب</i>' : /[a-z]/i.test(g) ? en(g) : esc(g);
/* الإجابة الصحيحة لسؤال انتهى وقته */
function correctOf(ex) { return ex.type === 'fill' ? en(ex.full) : ex.type === 'mc' ? (ex.optEn ? en(ex.answer) : esc(ex.answer)) : en(ex.en || ex.answer || ''); }
const TIMED_TYPES = ['mc', 'fill'];

function runSession(opt) {
  leave();
  const p = P(); const total = opt.exercises.length; const isTest = opt.mode === 'test' || opt.mode === 'speed';
  const instant = isTest;                                  // الاختبار: الحكم فوراً عند الضغط
  GLOSS_OFF = isTest;                                      // لا ترجمة فورية أثناء الاختبار
  const st = { queue: opt.exercises.slice(), done: 0, firstOk: 0, seen: new Set(), mistakes: 0, t0: Date.now(), cur: null, phase: 'answer', api: null, wrongKeys: [], log: [], bonus: 0, stop: null };
  app.innerHTML = `<div class="ses">
    <div class="ses-top"><button class="icon-btn" data-x aria-label="خروج">✕</button><div class="pbar"><i></i></div>${opt.mode === 'review' ? '<div class="hc" style="color:var(--t-q)">🧠</div>' : opt.mode === 'test' ? '<div class="hc" style="color:var(--gold)">🏁</div>' : opt.mode === 'speed' ? '<div class="hc" style="color:var(--acc)">⚡</div>' : ''}</div>
    <div class="tbar" hidden><i></i><b></b></div>
    <div class="ses-body"></div>
    <div class="ses-foot"><div class="fb"></div><div class="foot-row"><button class="btn ghost" data-skip hidden></button><button class="btn" id="chk" disabled>تحقّق</button></div></div></div>`;
  const body = $('.ses-body'), foot = $('.ses-foot'), fb = $('.fb'), chk = $('#chk'), skip = $('[data-skip]'), tbar = $('.tbar');
  $('[data-x]').onclick = () => confirmBox('هل تريد إنهاء الجلسة؟ لن يُحفظ تقدّمك فيها.', () => { leave(); go('home'); }, 'إنهاء');
  const upd = () => { $('.pbar i').style.width = (st.done / total * 100) + '%'; };
  function next() {
    if (!st.queue.length) return finish();
    st.cur = st.queue.shift(); st.phase = 'answer'; foot.className = 'ses-foot'; fb.innerHTML = ''; chk.textContent = 'تحقّق'; chk.disabled = true; skip.hidden = true;
    body.innerHTML = ''; body.className = 'ses-body'; void body.offsetWidth; window.scrollTo(0, 0); tbar.hidden = true; st.stop = null;
    const api = { autoOk: perfect => resolve({ ok: true, imperfect: !perfect }), showSkip: (t, fn) => { skip.hidden = false; skip.textContent = t; skip.onclick = fn; }, hideSkip: () => { skip.hidden = true; }, skipNeutral: () => { st.done++; upd(); next(); } };
    const ex = st.cur;
    st.api = R[ex.type](ex, body, r => {
      if (st.phase !== 'answer') return; chk.disabled = !r;
      if (r && instant && TIMED_TYPES.includes(ex.type)) setTimeout(() => { if (st.phase === 'answer') chk.click(); }, 120);
    }, api);
    if (ex.type === 'match') { chk.disabled = true; chk.textContent = 'طابِق كل الأزواج'; }
    if (ex.timed && p.settings.timer && TIMED_TYPES.includes(ex.type)) {
      st.stop = startTimer(ex.timed, () => { if (st.phase !== 'answer') return; body.classList.add('locked'); resolve({ ok: false, timeout: true, correct: correctOf(ex), note: '⏰ انتهى الوقت', given: '' }); });
    }
    window.__lisan.cur = ex;
  }
  function resolve(res) {
    const left = st.stop ? st.stop() : 0; st.stop = null;
    st.phase = 'fb'; skip.hidden = true; const ex = st.cur; const first = !st.seen.has(ex); st.seen.add(ex);
    logEv('answer', { mode: opt.mode, ctx: opt.ctx || null, ex: ex.type, key: ex.key || null, ok: !!res.ok, first, given: res.given || null, timeout: !!res.timeout });
    if (ex.type !== 'match') st.log.push({ type: ex.type, q: promptOf(ex), given: showGiven(ex, res.given), correct: res.correct, ok: !!res.ok, soft: !!res.soft, timeout: !!res.timeout, why: ex.why || '' });
    if (res.ok) {
      st.done++; if (first && !res.imperfect) st.firstOk++; SFX.ok(); foot.className = 'ses-foot ok';
      if (opt.mode === 'speed') st.bonus += Math.round(left);
      fb.innerHTML = `<div class="fb-t">${pick(PRAISE)}${opt.mode === 'speed' && left ? ` <small class="en">+${Math.round(left)}</small>` : ''}</div>${res.note ? `<div class="fb-n">${res.note}</div>` : ''}`;
      if (ex.key) srsHit(p, ex.key, true, opt.mode, !first); if (ex.sayAfter && opt.mode !== 'speed') setTimeout(() => say(ex.sayAfter), 150);
    } else if (res.soft) {
      st.done++; foot.className = 'ses-foot bad'; fb.innerHTML = `<div class="fb-t">قريب! تابع التدريب</div><div class="fb-a">${res.correct}</div><div class="fb-n">${res.note}</div>`; SFX.bad();
    } else {
      st.mistakes++; SFX.bad(); foot.className = 'ses-foot bad';
      fb.innerHTML = `<div class="fb-t">${res.timeout ? '⏰ انتهى الوقت · ' : ''}الإجابة الصحيحة:</div><div class="fb-a">${res.correct}</div>${res.note && !res.timeout ? `<div class="fb-n">${res.note}</div>` : ''}`;
      if (isTest) st.done++; else st.queue.push(ex);           // الاختبار لا يعيد السؤال
      if (ex.key) { srsHit(p, ex.key, false, opt.mode); st.wrongKeys.push(ex.key); }
    }
    upd(); save(); chk.disabled = false; chk.textContent = 'متابعة'; chk.focus({ preventScroll: true });
    if (opt.mode === 'speed') setTimeout(() => { if (st.phase === 'fb' && st.cur === ex) next(); }, res.ok ? 700 : 1600);
  }
  chk.onclick = () => {
    if (st.phase === 'answer') { const r = st.api.check(); if (r) resolve(r); }
    else next();
  };
  function finish() {
    const secs = Math.round((Date.now() - st.t0) / 1000);
    saveMistakes(p, st.log, opt.ctx || opt.mode);
    opt.onDone({ acc: Math.round(st.firstOk / total * 100), secs, mistakes: st.mistakes, total, wrongKeys: st.wrongKeys, log: st.log, bonus: st.bonus });
  }
  upd(); next();
}
/* حفظ الأخطاء في سجل المتعلم (آخر 200) ليرجع إليها لاحقاً */
function saveMistakes(p, log, ctx) {
  const wrong = log.filter(x => !x.ok).map(x => ({ t: Date.now(), ctx, type: x.type, q: x.q, given: x.given, correct: x.correct, timeout: x.timeout }));
  if (wrong.length) { p.mistakes = (p.mistakes || []).concat(wrong).slice(-200); save(); }
}
const CTX_NAME = ctx => { if (!ctx) return ''; if (/^test(\d+)/.test(ctx)) return 'اختبار الوحدة ' + (+ctx.slice(4) + 1); if (ctx === 'placement') return 'اختبار المستوى'; if (ctx === 'review') return 'المراجعة'; if (ctx === 'speed') return 'تحدي السرعة'; const L = LESSONS.find(l => l.id === ctx); return L ? L.ta : ''; };

/* ---------------- شاشة «راجع إجاباتك» ---------------- */
function reviewAnswers(log, title, back) {
  leave(); let showAll = false;
  const wrongN = log.filter(x => !x.ok).length;
  function draw() {
    const items = (showAll ? log : log.filter(x => !x.ok));
    app.innerHTML = `<div class="ses"><div class="ses-top"><button class="icon-btn" data-x aria-label="رجوع">→</button><div style="flex:1;font-weight:700">📋 ${title}</div></div>
      <div class="g-wrap">
        <div class="ra-sum"><span class="pill ok">✅ ${log.length - wrongN} صحيحة</span><span class="pill bad">❌ ${wrongN} خاطئة</span>
          <button class="btn ghost sm" data-all>${showAll ? 'الأخطاء فقط' : 'إظهار الكل'}</button></div>
        ${items.length ? items.map((x, i) => `<div class="ra-item ${x.ok ? 'ok' : 'bad'}">
          <div class="ra-h"><span>${x.ok ? '✅' : '❌'} ${TYPE_NAME[x.type] || ''}${x.timeout ? ' · ⏰ انتهى الوقت' : ''}${x.ctx ? ` · <small>${esc(CTX_NAME(x.ctx))}</small>` : ''}</span></div>
          <div class="ra-q">${x.q}</div>
          <div class="ra-row"><small>إجابتك</small><div class="${x.ok ? 'w-ok' : 'w-bad-plain'}">${x.given}</div></div>
          ${x.ok ? '' : `<div class="ra-row"><small>الصحيح</small><div class="w-ok">${x.correct}</div></div>`}
          ${!x.ok && x.why ? `<div class="ra-why">💡 ${esc(x.why)}</div>` : ''}
        </div>`).join('') : `<div class="card" style="text-align:center"><div style="font-size:44px">🌟</div><b>لا أخطاء!</b><p class="muted">كل إجاباتك صحيحة.</p></div>`}
      </div>
      <div class="ses-foot"><button class="btn" data-b>متابعة</button></div></div>`;
    $('[data-x]').onclick = back; $('[data-b]').onclick = back;
    $('[data-all]').onclick = () => { showAll = !showAll; draw(); };
  }
  draw();
}

/* ---------------- شاشة النتيجة ---------------- */
function resultScreen(o) {
  leave(); SFX.win(); const p = P(); const g = Math.min(100, Math.round(todayXP(p) / p.goal * 100));
  const goalHit = o.goalBefore < p.goal && todayXP(p) >= p.goal;
  const log = o.log || []; const wrongN = log.filter(x => !x.ok).length;
  app.innerHTML = `<div class="result"><div class="big-ic">${o.icon}</div><h1>${o.title}</h1><p class="muted">${o.sub || ''}</p>
    <div class="res-tiles">
      <div class="rt" style="--c:var(--acc)"><small>نقاط XP</small><b>+${o.xp}</b></div>
      <div class="rt" style="--c:var(--pri)"><small>الدقة</small><b>${o.acc}%</b></div>
      <div class="rt" style="--c:var(--t-s)"><small>الوقت</small><b>${Math.floor(o.secs / 60)}:${String(o.secs % 60).padStart(2, '0')}</b></div>
    </div>
    ${goalHit ? `<div class="card" style="margin-bottom:12px"><b>🎯 حققت هدفك اليومي!</b><div class="muted">سلسلتك الآن <span class="en">${streakNow(p)}</span> 🔥</div></div>` : `<div class="muted" style="margin-bottom:12px">الهدف اليومي: <span class="en">${todayXP(p)} / ${p.goal} XP (${g}%)</span> · السلسلة <span class="en">${streakNow(p)}</span> 🔥</div>`}
    ${o.badges && o.badges.length ? `<div class="new-badges">${o.badges.map(b => `<div class="nb">${b.i} ${b.t}</div>`).join('')}</div>` : ''}
    <div class="spacer"></div>
    ${log.length ? `<button class="btn ${wrongN ? 'acc' : 'ghost'}" data-ra>📋 راجع إجاباتك${wrongN ? ` (<span class="en">${wrongN}</span> خطأ)` : ''}</button>` : ''}
    <button class="btn" data-n>متابعة</button></div>`;
  const nextFn = o.next || (() => go('home'));
  $('[data-n]').onclick = nextFn;
  const ra = $('[data-ra]'); if (ra) ra.onclick = () => reviewAnswers(log, 'راجع إجاباتك', () => resultScreen(Object.assign({}, o, { badges: [], replay: true })));
}

/* ---------------- القواعد التفاعلية ---------------- */
function markup(s) {
  let out = '', last = 0; const re = /\[([^|\]]+)\|(\w)\]/g; let m;
  while ((m = re.exec(s))) { out += esc(s.slice(last, m.index)) + `<span class="tkw t-${m[2]}" data-tag="${m[2]}" data-w="${esc(m[1])}">${esc(m[1])}</span>`; last = re.lastIndex; }
  return out + esc(s.slice(last));
}
const plain = s => s.replace(/\[([^|\]]+)\|\w\]/g, '$1');
function gCardHTML(c) {
  const tags = new Set(); (c.ex || []).forEach(e => { let m; const re = /\|(\w)\]/g; while ((m = re.exec(e[0]))) tags.add(m[1]); }); (c.f || []).forEach(f => tags.add(f[1]));
  return `<div class="gcard"><h2>${c.t}</h2>
    ${tags.size ? `<div class="legend">${[...tags].map(t => `<span class="t-${t}">${TAGS[t]}</span>`).join('')}</div>` : ''}
    <div class="gbody">${c.b}</div>
    ${c.f ? `<div class="formula" dir="ltr">${c.f.map(([x, t]) => `<span class="tk t-${t}">${x}</span>`).join('<b>+</b>')}</div>` : ''}
    ${c.ex ? `<div class="exs">${c.ex.map(e => `<div class="exl">${spkBtn(plain(e[0]), 'sm')}<div><div class="en-l">${markup(e[0])}</div><div class="ar-l">${esc(e[1])}</div></div></div>`).join('')}</div>` : ''}
    ${c.n ? `<div class="gnote">${c.n}</div>` : ''}
    ${c.q ? `<div class="qc"><div class="qc-h">✋ جرّب بنفسك</div><div class="qc-s">${esc(c.q.s).replace('___', '<span class="slot">&nbsp;</span>')}</div><div class="chips">${shuffle(c.q.o).map(o => `<button class="chip" data-o="${esc(o)}">${esc(o)}</button>`).join('')}</div><div class="qfb"></div></div>` : ''}
  </div>`;
}
function bindGCard(root, c) {
  bindSay(root);
  $$('.tkw', root).forEach(t => t.onclick = e => {
    say(t.dataset.w); const r = t.getBoundingClientRect(); const tip = document.createElement('div'); tip.className = 'tipbox'; tip.textContent = TAGS[t.dataset.tag];
    tip.style.left = (r.left + r.width / 2) + 'px'; tip.style.top = (r.top - 4) + 'px'; document.body.appendChild(tip); setTimeout(() => tip.remove(), 1400);
  });
  if (c.q) {
    const fbx = $('.qfb', root);
    $$('.qc .chip', root).forEach(b => b.onclick = () => {
      if (b.dataset.o === c.q.a) { $$('.qc .chip', root).forEach(x => x.style.pointerEvents = 'none'); b.classList.add('right'); $('.qc .slot', root).textContent = c.q.a; fbx.innerHTML = `✅ ${esc(c.q.w || 'إجابة صحيحة!')}`; fbx.style.color = 'var(--pri)'; SFX.ok(); say(c.q.s.replace('___', c.q.a)); }
      else { b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 500); fbx.textContent = '❌ ليست هذه، حاول مرة أخرى.'; fbx.style.color = 'var(--bad)'; SFX.bad(); }
    });
  }
}
function showGrammar(L, onEnd, readOnly) {
  leave(); let i = 0; const cards = L.g;
  function draw() {
    const c = cards[i]; const last = i === cards.length - 1;
    app.innerHTML = `<div class="ses"><div class="ses-top"><button class="icon-btn" data-x aria-label="خروج">✕</button><div style="flex:1;font-weight:700">📖 ${esc(L.ta)}</div>${!readOnly ? '<button class="btn ghost sm" data-skip>تخطَّ الشرح</button>' : ''}</div>
      <div class="g-wrap">${gCardHTML(c)}<div class="dots">${cards.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div><p class="g-tip">💡 اضغط على الكلمات الملوّنة لتعرف دورها، وعلى 🔊 للاستماع.</p></div>
      <div class="ses-foot"><div class="foot-row">${i > 0 ? '<button class="btn ghost" data-prev>السابق</button>' : ''}<button class="btn" data-next>${last ? (readOnly ? 'تم ✓' : 'ابدأ التمارين ←') : 'التالي'}</button></div></div></div>`;
    bindGCard(app, c);
    $('[data-x]').onclick = () => go('home');
    const sk = $('[data-skip]'); if (sk) sk.onclick = onEnd;
    const pv = $('[data-prev]'); if (pv) pv.onclick = () => { i--; draw(); };
    $('[data-next]').onclick = () => { if (last) onEnd(); else { i++; draw(); window.scrollTo(0, 0); } };
    onKey = e => { if (e.key === 'Enter' && document.activeElement.tagName !== 'BUTTON') $('[data-next]').click(); };
  }
  draw();
}

/* ---------------- الدروس ---------------- */
function startLesson(L) {
  const run = () => runSession({ mode: 'lesson', ctx: L.id, exercises: genLesson(L), onDone: s => lessonDone(L, s) });
  showGrammar(L, run, false);
}
function lessonDone(L, s) {
  const p = P(); const first = !p.done[L.id]; const before = todayXP(p);
  p.done[L.id] = (p.done[L.id] || 0) + 1; p.stats.lessons++; if (s.acc === 100) p.stats.perfect++;
  const xp = 10 + Math.round(s.acc / 20) + (first ? 5 : 0); addXP(p, xp); // النقاط تتبع الدقة: التحفيز يخدم التعلّم
  const fresh = L.vocab.filter(v => !p.srs[v[0]]).length; L.vocab.forEach(v => srsAdd(p, v[0]));
  logEv('lesson', { lesson: L.id, unit: L.ui, acc: s.acc, secs: s.secs, xp, mistakes: s.mistakes, words: fresh, weak: s.wrongKeys.slice(0, 20) });
  const badges = checkBadges(p); save();
  const unitReady = first && allLessonsDone(p, L.ui) && !p.passed[L.ui];
  resultScreen({ icon: unitReady ? '🏁' : s.acc === 100 ? '🌟' : '🎉', title: unitReady ? 'أنهيت دروس الوحدة!' : 'أتممت الدرس!',
    sub: unitReady ? 'اختبار نهاية الوحدة جاهز الآن، واجتيازه يفتح الوحدة التالية.' : `${esc(L.ta)} · ${fresh} كلمات جديدة أضيفت للمراجعة${s.wrongKeys.length ? ' · وما أخطأت فيه سيعود إليك في المراجعة' : ''}`,
    xp, acc: s.acc, secs: s.secs, badges, goalBefore: before, log: s.log });
}

/* ---------------- اختبار نهاية الوحدة ---------------- */
const PASS_MARK = 80;
function unitTestSheet(u) {
  const p = P(); const stt = testState(p, u, currentItem(p)); const U = C.units[u];
  if (stt === 'lock') return toast('🔒 أكمل كل دروس الوحدة أولاً');
  const hist = (p.tests || []).filter(t => t.unit === u).slice(-3).reverse();
  sheet(`<div class="sh-ic" style="background:${U.color}">🏁</div><h3>اختبار نهاية الوحدة ${u + 1}</h3><p class="muted">${U.t}</p>
    <p>18 سؤالاً من كل دروس الوحدة · درجة النجاح <b class="en">${PASS_MARK}%</b><br>${u + 1 < NU ? 'النجاح يفتح الوحدة التالية.' : 'النجاح يختم المنهج المتاح.'} وبلا حد لعدد المحاولات.</p>
    ${hist.length ? `<div class="card" style="text-align:start;margin:10px 0">${hist.map(t => `<div class="set-row"><span><b class="en">${t.score}%</b><small> · ${fmtDate(t.t)} · ${Math.round(t.secs / 60) || 1} دقيقة</small></span><span class="pill ${t.passed ? 'ok' : ''}">${t.passed ? 'ناجح' : 'لم ينجح'}</span></div>`).join('')}</div>` : ''}
    <button class="btn acc" data-go>${p.passed[u] ? 'أعد الاختبار' : 'ابدأ الاختبار'}</button>`, (s, close) => { $('[data-go]', s).onclick = () => { close(); startUnitTest(u); }; });
}
function startUnitTest(u) {
  runSession({ mode: 'test', ctx: 'test' + u, exercises: genUnitTest(u, P()), onDone: s => {
    const p = P(); const before = todayXP(p); const passed = s.acc >= PASS_MARK; const firstPass = passed && !p.passed[u];
    const rec = { unit: u, score: s.acc, passed, secs: s.secs, t: Date.now(), day: today() };
    p.tests = (p.tests || []).concat(rec).slice(-100); p.stats.tests++;
    if (passed && (!p.passed[u] || (p.passed[u].score || 0) < s.acc)) p.passed[u] = { score: s.acc, day: today() };
    const xp = passed ? 20 + Math.round(s.acc / 10) : 5; addXP(p, xp);
    logEv('test', rec); const badges = checkBadges(p); save();
    const weakLessons = [...new Set(s.wrongKeys.map(k => (k.startsWith('B:') && BMAP[k.slice(2)]) ? BMAP[k.slice(2)].L.ta : (k.startsWith('S:') && SMAP[k.slice(2)]) ? SMAP[k.slice(2)].L.ta : null).filter(Boolean))];
    resultScreen({ icon: passed ? '🏆' : '💪', title: passed ? 'نجحت في الاختبار!' : 'قريب من النجاح',
      sub: passed ? (firstPass && u + 1 < NU ? `فُتحت الوحدة ${u + 2}: ${C.units[u + 1].t}` : 'أحسنت!') : `تحتاج ${PASS_MARK}% للنجاح. راجع${weakLessons.length ? ': ' + weakLessons.join('، ') : ' دروس الوحدة'}، ثم أعد المحاولة.`,
      xp, acc: s.acc, secs: s.secs, badges, goalBefore: before, log: s.log });
  } });
}

/* ---------------- المراجعة الذكية (FSRS) ---------------- */
function reviewEx(k, p) {
  if (k.startsWith('B:') && BMAP[k.slice(2)]) return exFill(BMAP[k.slice(2)].b);
  if (k.startsWith('S:') && SMAP[k.slice(2)]) { const s = SMAP[k.slice(2)].s; return pick(Array.isArray(s[2]) ? [exOrder, exDict, exTType] : [exOrder, exDict])(s); }
  if (k.startsWith('P:')) { const [a, b] = k.slice(2).split('|'); const L = LESSONS.find(l => l.pairs && l.pairs.some(x => x[0] === a && x[1] === b)); const pr = L ? L.pairs.find(x => x[0] === a && x[1] === b) : [a, b, '', '']; return exPair(pr); }
  const v = VMAP[k] ? [k, VMAP[k].ar] : [k, k]; const strong = (p.srs[k].s || 0) >= 4;
  const t = pick(strong ? ['write', 'listen', 'enar', 'aren'] : ['aren', 'enar', 'listen', 'aren']);
  return t === 'write' ? exWrite(v) : t === 'listen' ? exListenWord(v) : t === 'enar' ? exMcEnAr(v) : exMcArEn(v);
}
function startReview() {
  const p = P(); const keys = Object.keys(p.srs).filter(k => !k.startsWith('S:') || SMAP[k.slice(2)]);
  if (!keys.length) return toast('أكمل درساً أولاً لتظهر كلماتك هنا');
  const t = today(); let due = shuffle(keys.filter(k => p.srs[k].due <= t)).sort((a, b) => FS.retrievability(p.srs[a], t) - FS.retrievability(p.srs[b], t)).slice(0, 15);
  if (due.length < 6) due = due.concat(keys.filter(k => !due.includes(k)).sort((a, b) => FS.retrievability(p.srs[a], t) - FS.retrievability(p.srs[b], t)).slice(0, 6 - due.length));
  runSession({ mode: 'review', ctx: 'review', exercises: shuffle(due.map(k => reviewEx(k, p))), onDone: s => {
    const before = todayXP(p); const xp = 5 + Math.round(due.length * s.acc / 100); addXP(p, xp); p.stats.reviews++;
    logEv('review', { n: due.length, acc: s.acc, secs: s.secs, xp }); const badges = checkBadges(p); save();
    const left = dueKeys(p).length;
    resultScreen({ icon: '🧠', title: 'أنهيت المراجعة!', sub: left ? `بقي ${left} عنصراً مستحقاً اليوم` : 'لا شيء مستحق اليوم. ذاكرتك في أفضل حال!', xp, acc: s.acc, secs: s.secs, badges, goalBefore: before, log: s.log });
  } });
}

/* ---------------- اختبار تحديد المستوى ---------------- */
const LV = ['A1', 'A2', 'B1', 'B2'];
function startPlacement() {
  leave();
  app.innerHTML = `<div class="result"><div class="big-ic">🎯</div><h1 style="color:var(--pri)">اختبار تحديد المستوى</h1>
    <p class="muted">أسئلة قصيرة تتدرج من السهل إلى الصعب، وتتوقف تلقائياً عند مستواك.<br>المدة: من 3 إلى 8 دقائق. إن لم تعرف الإجابة فاضغط <b>«لا أعرف»</b> ولا تخمّن، لتكون النتيجة دقيقة.</p>
    <div class="place-bars">${LV.map(l => `<div class="pb-row"><b>${l}</b><span class="muted">${{ A1: 'مبتدئ', A2: 'أساسي', B1: 'متوسط', B2: 'فوق المتوسط' }[l]}</span></div>`).join('')}</div>
    <div class="spacer"></div><button class="btn" data-s>ابدأ الاختبار</button><button class="btn ghost" data-b>رجوع</button></div>`;
  $('[data-s]').onclick = runPlacement; $('[data-b]').onclick = () => go('home');
}
/* الجهاز يتذكر أسئلة اختبار المستوى التي ظهرت مؤخراً ويقدّم الجديدة أولاً */
const SEENQ_KEY = 'lisan.seenQ';
const seenQ = () => { try { return new Set(JSON.parse(localStorage.getItem(SEENQ_KEY) || '[]')); } catch (e) { return new Set(); } };
const markSeenQ = qs => { try { const a = [...seenQ()].filter(x => !qs.includes(x)).concat(qs).slice(-240); localStorage.setItem(SEENQ_KEY, JSON.stringify(a)); } catch (e) { } };
function runPlacement() {
  leave(); GLOSS_OFF = true;
  const seen = seenQ(); const sets = LV.map(l => { const all = C.placement[l]; return shuffle(all.filter(q => !seen.has(q[0]))).concat(shuffle(all.filter(q => seen.has(q[0])))); });
  const score = [0, 0, 0, 0], asked = [0, 0, 0, 0]; let li = 0, qi = 0; const N = 6, PASS = 5; const maxQ = N * 4; let n = 0;
  const log = [], used = [], t0 = Date.now();
  function draw() {
    const q = sets[li][qi]; const opts = shuffle(q[1]); used.push(q[0]);
    app.innerHTML = `<div class="ses"><div class="ses-top"><button class="icon-btn" data-x aria-label="خروج">✕</button><div class="pbar"><i style="width:${n / maxQ * 100}%"></i></div><span class="pill">${LV[li]}</span></div>
      <div class="ses-body"><h2 class="q">اختر الكلمة المناسبة</h2><div class="fill-s" dir="ltr">${esc(q[0]).replace('___', '<span class="slot">&nbsp;</span>')}</div><div style="height:18px"></div>
      <div class="opts">${opts.map((o, i) => `<button class="opt" data-i="${i}" dir="ltr"><span class="k">${i + 1}</span>${esc(o)}</button>`).join('')}</div><div class="pl-fb"></div></div>
      <div class="ses-foot"><button class="btn ghost" data-dk>لا أعرف</button></div></div>`;
    $('[data-x]').onclick = () => confirmBox('إنهاء الاختبار؟', () => go('home'), 'إنهاء');
    const advance = ok => { asked[li]++; if (ok) score[li]++; n++; qi++;
      if (qi >= N) { if (score[li] >= PASS && li < 3) { li++; qi = 0; } else return finishPlacement(score, asked, log, used, t0); }
      else if (asked[li] - score[li] > N - PASS) { return finishPlacement(score, asked, log, used, t0); } // استحال النجاح في هذا المستوى
      draw(); };
    const judge = given => { // الحكم فوراً: أخضر للصحيح، وأحمر للخطأ مع إظهار الصحيح
      const ok = given === q[2]; $$('.opt').forEach(x => { x.style.pointerEvents = 'none'; const o = opts[+x.dataset.i]; if (o === q[2]) x.classList.add('right'); else if (o === given) x.classList.add('wrong'); });
      $('[data-dk]').disabled = true; const full = q[0].replace('___', q[2]);
      $('.slot').textContent = q[2]; $('.pl-fb').innerHTML = ok ? `<span class="w-ok">✅ ${pick(PRAISE)}</span>` : `<span class="w-bad-plain">❌ ${given ? 'إجابة خاطئة' : 'لا بأس'}</span> · الصحيح: ${en(q[2])}`;
      ok ? SFX.ok() : SFX.bad();
      log.push({ type: 'fill', q: `<span dir="ltr" class="en">${esc(q[0])}</span> <span class="pill">${LV[li]}</span>`, given: given ? en(given) : '<i class="muted">لا أعرف</i>', correct: en(full), ok });
      setTimeout(() => advance(ok), ok ? 750 : 1500);
    };
    $$('.opt').forEach(b => b.onclick = () => judge(opts[+b.dataset.i]));
    $('[data-dk]').onclick = () => judge(null);
  }
  draw();
}
function finishPlacement(score, asked, log, used, t0) {
  markSeenQ(used);
  const p = P(); let passed = 0; for (let i = 0; i < 4; i++) { if (asked[i] && score[i] >= 5) passed++; else break; }
  const level = ['A1', 'A2', 'B1', 'B1+', 'B2+'][passed];
  const start = passed === 0 ? 0 : passed === 1 ? 3 : passed === 2 ? 6 : NU;
  p.placement = { level, date: today(), score, asked }; if (start > p.startUnit) p.startUnit = start;
  saveMistakes(p, log, 'placement');
  logEv('placement', { level, score, asked, secs: Math.round((Date.now() - t0) / 1000) }); const badges = checkBadges(p); save();
  const desc = { A1: 'مبتدئ: سنبني الأساس خطوة بخطوة من البداية.', A2: 'أساسي: تجاوزت الأساسيات، وستبدأ من الوحدة 4.', B1: 'متوسط: ممتاز! ستبدأ من وحدة المستوى المتوسط.', 'B1+': 'فوق المتوسط: فُتحت لك كل الوحدات المتاحة. ابدأ من أي درس.', 'B2+': 'متقدم: فُتح لك المنهج كاملاً. والمستويات الأعلى قادمة.' }[level];
  const show = () => {
    leave(); const wrongN = log.filter(x => !x.ok).length;
    app.innerHTML = `<div class="result"><div class="big-ic">🎯</div><p class="muted" style="margin:10px 0 0">مستواك</p><div class="lvl-big">${level}</div><p>${desc}</p>
      <div class="place-bars">${LV.map((l, i) => `<div class="pb-row"><b>${l}</b><div class="pbar"><i style="width:${asked[i] ? score[i] / asked[i] * 100 : 0}%"></i></div><small>${asked[i] ? score[i] + '/' + asked[i] : '—'}</small></div>`).join('')}</div>
      ${badges.length ? `<div class="new-badges">${badges.map(b => `<div class="nb">${b.i} ${b.t}</div>`).join('')}</div>` : ''}
      <div class="spacer"></div><button class="btn ${wrongN ? 'acc' : 'ghost'}" data-ra>📋 راجع إجاباتك${wrongN ? ` (<span class="en">${wrongN}</span> خطأ)` : ''}</button><button class="btn" data-n>ابدأ التعلّم</button></div>`;
    $('[data-n]').onclick = () => go('home');
    $('[data-ra]').onclick = () => reviewAnswers(log, 'إجابات اختبار المستوى', show);
  };
  SFX.win(); show();
}

/* ---------------- اختيار المستوى يدوياً ---------------- */
const LEVEL_CHOICES = [
  ['🌱', 'مبتدئ', 'لا أعرف الإنجليزية، أو أعرف كلمات قليلة.', 0, 'A1'],
  ['🌿', 'أساسي', 'أفهم جملاً بسيطة، وأعرف المضارع والملكية.', 3, 'A2'],
  ['🌳', 'متوسط', 'أتحدث في مواقف يومية، وأعرف الماضي والمستقبل.', 6, 'B1']
];
function chooseLevel(after) {
  sheet(`<h3>أختار مستواي</h3><p class="muted">اختر الأقرب لك. يمكنك تغييره لاحقاً من صفحة «ملفي».</p><div class="list" style="text-align:start">${LEVEL_CHOICES.map((c, i) => `<button class="row-card" data-lv="${i}"><span class="ic">${c[0]}</span><span class="tx"><b>${c[1]} <span class="en pill">${c[4]}</span></b><small>${c[2]}</small></span></button>`).join('')}</div>`, (s, close) => {
    $$('[data-lv]', s).forEach(b => b.onclick = () => {
      const c = LEVEL_CHOICES[+b.dataset.lv]; const p = P(); p.startUnit = c[3]; p.placement = { level: c[4], date: today(), manual: true };
      logEv('level_chosen', { level: c[4] }); save(); close(); toast(`✅ تبدأ من الوحدة ${c[3] + 1}`); (after || (() => go('home')))();
    });
  });
}

/* ---------------- تحدي السرعة: 10 أسئلة × 10 ثوانٍ ---------------- */
function startSpeed() {
  const p = P(); const learned = LESSONS.filter(L => p.done[L.id] || unitSkipped(p, L.ui)); const pool = learned.length ? learned : UNIT_LESSONS[0];
  const items = shuffle(pool.flatMap(L => [...L.vocab.map(v => () => pick([exMcArEn, exMcEnAr])(v, L)), ...L.blanks.map(b => () => exFill(b))])).slice(0, 10).map(f => { const e = f(); e.timed = 10; return e; });
  runSession({ mode: 'speed', ctx: 'speed', exercises: items, onDone: s => {
    const before = todayXP(p); const correct = Math.round(s.acc * s.total / 100); const pts = correct * 10 + s.bonus;
    const best = p.speedBest || 0; const record = pts > best; if (record) p.speedBest = pts;
    const xp = 5 + Math.round(pts / 20); addXP(p, xp); logEv('speed', { correct, total: s.total, pts, secs: s.secs }); const badges = checkBadges(p); save();
    resultScreen({ icon: record ? '🚀' : '⚡', title: record ? 'رقم قياسي جديد!' : 'انتهى التحدي!', sub: `نتيجتك <b class="en">${pts}</b> نقطة (<span class="en">${correct}/${s.total}</span> صحيحة + <span class="en">${s.bonus}</span> للسرعة) · أفضل نتيجة: <b class="en">${Math.max(best, pts)}</b>`, xp, acc: s.acc, secs: s.secs, badges, goalBefore: before, log: s.log });
  } });
}

/* ---------------- المحادثات ---------------- */
function startConvo(c) {
  leave(); const p = P(); let ti = 0, mistakes = 0; const t0 = Date.now();
  app.innerHTML = `<div class="ses convo"><div class="ses-top"><button class="icon-btn" data-x aria-label="خروج">✕</button><div class="ct"><b>${c.icon} ${esc(c.ta)}</b><small>${esc(c.npcName)} · ${esc(c.place)}</small></div><div class="pbar"><i></i></div></div>
    <div class="chat"></div><div class="reply"></div></div>`;
  const chat = $('.chat'), rp = $('.reply');
  $('[data-x]').onclick = () => confirmBox('إنهاء المحادثة؟', () => go('home'), 'إنهاء');
  const scroll = () => setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 50);
  function bubble(who, text, tr) {
    const d = document.createElement('div'); d.className = 'msg ' + who;
    d.innerHTML = who === 'npc'
      ? `<div class="av">${c.npcAv}</div><div class="bub"><span class="en">${esc(text)}</span><div class="tr">${esc(tr)}</div><div class="bub-tools"><button data-say="${esc(text)}">🔊 استمع</button><button data-say="${esc(text)}" data-slow="1">🐢 ببطء</button><button data-tr>ترجمة</button></div></div>`
      : `<div class="av">${p.avatar}</div><div class="bub"><span class="en">${esc(text)}</span></div>`;
    chat.appendChild(d); bindSay(d); const trb = $('[data-tr]', d); if (trb) trb.onclick = () => $('.bub', d).classList.toggle('show-tr'); scroll();
  }
  function npcTurn() { const t = c.turns[ti]; $('.pbar i').style.width = (ti / c.turns.length * 100) + '%'; bubble('npc', t.npc, t.ar); say(t.npc); setTimeout(() => options(t), 450); }
  function options(t) {
    const opts = shuffle(t.opts);
    rp.innerHTML = `<div class="reply-h"><span>اختر ردّك${micOK() ? ' أو قله بصوتك' : ''}</span>${micOK() ? '<button class="mic-sm" aria-label="تحدّث">🎤</button>' : ''}</div><div class="cfb" hidden></div>${opts.map((o, i) => `<button class="ropt" data-i="${i}">${esc(o[0])}</button>`).join('')}`;
    const cfb = $('.cfb', rp);
    const choose = (i, viaVoice) => {
      const o = opts[i]; const b = $(`.ropt[data-i="${i}"]`, rp);
      if (o[1]) {
        SFX.ok(); bubble('me', o[0]); if (!viaVoice) say(o[0]);
        rp.innerHTML = o[2] ? `<div class="cfb ok">✅ ${esc(o[2])}</div>` : `<div class="cfb ok">✅ ${pick(PRAISE)}</div>`;
        ti++; setTimeout(() => ti < c.turns.length ? npcTurn() : end(), o[2] ? 1700 : 1100);
      } else { mistakes++; SFX.bad(); b.classList.add('wrong'); cfb.hidden = false; cfb.className = 'cfb'; cfb.innerHTML = `❌ ${esc(o[2])}`; }
    };
    $$('.ropt', rp).forEach(b => b.onclick = () => choose(+b.dataset.i));
    const mic = $('.mic-sm', rp);
    if (mic) mic.onclick = () => {
      if (mic.classList.contains('rec')) return; mic.classList.add('rec');
      listen((alts, err) => {
        mic.classList.remove('rec');
        if (!alts) { cfb.hidden = false; cfb.className = 'cfb'; cfb.textContent = err === 'not-allowed' ? 'اسمح باستخدام الميكروفون من إعدادات المتصفح.' : 'لم أسمعك جيداً، حاول مجدداً.'; return; }
        let best = -1, bs = 0; opts.forEach((o, i) => alts.forEach(a => { const s = wordSim(a, o[0]); if (s > bs) { bs = s; best = i; } }));
        if (best >= 0 && bs >= 0.6) choose(best, true);
        else { cfb.hidden = false; cfb.className = 'cfb'; cfb.innerHTML = `سمعتُ: ${en(alts[0])} — حاول نطق أحد الردود.`; }
      });
    };
  }
  function end() {
    const before = todayXP(p); const xp = 10 + (mistakes === 0 ? 5 : 0); const first = !p.convos[c.id];
    p.convos[c.id] = true; p.stats.talks++; addXP(p, xp); logEv('convo', { convo: c.id, mistakes, xp }); const badges = checkBadges(p); save();
    const total = c.turns.length; const acc = Math.round(Math.max(0, total - mistakes) / total * 100);
    setTimeout(() => resultScreen({ icon: '💬', title: 'محادثة ناجحة!', sub: first ? `أتممت «${esc(c.ta)}» لأول مرة` : 'تدريب ممتاز على الحوار', xp, acc, secs: Math.round((Date.now() - t0) / 1000), badges, goalBefore: before, next: () => go('home', 'talk') }), 600);
  }
  npcTurn();
}

/* ---------------- الشاشات الرئيسية ---------------- */
const AVATARS = ['🦊', '🐼', '🦁', '🐯', '🐨', '🐸', '🐵', '🐬', '🦄', '🐢', '🐙', '🐝', '🦅', '🐪', '🐎', '🦒', '🐧', '🐳'];
const GOALS = [[15, 'خفيف', 'درس واحد تقريباً · 5 دقائق'], [30, 'منتظم', 'درسان · 10 دقائق'], [50, 'جاد', '3 دروس · 15 دقيقة'], [80, 'مكثّف', '5 دروس · 25 دقيقة']];

/* ---------- لوحة الرقم السري (قفل للأطفال وولي الأمر) ---------- */
function pinPad(title, onDone, opts = {}) {
  let v = '';
  sheet(`<h3>${title}</h3><p class="muted">${opts.sub || 'أدخل 4 أرقام'}</p><div class="pin-dots">${'<i></i>'.repeat(4)}</div><div class="pin-msg"></div>
    <div class="pin-pad" dir="ltr">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map(k => k === '' ? '<span></span>' : `<button data-k="${k}">${k}</button>`).join('')}</div>`, (s, close) => {
    const dots = $$('.pin-dots i', s), msg = $('.pin-msg', s);
    const draw = () => dots.forEach((d, i) => d.classList.toggle('on', i < v.length));
    $$('[data-k]', s).forEach(b => b.onclick = () => {
      const k = b.dataset.k; if (k === '⌫') v = v.slice(0, -1); else if (v.length < 4) v += k; draw();
      if (v.length === 4) setTimeout(() => { const r = onDone(v); if (r === false) { msg.textContent = 'الرقم غير صحيح، حاول مرة أخرى.'; v = ''; draw(); s.querySelector('.pin-dots').classList.add('shake'); setTimeout(() => s.querySelector('.pin-dots').classList.remove('shake'), 400); } else close(); }, 120);
    });
  });
}
function parentGate(then) { // للتوافق مع بيانات الإصدار السابق فقط: لا يُطلب إلا إذا كان رقم العائلة القديم مفعّلاً
  if (!DB.family || !DB.family.pin) return then();
  pinPad('🔐 رقم الحماية', v => { if (hashPin(v) !== DB.family.pin) return false; then(); });
}

/* ---------- الترحيب: أنا جديد · لدي حساب سابق ---------- */
function scrWelcome() {
  leave(); SCREEN = 'profiles';
  app.innerHTML = `<div class="prof-scr"><div class="logo"><img src="icon.svg" alt="" onerror="this.remove()">لِسان</div><p class="tagline">تعلّم الإنجليزية خطوة بخطوة، دقائق كل يوم.</p>
    <div class="welcome-art">👋</div><h2>أهلاً بك!</h2>
    <button class="choice-big" data-new><span class="ic">🌱</span><span><b>أنا جديد</b><span>أبدأ من الصفر، أو بالاختبار، أو أختار مستواي.</span></span></button>
    <button class="choice-big" data-imp><span class="ic">📲</span><span><b>لدي حساب سابق</b><span>أنقل تقدّمي من جهاز آخر وأكمل من حيث توقفت.</span></span></button>
    <p class="muted" style="font-size:13px;margin-top:22px">${syncLine()}</p></div>`;
  $('[data-new]').onclick = scrNewProfile; $('[data-imp]').onclick = importAccount;
}
function scrProfiles() {
  leave(); SCREEN = 'profiles'; DB.current = null; saveLocal(); applyTheme();
  if (!DB.profiles.length) return scrWelcome();
  app.innerHTML = `<div class="prof-scr"><div class="logo"><img src="icon.svg" alt="" onerror="this.remove()">لِسان</div><p class="tagline">تعلّم الإنجليزية خطوة بخطوة، دقائق كل يوم.</p>
    <h2 style="margin-bottom:16px">من يتعلّم الآن؟</h2>
    <div class="prof-grid">${DB.profiles.map(p => `<button class="prof" data-id="${p.id}"><span class="av">${p.avatar}</span><b>${esc(p.name)}${p.pin ? ' 🔒' : ''}</b><small><span class="en">${levelLabel(p)}</span> · 🔥 <span class="en">${streakNow(p)}</span> · ⭐ <span class="en">${p.xp}</span></small></button>`).join('')}
    <button class="prof add" data-add><span class="av">＋</span>إضافة شخص</button></div>
    <p class="muted" style="font-size:13px">${syncLine()}</p></div>`;
  $$('[data-id]').forEach(b => b.onclick = () => {
    const p = DB.profiles.find(x => x.id === b.dataset.id); const enter = () => { DB.current = p.id; saveLocal(); go('home'); };
    if (p.pin) pinPad(`${p.avatar} ${esc(p.name)}`, v => { if (hashPin(v) !== p.pin) return false; enter(); }); else enter();
  });
  $('[data-add]').onclick = () => parentGate(() => sheet(`<h3>إضافة شخص</h3>
    <button class="choice-big" data-new><span class="ic">🌱</span><span><b>شخص جديد</b><span>يبدأ من الصفر على هذا الجهاز.</span></span></button>
    <button class="choice-big" data-imp><span class="ic">📲</span><span><b>لديه حساب سابق</b><span>ينقل تقدّمه من جهاز آخر.</span></span></button>`, (s, close) => {
    $('[data-new]', s).onclick = () => { close(); scrNewProfile(); }; $('[data-imp]', s).onclick = () => { close(); importAccount(); };
  }));
}
function scrNewProfile() {
  leave(); let name = '', av = AVATARS[rnd(AVATARS.length)], goal = 30, step = 0, pin = null;
  function draw() {
    if (step === 0) {
      app.innerHTML = `<div class="form"><button class="icon-btn" data-b aria-label="رجوع">→</button><h2>حساب جديد</h2><p>لكل شخص حسابه وتقدّمه الخاص.</p>
        <label class="field" for="nm">الاسم</label><input class="inp" id="nm" maxlength="20" placeholder="مثال: محمد" value="${esc(name)}">
        <label class="field">الصورة الرمزية</label><div class="av-grid">${AVATARS.map(a => `<button class="${a === av ? 'sel' : ''}" data-av="${a}">${a}</button>`).join('')}</div>
        <label class="field">الهدف اليومي</label><div class="goal-list">${GOALS.map(g => `<button class="goal ${g[0] === goal ? 'sel' : ''}" data-g="${g[0]}"><span>${g[1]} <small>· ${g[2]}</small></span><span class="en">${g[0]} XP</span></button>`).join('')}</div>
        <label class="field">رقم سري <small class="muted">(اختياري)</small></label><button class="btn ghost" data-pin style="margin-top:0">${pin ? '✅ تم تعيين الرقم السري' : '🔒 قفل الحساب برقم سري'}</button>
        <button class="btn" data-n ${name.trim() ? '' : 'disabled'}>التالي</button></div>`;
      $('[data-pin]').onclick = () => pinPad('رقم سري للحساب', v => { pin = hashPin(v); $('[data-pin]').textContent = '✅ تم تعيين الرقم السري'; });
      const nm = $('#nm'); nm.oninput = () => { name = nm.value; $('[data-n]').disabled = !name.trim(); };
      $$('[data-av]').forEach(b => b.onclick = () => { av = b.dataset.av; $$('[data-av]').forEach(x => x.classList.toggle('sel', x === b)); });
      $$('[data-g]').forEach(b => b.onclick = () => { goal = +b.dataset.g; $$('[data-g]').forEach(x => x.classList.toggle('sel', x === b)); });
      $('[data-b]').onclick = () => go('profiles');
      $('[data-n]').onclick = () => { step = 1; draw(); };
      if (!name) setTimeout(() => nm.focus(), 100);
    } else {
      app.innerHTML = `<div class="form"><button class="icon-btn" data-b aria-label="رجوع">→</button><div style="font-size:56px;text-align:center">${av}</div><h2 style="text-align:center">أهلاً ${esc(name)}!</h2><p style="text-align:center">من أين تريد أن تبدأ؟</p>
        <button class="choice-big" data-z><span class="ic">🌱</span><span><b>من الصفر</b><span>لا أعرف الإنجليزية، أو أريد تأسيساً قوياً.</span></span></button>
        <button class="choice-big" data-p><span class="ic">🎯</span><span><b>اختبار تحديد المستوى</b><span>أعرف بعض الإنجليزية، حدّد لي نقطة البداية.</span></span></button>
        <button class="choice-big" data-l><span class="ic">🧭</span><span><b>أختار مستواي</b><span>أعرف مستواي، وأريد البدء منه مباشرة.</span></span></button></div>`;
      $('[data-b]').onclick = () => { step = 0; draw(); };
      let made = false;
      const create = () => { if (made) return; made = true; const p = newProfile(name.trim(), av, goal); p.pin = pin; DB.profiles.push(p); DB.current = p.id; save(); logEv('learner_created', { name: p.name }); };
      $('[data-z]').onclick = () => { create(); go('home'); };
      $('[data-p]').onclick = () => { create(); startPlacement(); };
      $('[data-l]').onclick = () => { create(); chooseLevel(); };
    }
  }
  draw();
}

/* ---------- نقل الحساب بين الأجهزة (ملف صغير يُرسل عبر الواتساب أو غيره) ---------- */
async function shareFile(name, json, title) {
  try {
    const f = new File([json], name, { type: 'application/json' });
    if (!IN_CLAUDE && navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title }); return true; }
  } catch (e) { if (e && e.name === 'AbortError') return false; }
  if (IN_CLAUDE) {
    try { const dl = await window.claude.use('downloads'); if (dl) { await dl.save({ filename: name, data: json }); return true; } } catch (e) { return false; }
    toast('الحفظ غير متاح هنا'); return false;
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); return true;
}
async function exportAccount(p) {
  const events = await Store.events(p.id);
  const json = JSON.stringify({ app: 'lisan', kind: 'account', v: 2, exported: new Date().toISOString(), profile: p, events });
  const ascii = p.name.replace(/[^A-Za-z0-9]+/g, '').slice(0, 16); // المتصفحات تُسقط الحروف العربية من أسماء الملفات
  if (await shareFile(`lisan-account${ascii ? '-' + ascii : ''}-${today()}.json`, json, `حساب ${p.name} في لِسان`)) toast('✅ جاهز: افتح الملف على الجهاز الجديد من «لدي حساب سابق»');
}
function importAccount() {
  const i = document.createElement('input'); i.type = 'file'; i.accept = 'application/json,.json';
  i.onchange = () => { const f = i.files[0]; if (!f) return; const r = new FileReader();
    r.onload = async () => {
      let list = [], events = [];
      try { const j = JSON.parse(r.result); if (j.kind === 'account' && j.profile) list = [j.profile]; else { const d = j.data || j; if (d && Array.isArray(d.profiles)) list = d.profiles; } events = j.events || []; } catch (e) { }
      if (!list.length) return toast('❌ هذا الملف ليس حساباً من لِسان');
      const clash = list.filter(x => DB.profiles.some(y => y.id === x.id));
      const apply = async () => {
        list.forEach(x => { fixProfile(x); const k = DB.profiles.findIndex(y => y.id === x.id); if (k >= 0) DB.profiles[k] = x; else DB.profiles.push(x); });
        if (events.length) await Store.importEvents(events);
        DB.current = list.length === 1 ? list[0].id : null; save(); logEv('account_imported', { n: list.length });
        toast(list.length === 1 ? `✅ أهلاً ${esc(list[0].name)}! أكمل من حيث توقفت` : `✅ نُقل ${list.length} حسابات`); go(list.length === 1 ? 'home' : 'profiles');
      };
      if (clash.length) confirmBox(`الحساب «${esc(clash[0].name)}» موجود على هذا الجهاز. استبداله بالنسخة المنقولة؟`, apply, 'استبدال'); else apply();
    };
    r.readAsText(f); };
  i.click();
}

let TAB = 'path';
function scrHome(tab) {
  leave(); SCREEN = 'home'; const p = P(); if (!p) return go('profiles'); if (tab) TAB = tab; applyTheme();
  const s = streakNow(p); const due = dueKeys(p).length;
  app.innerHTML = `<div class="home"><div class="topbar">
      <button class="lvl-chip" data-sw aria-label="تبديل الملف">${p.avatar} <span class="en">${levelLabel(p)}</span></button>
      <button class="stat flame ${s ? '' : 'off'}" data-st>🔥<span class="n">${s}</span></button>
      <button class="stat gem" data-xp>⭐<span class="n">${p.xp}</span></button>
      <button class="stat brain ${due ? '' : 'off'}" data-hr>🧠<span class="n">${due}</span></button></div>
    <div class="tab-body"></div>
    <nav class="tabs"><div class="tabs-in">${[['path', '🏠', 'التعلّم'], ['review', '🧠', 'المراجعة'], ['talk', '💬', 'المحادثة'], ['me', '👤', 'ملفي']].map(t => `<button data-tab="${t[0]}" class="${TAB === t[0] ? 'on' : ''}"><span class="ti">${t[1]}</span>${t[2]}</button>`).join('')}</div></nav></div>`;
  $$('[data-tab]').forEach(b => b.onclick = () => { TAB = b.dataset.tab; scrHome(); });
  $('[data-sw]').onclick = () => go('profiles');
  $('[data-st]').onclick = () => toast(s ? `سلسلتك ${s} يوم 🔥 — تعلّم اليوم لتحافظ عليها` : 'ابدأ درساً اليوم لتشعل سلسلتك 🔥');
  $('[data-xp]').onclick = () => toast(`مجموع نقاطك ${p.xp} XP · اليوم ${todayXP(p)}`);
  $('[data-hr]').onclick = () => { if (due) { TAB = 'review'; scrHome(); } else toast('لا توجد مراجعات مستحقة الآن 👍'); };
  const body = $('.tab-body');
  ({ path: tabPath, review: tabReview, talk: tabTalk, me: tabMe })[TAB](p, body);
}
const OFF = [0, 46, 70, 46, 0, -46, -70, -46];
function tabPath(p, el) {
  const cur = currentItem(p); const tx = todayXP(p); const pct = Math.min(100, Math.round(tx / p.goal * 100)); const due = dueKeys(p).length;
  let h = `<div class="card goal-card"><div class="ring" style="--p:${pct}"><span>${pct >= 100 ? '🎯' : '⚡'}</span></div><div style="flex:1"><b>${pct >= 100 ? 'حققت هدف اليوم!' : 'هدفك اليومي'}</b><small class="en">${tx} / ${p.goal} XP</small></div>${due ? `<button class="btn acc sm" data-rvq>🧠 ${due} للمراجعة</button>` : ''}</div>`;
  h += `<button class="card speed-card" data-speed><span class="ic">⚡</span><span style="flex:1"><b>تحدي السرعة</b><small>10 أسئلة · 10 ثوانٍ لكل سؤال${p.speedBest ? ` · أفضل نتيجة <span class="en">${p.speedBest}</span>` : ''}</small></span><span class="pill">ابدأ</span></button>`;
  if (!p.placement) h += `<button class="card cta-card" data-pl><span class="ic">🎯</span><span><b>اختبار تحديد المستوى</b><small>أو اختر مستواك بنفسك من صفحة «ملفي».</small></span></button>`;
  C.units.forEach((u, ui) => {
    const ls = UNIT_LESSONS[ui]; const dn = ls.filter(l => p.done[l.id]).length; const open = unitOpen(p, ui);
    h += `<section class="unit ${open ? '' : 'u-locked'}"><div class="uhead" style="--uc:${u.color}"><div><small>الوحدة ${ui + 1} · <span class="en">${u.lvl}</span> · <span class="en">${dn}/${ls.length}</span>${p.passed[ui] ? ' · ✅ ناجح' : ''}</small><h3>${u.t}</h3><p>${open ? u.d : '🔒 تُفتح بعد اجتياز اختبار الوحدة السابقة'}</p></div><button class="gbtn" data-ug="${ui}" aria-label="القواعد">📖</button></div><div class="path">`;
    ls.forEach((l, k) => { const stt = nodeState(p, l, cur);
      h += `<div class="nodewrap" style="transform:translateX(${OFF[k % OFF.length]}px)">${stt === 'cur' ? '<div class="start-tag">ابدأ</div>' : ''}<button class="node ${stt}" data-g="${l.gi}" style="--uc:${u.color}" aria-label="${esc(l.ta)}">${stt === 'done' ? '✓' : stt === 'lock' ? '🔒' : l.icon}</button><div class="nlabel">${esc(l.ta)}</div></div>`; });
    const ts = testState(p, ui, cur);
    h += `<div class="nodewrap">${ts === 'cur' ? '<div class="start-tag">الاختبار</div>' : ''}<button class="node test ${ts}" data-t="${ui}" style="--uc:${u.color}" aria-label="اختبار الوحدة">${ts === 'done' ? '🏆' : ts === 'lock' ? '🔒' : '🏁'}</button><div class="nlabel">اختبار الوحدة${p.passed[ui] && p.passed[ui].score != null ? ` · <span class="en">${p.passed[ui].score}%</span>` : ''}</div></div>`;
    h += `</div></section>`;
  });
  h += `<div class="soon"><b>🚀 قريباً</b>بقية المستوى المتوسط، ثم المستوى المتقدم.</div>`;
  el.innerHTML = h;
  const pl = $('[data-pl]', el); if (pl) pl.onclick = startPlacement;
  const rq = $('[data-rvq]', el); if (rq) rq.onclick = startReview;
  $('[data-speed]', el).onclick = startSpeed;
  $$('[data-g]', el).forEach(b => b.onclick = () => lessonSheet(LESSONS[+b.dataset.g]));
  $$('[data-t]', el).forEach(b => b.onclick = () => unitTestSheet(+b.dataset.t));
  $$('[data-ug]', el).forEach(b => b.onclick = () => unitGrammarSheet(+b.dataset.ug));
  const c = $('.node.cur', el); if (c && c.getBoundingClientRect().bottom > innerHeight - 90) setTimeout(() => c.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60);
}
function lessonSheet(L) {
  const p = P(); const stt = nodeState(p, L, currentItem(p)); const u = C.units[L.ui];
  if (stt === 'lock') return toast(unitOpen(p, L.ui) ? '🔒 أكمل الدرس السابق أولاً' : '🔒 اجتز اختبار الوحدة السابقة أولاً');
  sheet(`<div class="sh-ic" style="background:${u.color}">${L.icon}</div><h3>${esc(L.ta)}</h3><p class="muted">${en(L.t)} · الوحدة ${L.ui + 1} · الدرس ${L.li + 1}</p>
    ${p.done[L.id] ? `<p class="pill ok" style="display:inline-block">أكملته ${p.done[L.id]} مرة ✓</p>` : stt === 'skip' ? '<p class="pill" style="display:inline-block">تخطيته باختبار المستوى</p>' : ''}
    <button class="btn" data-go>${p.done[L.id] ? 'تدرّب مجدداً' : 'ابدأ الدرس'}</button><button class="btn ghost" data-gr>📖 شرح القواعد فقط</button>`, (s, close) => {
    $('[data-go]', s).onclick = () => { close(); startLesson(L); };
    $('[data-gr]', s).onclick = () => { close(); showGrammar(L, () => go('home'), true); };
  });
}
function unitGrammarSheet(ui) {
  const ls = LESSONS.filter(l => l.ui === ui);
  sheet(`<h3>📖 قواعد الوحدة ${ui + 1}</h3><p class="muted">${C.units[ui].t}</p><div class="list" style="text-align:start">${ls.map(l => `<button class="row-card" data-l="${l.gi}"><span class="ic">${l.icon}</span><span class="tx"><b>${esc(l.ta)}</b><small class="en">${esc(l.t)}</small></span></button>`).join('')}</div>`, (s, close) => {
    $$('[data-l]', s).forEach(b => b.onclick = () => { close(); showGrammar(LESSONS[+b.dataset.l], () => go('home'), true); });
  });
}
const STRENGTH = [[0, 'جديدة'], [3, 'ضعيفة'], [10, 'متوسطة'], [30, 'جيدة'], [1e9, 'راسخة']];
const strengthOf = c => { const s = c.s || 0; return s < 1.5 ? 0 : s < 3 ? 1 : s < 10 ? 2 : s < 30 ? 3 : 4; };
function tabReview(p, el) {
  const keys = Object.keys(p.srs); const t = today(); const due = dueKeys(p).length;
  const words = keys.filter(isWordKey); const other = keys.length - words.length;
  const buckets = [0, 1, 2, 3, 4].map(b => keys.filter(k => strengthOf(p.srs[k]) === b).length); const mx = Math.max(1, ...buckets);
  const dots = c => { const n = strengthOf(c) + 1; return '●'.repeat(n) + '○'.repeat(5 - n); };
  el.innerHTML = `<div class="card" style="text-align:center"><div style="font-size:52px">🧠</div><h2>المراجعة الذكية</h2>
      <p class="muted">${keys.length ? (due ? `لديك <b class="en">${due}</b> عنصراً مستحقاً للمراجعة اليوم.` : 'لا شيء مستحق الآن، لكن التدريب الإضافي يقوّي ذاكرتك.') : 'أكمل درسك الأول لتبدأ كلماتك بالظهور هنا.'}</p>
      <button class="btn acc" data-rv ${keys.length ? '' : 'disabled'}>ابدأ المراجعة${due ? ` (<span class="en">${Math.min(due, 15)}</span>)` : ''}</button></div>
    <h3 class="sec-h">قوة الحفظ</h3><div class="card"><div class="boxes">${buckets.map((n, i) => `<div class="b"><small class="en">${n}</small><div class="bar" style="height:${n / mx * 100}%;opacity:${0.35 + i * 0.16}"></div><small>${STRENGTH[i][1]}</small></div>`).join('')}</div>
      <p class="muted" style="font-size:13px;margin:12px 0 0">يحسب التطبيق لكل كلمة موعداً خاصاً بها حسب أدائك: الكلمة السهلة تتباعد مراجعتها، وما تخطئ فيه يعود إليك قريباً. ${other ? `ويشمل ذلك <b class="en">${other}</b> جملة وقاعدة أخطأت فيها سابقاً.` : ''}</p></div>
    <h3 class="sec-h">كلماتي (<span class="en">${words.length}</span>)</h3><div class="card" style="max-height:340px;overflow:auto">${words.length ? words.map(k => `<div class="set-row"><span>${en(k)} <small class="muted">— ${esc(VMAP[k] ? VMAP[k].ar : '')}</small></span><span style="display:flex;gap:8px;align-items:center"><span class="pill">${dots(p.srs[k])}</span>${spkBtn(k, 'sm')}</span></div>`).join('') : '<p class="muted">لا توجد كلمات بعد.</p>'}</div>`;
  bindSay(el); const b = $('[data-rv]', el); b.onclick = startReview;
}
function tabTalk(p, el) {
  el.innerHTML = `<div class="card" style="margin-bottom:16px"><b>💬 محادثات واقعية</b><p class="muted" style="margin:4px 0 0">حاور شخصيات في مواقف يومية: اختر الرد المناسب أو انطقه بصوتك، وستحصل على شرح فوري لكل خطأ.</p></div>
    <div class="list">${C.convos.map(c => `<button class="row-card" data-c="${c.id}"><span class="ic">${c.icon}</span><span class="tx"><b>${esc(c.ta)}</b><small>${esc(c.place)} · ${c.turns.length} أدوار</small></span><span class="pill ${p.convos[c.id] ? 'ok' : ''}">${p.convos[c.id] ? '✓ ' : ''}${c.lvl}</span></button>`).join('')}</div>
    ${SR ? '' : '<p class="muted" style="font-size:13px;margin-top:14px">ℹ️ التحدث بالصوت متاح في متصفح Chrome على أندرويد والكمبيوتر، وفي Safari الحديث.</p>'}`;
  $$('[data-c]', el).forEach(b => b.onclick = () => startConvo(C.convos.find(c => c.id === b.dataset.c)));
}
function tabMe(p, el) {
  const days = [...Array(7)].map((_, i) => addDays(today(), i - 6)); const vals = days.map(d => p.xpLog[d] || 0); const mx = Math.max(p.goal, ...vals);
  const DN = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  const doneN = Object.keys(p.done).length;
  el.innerHTML = `<div class="card" style="display:flex;gap:14px;align-items:center"><div style="font-size:56px">${p.avatar}</div><div style="flex:1"><h2>${esc(p.name)}</h2><span class="muted">المستوى <b class="en">${levelLabel(p)}</b> · منذ <span class="en">${fmtDate(p.created)}</span></span></div><button class="btn ghost sm" data-ren>تعديل</button></div>
    <h3 class="sec-h">الإحصائيات</h3><div class="kpis">
      <div class="kpi"><span class="ic">🔥</span><span><b>${streakNow(p)}</b><small>أيام متتالية</small></span></div>
      <div class="kpi"><span class="ic">⭐</span><span><b>${p.xp}</b><small>مجموع XP</small></span></div>
      <div class="kpi"><span class="ic">📗</span><span><b>${doneN}/${LESSONS.length}</b><small>دروس مكتملة</small></span></div>
      <div class="kpi"><span class="ic">📚</span><span><b>${Object.keys(p.srs).filter(isWordKey).length}</b><small>كلمات تعلّمتها</small></span></div>
      <div class="kpi"><span class="ic">🏆</span><span><b>${Object.keys(p.passed).length}/${NU}</b><small>وحدات ناجحة</small></span></div>
      <div class="kpi"><span class="ic">🧠</span><span><b>${dueKeys(p).length}</b><small>مستحق للمراجعة</small></span></div></div>
    <h3 class="sec-h">آخر 7 أيام</h3><div class="card"><div class="week">${days.map((d, i) => { const [y, m, dd] = d.split('-').map(Number); return `<div class="d ${i === 6 ? 'today' : ''}"><span class="v">${vals[i] || ''}</span><div class="bar ${vals[i] ? '' : 'zero'}" style="height:${vals[i] / mx * 100}%"></div><small>${DN[new Date(y, m - 1, dd).getDay()]}</small></div>`; }).join('')}</div></div>
    <h3 class="sec-h">الشارات (${p.badges.length}/${BADGES.length})</h3><div class="badges">${BADGES.map(b => `<div class="badge ${p.badges.includes(b.id) ? '' : 'off'}"><div class="ic">${b.i}</div><b>${b.t}</b><small>${b.d}</small></div>`).join('')}</div>
    <h3 class="sec-h">سجل أخطائي</h3><button class="row-card" data-mist><span class="ic">📋</span><span class="tx"><b>${(p.mistakes || []).length ? `<span class="en">${(p.mistakes || []).length}</span> خطأ محفوظ` : 'لا أخطاء محفوظة بعد'}</b><small>كل سؤال أخطأت فيه مع إجابتك والإجابة الصحيحة</small></span></button>
    <h3 class="sec-h">الإعدادات</h3><div class="card">
      <div class="set-row"><span><b>الهدف اليومي</b><small>${p.goal} XP</small></span><div class="seg">${GOALS.map(g => `<button class="${p.goal === g[0] ? 'on' : ''}" data-goal="${g[0]}">${g[1]}</button>`).join('')}</div></div>
      <div class="set-row"><span><b>تمارين النطق بالميكروفون</b><small>${IN_CLAUDE ? 'غير متاح داخل رابط المعاينة، فيتحول التمرين إلى كتابة' : SR ? 'يحتاج إنترنت، وبدونه يتحول التمرين إلى كتابة' : 'غير مدعوم في هذا المتصفح، فيتحول التمرين إلى كتابة'}</small></span><button class="sw ${p.settings.mic ? 'on' : ''}" data-tg="mic" aria-label="الميكروفون"></button></div>
      <div class="set-row"><span><b>رقم سري لحسابي</b><small>${p.pin ? 'مقفل برقم سري' : 'اختياري: يمنع غيرك من فتح حسابك'}</small></span><button class="btn ghost sm" data-mypin>${p.pin ? 'إزالة' : 'تعيين'}</button></div>
      <div class="set-row"><span><b>أسئلة بمؤقت</b><small>سؤالان بمؤقت 15 ثانية في كل درس</small></span><button class="sw ${p.settings.timer ? 'on' : ''}" data-tg="timer" aria-label="المؤقت"></button></div>
      <div class="set-row"><span><b>المؤثرات الصوتية</b><small>أصوات الإجابة الصحيحة والخاطئة</small></span><button class="sw ${p.settings.sfx ? 'on' : ''}" data-tg="sfx" aria-label="المؤثرات"></button></div>
      <div class="set-row"><span><b>🔊 اختبار الصوت</b><small>إذا لم تسمع صوت القارئ، اضغط هنا لمعرفة السبب والحل</small></span><button class="btn ghost sm" data-snd>اختبار</button></div>
      <div class="set-row"><span><b>سرعة النطق</b><small>صوت القارئ الإنجليزي</small></span><div class="seg">${[[0.7, 'بطيء'], [0.9, 'عادي'], [1.05, 'سريع']].map(r => `<button class="${p.settings.rate === r[0] ? 'on' : ''}" data-rate="${r[0]}">${r[1]}</button>`).join('')}</div></div>
      <div class="set-row"><span><b>المظهر</b></span><div class="seg">${[['auto', 'تلقائي'], ['light', 'فاتح'], ['dark', 'داكن']].map(r => `<button class="${p.settings.theme === r[0] ? 'on' : ''}" data-th="${r[0]}">${r[1]}</button>`).join('')}</div></div>
      <div class="set-row"><span><b>المستوى</b><small>${p.placement ? (p.placement.manual ? 'اخترته بنفسك: ' : 'نتيجة الاختبار: ') + `<span class="en">${p.placement.level}</span>` : 'لم يُحدَّد بعد'}</small></span><span style="display:flex;gap:6px"><button class="btn ghost sm" data-lvl>اختيار</button><button class="btn ghost sm" data-pl>اختبار</button></span></div>
    </div>
    <h3 class="sec-h">الحساب والبيانات</h3><div class="card">
      <div class="set-row"><span><b>${CLOUD.on ? '☁️ المزامنة مفعّلة' : '💾 حفظ محلي'}</b><small>${CLOUD.on ? 'تقدّمك محفوظ في حسابك ويظهر على أي جهاز تفتح منه الرابط' : 'تقدّمك محفوظ على هذا الجهاز. لنقله استخدم «انقل حسابي».'}</small></span></div>
      <div class="set-row"><span><b>📲 انقل حسابي</b><small>ملف صغير ترسله لنفسك، وتفتحه على الجهاز الجديد من «لدي حساب سابق»</small></span><button class="btn acc sm" data-mv>نقل</button></div>
      <div class="set-row"><span><b>تبديل الحساب</b><small><span class="en">${DB.profiles.length}</span> ${DB.profiles.length === 1 ? 'حساب' : 'حسابات'} على هذا الجهاز</small></span><button class="btn ghost sm" data-sw>تبديل</button></div>
      <div class="set-row"><span><b>نسخة احتياطية للجهاز</b><small>كل الحسابات على هذا الجهاز في ملف واحد</small></span><button class="btn ghost sm" data-ex>تصدير</button></div>
      <div class="set-row"><span><b>استيراد</b><small>حساب منقول أو نسخة احتياطية</small></span><button class="btn ghost sm" data-im>استيراد</button></div>
      <div class="set-row"><span><b style="color:var(--bad)">حذف هذا الحساب</b><small>لا يمكن التراجع</small></span><button class="btn ghost sm" data-del style="color:var(--bad)">حذف</button></div>
    </div><p class="muted" style="text-align:center;font-size:12px;margin-top:20px">لِسان · الإصدار <span class="en">2.2</span> · يعمل دون إنترنت بعد التثبيت</p>`;
  const rer = () => { save(); applyTheme(); scrHome(); };
  $$('[data-goal]', el).forEach(b => b.onclick = () => { p.goal = +b.dataset.goal; rer(); });
  $$('[data-tg]', el).forEach(b => b.onclick = () => { const k = b.dataset.tg; p.settings[k] = !p.settings[k]; rer(); });
  $$('[data-rate]', el).forEach(b => b.onclick = () => { p.settings.rate = +b.dataset.rate; save(); say('This is how I sound.'); scrHome(); });
  $$('[data-th]', el).forEach(b => b.onclick = () => { p.settings.theme = b.dataset.th; rer(); });
  $('[data-pl]', el).onclick = startPlacement;
  $('[data-sw]', el).onclick = () => go('profiles');
  $('[data-ex]', el).onclick = exportData;
  $('[data-im]', el).onclick = () => parentGate(importAccount);
  $('[data-mv]', el).onclick = () => exportAccount(p);
  $('[data-snd]', el).onclick = soundCheck;
  $('[data-lvl]', el).onclick = () => chooseLevel(() => scrHome());
  $('[data-mist]', el).onclick = () => { const m = (p.mistakes || []).slice().reverse(); if (!m.length) return toast('لا أخطاء محفوظة بعد 👍'); reviewAnswers(m.map(x => Object.assign({ ok: false }, x)), 'سجل أخطائي', () => scrHome()); };
  const ownGate = fn => p.pin ? pinPad('أكّد برقمك السري', v => { if (hashPin(v) !== p.pin) return false; fn(); }) : fn();
  $('[data-del]', el).onclick = () => ownGate(() => confirmBox(`حذف ملف «${esc(p.name)}» وكل تقدّمه نهائياً؟`, () => { DB.profiles = DB.profiles.filter(x => x.id !== p.id); DB.current = null; save(); go('profiles'); }, 'حذف نهائي'));
  $('[data-mypin]', el).onclick = () => { if (p.pin) ownGate(() => { p.pin = null; rer(); toast('أُزيل القفل'); });  else pinPad('رقم سري لملفك', v => { p.pin = hashPin(v); rer(); toast('🔒 تم قفل الملف'); }); };
  $('[data-ren]', el).onclick = () => sheet(`<h3>تعديل الملف</h3><input class="inp" id="rn" maxlength="20" value="${esc(p.name)}" style="margin:14px 0"><div class="av-grid">${AVATARS.map(a => `<button class="${a === p.avatar ? 'sel' : ''}" data-av="${a}">${a}</button>`).join('')}</div><button class="btn" data-sv>حفظ</button>`, (s, close) => {
    let av = p.avatar; $$('[data-av]', s).forEach(b => b.onclick = () => { av = b.dataset.av; $$('[data-av]', s).forEach(x => x.classList.toggle('sel', x === b)); });
    $('[data-sv]', s).onclick = () => { const n = $('#rn', s).value.trim(); if (n) p.name = n; p.avatar = av; close(); rer(); };
  });
}
async function exportData() {
  const events = await Store.events();
  const json = JSON.stringify({ app: 'lisan', v: 2, exported: new Date().toISOString(), data: DB, events });
  if (IN_CLAUDE) {
    try { const dl = await window.claude.use('downloads'); if (dl) { await dl.save({ filename: `lisan-backup-${today()}.json`, data: json }); toast('✅ تم حفظ النسخة الاحتياطية'); return; } } catch (e) { return; }
    return toast(CLOUD.on ? 'تقدّمك محفوظ تلقائياً في حسابك' : 'التصدير غير متاح هنا');
  }
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `lisan-backup-${today()}.json`; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); toast('✅ تم حفظ النسخة الاحتياطية');
}
/* ---------------- الموجّه ---------------- */
function go(scr, arg) {
  if (CLOUD.pending) { const d = CLOUD.pending; CLOUD.pending = null; if (d.updated > (DB.updated || 0)) cloudApply(d); }
  if (scr === 'profiles') return scrProfiles();
  if (scr === 'home') return P() ? scrHome(arg) : scrProfiles();
}
window.__lisan = { cur: null, get DB() { return DB; }, LESSONS, go, Store };

/* الإقلاع: نقرأ قاعدة البيانات الداخلية، ونأخذ الأحدث بينها وبين النسخة الاحتياطية */
(async () => {
  const idb = await Store.init();
  if (idb && Array.isArray(idb.profiles) && (idb.updated || 0) >= (DB.updated || 0)) { const cur = DB.current; DB = idb; fixDB(); if (cur && DB.profiles.some(p => p.id === cur)) DB.current = cur; }
  else if (DB.profiles.length) Store.saveState(DB); // ترحيل بيانات الإصدار السابق إلى قاعدة البيانات الداخلية
  applyTheme();
  go(DB.current && P() ? 'home' : 'profiles');
  cloudInit();
})();
if (!IN_CLAUDE && 'serviceWorker' in navigator && /^https?:/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => { });
})();
