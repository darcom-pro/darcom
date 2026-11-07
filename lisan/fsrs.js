/* =========================================================
   لِسان — جدولة المراجعة بخوارزمية FSRS-4.5 (الأوزان الافتراضية)
   البطاقة: { s: الثبات بالأيام, d: الصعوبة 1..10, due, last (YYYY-MM-DD), reps, lapses }
   التقييم: 1 نسي · 2 صعب · 3 جيد · 4 سهل
   الاحتفاظ المستهدف 90%: الفاصل الزمني ≈ الثبات s.
   ========================================================= */
(function () {
'use strict';
const W = [0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755];
const DECAY = -0.5, FACTOR = 19 / 81, RET = 0.9, MAX_IVL = 365;
const clampD = d => Math.min(10, Math.max(1, d));
const dk = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parse = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (k, n) => { const x = parse(k); x.setDate(x.getDate() + n); return dk(x); };
const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);

const R = (t, s) => Math.pow(1 + FACTOR * t / s, DECAY);
const ivl = s => Math.min(MAX_IVL, Math.max(1, Math.round(s / FACTOR * (Math.pow(RET, 1 / DECAY) - 1))));
const d0 = g => clampD(W[4] - (g - 3) * W[5]);
const s0 = g => W[g - 1];
const nextD = (d, g) => clampD(W[7] * d0(3) + (1 - W[7]) * (d - W[6] * (g - 3)));
const sRecall = (d, s, r, g) => s * (Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) * (Math.exp(W[10] * (1 - r)) - 1) * (g === 2 ? W[15] : 1) * (g === 4 ? W[16] : 1) + 1);
const sForget = (d, s, r) => W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r));

window.FSRS = {
  addDays, daysBetween,
  /* أول تقييم لبطاقة جديدة */
  create(g, today) {
    const s = s0(g), d = d0(g);
    return { s, d, reps: 1, lapses: g === 1 ? 1 : 0, last: today, due: g === 1 ? today : addDays(today, ivl(s)) };
  },
  /* تقييم بطاقة موجودة */
  review(c, g, today) {
    if (!c || !c.s) return this.create(g, today);
    const t = Math.max(0, daysBetween(c.last || today, today));
    const r = R(t, c.s);
    const d = nextD(c.d, g);
    const s = g === 1 ? Math.max(0.1, Math.min(c.s, sForget(c.d, c.s, r))) : (t === 0 ? c.s : sRecall(c.d, c.s, r, g));
    return { s, d, reps: (c.reps || 0) + 1, lapses: (c.lapses || 0) + (g === 1 ? 1 : 0), last: today, due: g === 1 ? today : addDays(today, ivl(s)) };
  },
  /* نسبة التذكر المتوقعة اليوم (0..1) */
  retrievability(c, today) { if (!c || !c.s) return 0; return R(Math.max(0, daysBetween(c.last || today, today)), c.s); },
  /* تحويل بطاقات نظام الصناديق القديم */
  fromBox(box, due) { const s = [1, 1, 2, 4, 8, 16][box] || 1; return { s, d: 5, reps: box || 1, lapses: 0, due, last: addDays(due, -Math.round(s)) }; }
};
})();
