/* =========================================================
   لِسان — طبقة التخزين (IndexedDB)
   - state  : لقطة كاملة لحالة العائلة (تُحفظ بعد كل تغيير)
   - events : سجل أحداث لا يُحذف (كل إجابة، درس، اختبار…)
              لكل حدث معرّف فريد + علامة synced، ليكون طابور رفع
              للمزامنة السحابية لاحقاً دون فقدان أو تكرار.
   عند تعذّر IndexedDB (وضع التصفح الخاص القديم) نعود لـ localStorage.
   ========================================================= */
(function () {
'use strict';
const NAME = 'lisan', VER = 1;
let db = null, ok = false;

function open() {
  return new Promise(res => {
    try {
      if (!window.indexedDB) return res(null);
      const r = indexedDB.open(NAME, VER);
      r.onupgradeneeded = () => {
        const d = r.result;
        if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
        if (!d.objectStoreNames.contains('events')) {
          const s = d.createObjectStore('events', { keyPath: 'id' });
          s.createIndex('lid', 'lid'); s.createIndex('t', 't'); s.createIndex('synced', 'synced');
        }
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => res(null);
      r.onblocked = () => res(null);
    } catch (e) { res(null); }
  });
}
const tx = (store, mode, fn) => new Promise((res, rej) => {
  try { const t = db.transaction(store, mode); const s = t.objectStore(store); const out = fn(s); t.oncomplete = () => res(out && out.result !== undefined ? out.result : out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); }
  catch (e) { rej(e); }
});

const uid = () => (crypto && crypto.randomUUID) ? crypto.randomUUID() : 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

let pendingState = null, writing = false;
async function flushState() {
  if (writing || !pendingState) return; writing = true;
  const s = pendingState; pendingState = null;
  try { await tx('kv', 'readwrite', st => st.put(s, 'state')); } catch (e) { }
  writing = false; if (pendingState) flushState();
}

window.LisanStore = {
  get ready() { return ok; },
  uid,
  async init() {
    db = await open(); ok = !!db;
    if (!ok) return null;
    try { return await tx('kv', 'readonly', st => st.get('state')); } catch (e) { return null; }
  },
  saveState(obj) { if (!ok) return; try { pendingState = JSON.parse(JSON.stringify(obj)); } catch (e) { return; } flushState(); },
  async addEvent(ev) {
    ev.id = ev.id || uid(); ev.synced = 0;
    if (!ok) { try { const k = 'lisan.events'; const a = JSON.parse(localStorage.getItem(k) || '[]'); a.push(ev); localStorage.setItem(k, JSON.stringify(a.slice(-3000))); } catch (e) { } return ev.id; }
    try { await tx('events', 'readwrite', st => st.put(ev)); } catch (e) { }
    return ev.id;
  },
  async events(lid, sinceMs) {
    if (!ok) { try { return JSON.parse(localStorage.getItem('lisan.events') || '[]').filter(e => (!lid || e.lid === lid) && (!sinceMs || e.t >= sinceMs)); } catch (e) { return []; } }
    try {
      const all = await tx('events', 'readonly', st => lid ? st.index('lid').getAll(lid) : st.getAll());
      return (all || []).filter(e => !sinceMs || e.t >= sinceMs).sort((a, b) => a.t - b.t);
    } catch (e) { return []; }
  },
  async unsynced(limit = 500) {
    if (!ok) return [];
    try { const all = await tx('events', 'readonly', st => st.index('synced').getAll(0)); return (all || []).slice(0, limit); } catch (e) { return []; }
  },
  async markSynced(ids) {
    if (!ok || !ids.length) return;
    try { await tx('events', 'readwrite', st => { ids.forEach(id => { const g = st.get(id); g.onsuccess = () => { const v = g.result; if (v) { v.synced = 1; st.put(v); } }; }); }); } catch (e) { }
  },
  async importEvents(list) {
    if (!ok || !Array.isArray(list)) return;
    try { await tx('events', 'readwrite', st => { list.forEach(e => { if (e && e.id) st.put(e); }); }); } catch (e) { }
  }
};
})();
