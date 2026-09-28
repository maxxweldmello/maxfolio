"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { WorkCompany } from "@/lib/types";
import { buildCards, paletteFor, type CardDef } from "./cards";

/* Explore: every work card scattered across one canvas the size of the view, each at its own image's proportions. Kayana
   Aid sits in the centre and largest, the two Go Digital cards small beneath it, and the rest are spread around with a gap
   between every card. Drag the canvas (not a card) to look around: it repeats in every direction and stays wherever you
   leave it, and "Re-centre" eases back to the composed view. A press that moves is a drag, a press that doesn't is a click. */

const HERO_ID = "kayana-aid";
/* cards that get a little more room from Kayana Aid than the usual gap */
const BREATHE_IDS = ["task-transfer-funds"];
const BREATHE_GAP = 20;
/* the order the Kayana tasks were made in (the Career page order), read left to right, row by row */
const CREATION_ORDER = [
  "Annotation-Driven AOP-Based Centralized Activity Logging",
  "Real-Time Session Management via Socket.IO",
  "Bulk Menu Authoring — ZIP Export / Import",
  "Business Property Creation & Payment Provider Onboarding Workflow (Branch.io)",
  "Business Compliance Review — Approval Workflow, Reason Catalog, Notes & Communications",
  "Stripe Terminal — Location & Reader Management",
  "Stripe Payout Schedule & Listing",
  "Stripe Instant Payout — Request, Compliance Approval & Two-Leg Trigger",
  "Dynamic Platform Payment Fee Configuration",
  "Payment Card Mapping Synchronization using Spring @Async",
  "Knowledge Base Document Management Module posting in AWS S3",
  "Cross-Service Transfer Funds — Admin Trigger, Batch Scheduler, Webhook Reconciliation",
  "Selective Property Notifications — Groups, Schedule, Recurring, Push / SMS / Email",
];
const orderOf = (c: CardDef) => { const i = CREATION_ORDER.findIndex((t) => t.toLowerCase().slice(0, 28) === c.name.toLowerCase().slice(0, 28)); return i < 0 ? 999 : i; };
const SMALL_IDS = ["go-digital-kanban", "go-digital-pim"];

function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Placed = { card: CardDef; x: number; y: number; w: number; h: number; index: number };
type Rect = { x: number; y: number; w: number; h: number };

/* the bottom band holds the Re-centre button, so cards live above it */
const TOP = 20;
const BOTTOM = 76;
const MARGIN = 10; // from the canvas edge, so a card never touches the repeat seam
const GAP = 18;   // minimum space between any two cards

const clampAspect = (a: number | undefined) => Math.min(2.1, Math.max(0.7, a || 1.3));

/* deterministic random scatter, packed like a collage. Every card gets a random size (one hero much bigger, the rest anywhere
   from small to large) at its own image's proportions. Biggest first, each card tries many random spots and takes the one with
   the most clear space around it, shrinking a little if nothing fits, so the cards spread evenly, stay a small gap apart and
   never overlap. */
function attempt(cards: CardDef[], aspects: Record<string, number>, W: number, H: number, scale: number, seed: number, cover = 0.58, minBase = 160): Placed[] | null {
  const rand = rng(seed);
  const x0 = MARGIN, y0 = TOP, x1 = W - MARGIN, y1 = H - BOTTOM;
  const asp = (c: CardDef) => clampAspect(aspects[c.id]);
  const n = cards.length;
  const unit = ((x1 - x0) * (y1 - y0) * cover * scale * scale) / Math.max(1, n); // average area per card

  /* the hero goes first, then the small cards (they need room for their whole title), then the rest biggest first */
  const rank = (c: CardDef) => (c.id === HERO_ID ? 2 : SMALL_IDS.includes(c.id) ? 1 : 0);
  const wants = cards.map((card) => {
    const hero = card.id === HERO_ID, small = SMALL_IDS.includes(card.id);
    const k = hero ? 2.6 : small ? 0.8 : Math.exp((rand() - 0.5) * 1.9); // wide spread of sizes, on a log scale
    return { card, a: asp(card), area: unit * k };
  }).sort((p, q) => rank(q.card) - rank(p.card) || q.area - p.area);

  /* the canvas wraps around (it repeats when dragged), so distances are measured around the seams too */
  const rects: Rect[] = [];
  const out: Placed[] = [];
  const axis = (a: number, aw: number, b: number, bw: number, L: number) => {
    let m = Infinity;
    for (const sh of [-L, 0, L]) m = Math.min(m, Math.max(b + sh - (a + aw), a - (b + sh + bw), 0));
    return m;
  };
  const gapTo = (r: Rect) => {
    let m = Infinity;
    for (const o of rects) {
      const d = Math.hypot(axis(r.x, r.w, o.x, o.w, W), axis(r.y, r.h, o.y, o.h, H));
      if (d < GAP) return -1;
      m = Math.min(m, d);
    }
    return m;
  };

  for (const { card, a, area } of wants) {
    const minW = Math.max(minBase, (minBase * 105 / 160) * a) * scale; // no card smaller than this, so every title is readable
    let w = Math.max(minW, Math.sqrt(area * a));
    let best: Rect | null = null;
    for (let tries = 0; tries < 60 && !best; tries++) {
      let h = w / a;
      if (w > x1 - x0) { w = x1 - x0; h = w / a; }
      if (h > y1 - y0) { h = y1 - y0; w = h * a; }
      if (card.id === HERO_ID) { best = { x: (W - w) / 2, y: y0 + (y1 - y0 - h) / 2, w, h }; break; }
      /* snuggle: of many random spots that fit, take the one closest to its neighbours, so cards pack tight */
      let score = Infinity;
      for (let i = 0; i < 320; i++) {
        const r = { x: x0 + rand() * (x1 - x0 - w), y: y0 + rand() * (y1 - y0 - h), w, h };
        const s = gapTo(r);
        if (s >= 0 && s < score) { score = s; best = r; }
      }
      if (!best) { if (w <= minW * 0.8) break; w *= 0.95; }
    }
    if (!best) return null;
    rects.push(best);
    out.push({ card, ...best, index: 0 });
  }
  return out.map((p, i) => ({ ...p, index: i }));
}

/* try the random scatter at full size; if the cards will not all fit, try other random draws, then slightly smaller cards */
export function layout(cards: CardDef[], aspects: Record<string, number>, W: number, H: number, cover = 0.58, minBase = 160): Placed[] {
  for (let scale = 1; scale >= 0.5; scale -= 0.07)
    for (let t = 0; t < 8; t++) {
      const r = attempt(cards, aspects, W, H, scale, 20260921 + t * 7919, cover, minBase);
      if (r) return r;
    }
  return gridFallback(cards, aspects, W, H);
}

/* let every card (bar the centred hero) drift most of the way towards the nearer edge, into the free space between it and the
   next card or the edge: the upper half rises, the lower half sinks, so no dead space is left at the top or bottom and none
   opens up between cards and the edge. A card never touches its neighbour. The ones nearest the edge move first, so the
   ones behind them see the new room. */
function settle(items: Placed[], H: number): Placed[] {
  const floor = H - BOTTOM, mid = (TOP + floor) / 2, PULL = 0.8;
  const out = items.map((p) => ({ ...p }));
  const inColumn = (c: Placed, o: Placed) => !(c.x >= o.x + o.w + GAP || o.x >= c.x + c.w + GAP);
  const movers = out.filter((c) => c.card.id !== HERO_ID);
  const down = movers.filter((c) => c.y + c.h / 2 >= mid).sort((p, q) => q.y + q.h - (p.y + p.h));
  const up = movers.filter((c) => c.y + c.h / 2 < mid).sort((p, q) => p.y - q.y);
  down.forEach((c) => {
    let free = floor - (c.y + c.h);
    for (const o of out) if (o !== c && o.y >= c.y + c.h - 0.5 && inColumn(c, o)) free = Math.min(free, o.y - (c.y + c.h) - GAP);
    if (free > 0) c.y += free * PULL;
  });
  up.forEach((c) => {
    let free = c.y - TOP;
    for (const o of out) if (o !== c && o.y + o.h <= c.y + 0.5 && inColumn(c, o)) free = Math.min(free, c.y - (o.y + o.h) - GAP);
    if (free > 0) c.y -= free * PULL;
  });
  return out;
}

/* keep Kayana Aid and the Go Digital cards exactly where they are, and deal the other cards into the remaining spots in creation
   order: the spots are read left to right, row by row, and each card is fitted inside its spot at its own picture's shape */
function inOrder(items: Placed[], aspects: Record<string, number>): Placed[] {
  const fixed = (p: Placed) => p.card.id === HERO_ID || SMALL_IDS.includes(p.card.id);
  const spots = items.filter((p) => !fixed(p)).sort((p, q) => Math.round((p.y + p.h / 2) / 200) - Math.round((q.y + q.h / 2) / 200) || p.x - q.x);
  const cards = items.filter((p) => !fixed(p)).map((p) => p.card).sort((c, d) => orderOf(c) - orderOf(d));
  const placed = spots.map((spot, i) => {
    const card = cards[i], a = clampAspect(aspects[card.id]);
    const w = spot.w / spot.h > a ? spot.h * a : spot.w, h = w / a;
    return { card, index: spot.index, w, h, x: spot.x + (spot.w - w) / 2, y: spot.y + (spot.h - h) / 2 };
  });
  return [...items.filter(fixed), ...placed];
}

/* The desktop gallery. Kayana Aid sits at the exact centre and is the only big card. The rest are scattered like a collage: a
   set of evenly spread points around it, and every card grows from its own point at its own picture's shape until it is a medium
   size or meets a neighbour, a small gap away, so the cards vary in size and shape, sit at random and never overlap.
   The points are dealt out in reading order (top row, middle row, bottom row, each left to right) so the cards follow the
   creation order. The last two cards, Cross-Service Transfer Funds and the Go Digital Kanban board, sit at the bottom right
   under Selective Property Notifications; Of many random tries, the one whose smallest card is largest wins. */
function galleryAt(items: Placed[], W: number, hk: number, bigHero?: number): { items: Placed[]; H: number; minW: number } | null {
  const hero = items.find((p) => p.card.id === HERO_ID);
  const pim = items.find((p) => p.card.id === "go-digital-pim"), kan = items.find((p) => p.card.id === "go-digital-kanban");
  if (!hero || !pim || !kan) return null;
  const ord = items.filter((p) => p !== hero && p !== pim && p !== kan).sort((p, q) => orderOf(p.card) - orderOf(q.card));
  if (ord.length !== 13) return null;
  const heroW = bigHero ?? Math.min(560, Math.max(300, W * 0.27)), heroArea = (heroW * heroW) / (hero.w / hero.h);
  /* tall enough for 15 medium cards (about 30000 to 35000 square pixels each) to fit around Kayana Aid at roughly 36% coverage */
  const H = Math.round(Math.max(720, W * 0.46, (heroArea + (30000 * 15) / 0.36) / W) * hk);
  const x0 = MARGIN, x1 = W - MARGIN, y0 = TOP, y1 = H - BOTTOM;
  const area = Math.min(33000, ((W * H - heroArea) * 0.36) / 15);
  const hw = heroW, ha = hero.w / hero.h;
  const heroRect: Rect = { x: (W - hw) / 2, y: (H - hw / ha) / 2, w: hw, h: hw / ha };
  const band = (y: number) => (y < y0 + (y1 - y0) / 3 ? 0 : y < y0 + ((y1 - y0) * 2) / 3 ? 1 : 2);
  const near = (r: Rect, o: Rect) => Math.hypot(Math.max(o.x - (r.x + r.w), r.x - (o.x + o.w), 0), Math.max(o.y - (r.y + r.h), r.y - (o.y + o.h), 0));

  let best: { placed: Placed[]; minW: number } | null = null;
  for (let t = 0; t < 200; t++) {
    const rand = rng(4242 + t * 97);
    /* 15 evenly spread points around Kayana Aid */
    const pts: { x: number; y: number }[] = [];
    for (let k = 0; k < 15; k++) {
      let bp: { x: number; y: number } | null = null, bs = -1;
      for (let i = 0; i < 25; i++) {
        const c = { x: x0 + 70 + rand() * (x1 - x0 - 140), y: y0 + 50 + rand() * (y1 - y0 - 100) };
        if (c.x > heroRect.x - 50 && c.x < heroRect.x + heroRect.w + 50 && c.y > heroRect.y - 50 && c.y < heroRect.y + heroRect.h + 50) continue;
        const d = Math.min(...pts.map((q) => Math.hypot(q.x - c.x, q.y - c.y)), 1e9);
        if (d > bs) { bs = d; bp = c; }
      }
      if (!bp) break;
      pts.push(bp);
    }
    if (pts.length < 15) continue;
    /* the two lowest right-hand points take the last two cards; the right-most middle point takes Selective Property */
    const bottom = pts.filter((q) => band(q.y) === 2).sort((p, q) => q.x - p.x);
    if (bottom.length < 2 || bottom[1].x < W * 0.6) continue;
    const kanPt = bottom[0], crossPt = bottom[1];
    const pimPt = bottom.slice(2).sort((p, q) => p.x - q.x)[0];
    if (!pimPt) continue;
    const rest = pts.filter((q) => q !== kanPt && q !== crossPt && q !== pimPt);
    const mids = rest.filter((q) => band(q.y) === 1).sort((p, q) => q.x - p.x);
    if (!mids.length || mids[0].x < W * 0.6) continue;
    const selPt = mids[0];
    const reading = rest.filter((q) => q !== selPt).sort((p, q) => band(p.y) - band(q.y) || p.x - q.x);
    /* the first two cards start side by side on the top row, the first on the left */
    if (band(reading[0].y) !== 0 || band(reading[1].y) !== 0 || reading[1].x - reading[0].x < 230 || Math.abs(reading[1].y - reading[0].y) > 140) continue;
    const seq: { p: Placed; pt: { x: number; y: number } }[] = [
      ...ord.slice(0, 11).map((p, i) => ({ p, pt: reading[i] })), { p: pim, pt: pimPt },
      { p: ord[12], pt: selPt }, { p: ord[11], pt: crossPt }, { p: kan, pt: kanPt },
    ];
    /* every card grows from its point, a little at a time in turn, until it is medium size or blocked */
    const cards = seq.map(({ p, pt }) => {
      const a = Math.max(0.95, p.w / p.h), tw = Math.max(215, Math.sqrt(area * a * (0.8 + rand() * 0.6)));
      return { p, cx: pt.x, cy: pt.y, a, tw, w: 50, rect: null as Rect | null };
    });
    const others = (c: (typeof cards)[number]) => [heroRect, ...cards.filter((d) => d !== c && d.rect).map((d) => d.rect!)];
    for (let round = 0; round < 200; round++) {
      let grew = false;
      for (const c of cards) {
        if (c.w >= c.tw) continue;
        const nw = Math.min(c.tw, c.w * 1.04 + 1), nh = nw / c.a;
        /* grow around the middle, or if that is blocked, out of one corner into whatever room there is */
        const cur = c.rect ?? { x: c.cx - c.w / 2, y: c.cy - (c.w / c.a) / 2, w: c.w, h: c.w / c.a };
        const tries = [
          { x: cur.x + (cur.w - nw) / 2, y: cur.y + (cur.h - nh) / 2 }, { x: cur.x, y: cur.y }, { x: cur.x + cur.w - nw, y: cur.y },
          { x: cur.x, y: cur.y + cur.h - nh }, { x: cur.x + cur.w - nw, y: cur.y + cur.h - nh },
        ];
        for (const t of tries) {
          const r = { x: Math.min(x1 - nw, Math.max(x0, t.x)), y: Math.min(y1 - nh, Math.max(y0, t.y)), w: nw, h: nh };
          if (others(c).every((o) => near(r, o) >= GAP)) { c.w = nw; c.rect = r; grew = true; break; }
        }
      }
      if (!grew) break;
    }
    if (cards.some((c) => !c.rect)) continue;
    const minW = Math.min(...cards.map((c) => c.rect!.w)); // the smallest card
    if (!best || minW > best.minW) {
      best = { minW, placed: [{ ...hero, ...heroRect }, ...cards.map((c) => ({ ...c.p, ...c.rect! }))] };
      if (minW >= MIN_CARD) break;
    }
  }
  return best ? { items: best.placed, H, minW: best.minW } : null;
}

/* Even out the spacing. Every card (bar Kayana Aid, which stays put) is slid towards Kayana Aid, a little at a time, along one
   axis and then the other, until it meets its neighbour the standard gap away, so the gaps between cards come out the same
   in every direction. The whole group is then scaled up around Kayana Aid to fill the width (gaps and all, so they stay equal),
   and the section is cut to fit it. */
function tighten(items: Placed[], W: number): { items: Placed[]; H: number } {
  const out = items.map((p) => ({ ...p }));
  const hero = out.find((p) => p.card.id === HERO_ID);
  if (!hero) return { items: out, H: 0 };
  const cx = hero.x + hero.w / 2, cy = hero.y + hero.h / 2;
  const movers = out.filter((p) => p !== hero).sort((p, q) => Math.hypot(p.x + p.w / 2 - cx, p.y + p.h / 2 - cy) - Math.hypot(q.x + q.w / 2 - cx, q.y + q.h / 2 - cy));
  const STEP = 30;
  for (let pass = 0; pass < 300; pass++) {
    let moved = false;
    for (const c of movers) {
      const dx = Math.sign(cx - (c.x + c.w / 2)), dy = Math.sign(cy - (c.y + c.h / 2));
      if (dx) {
        let room = Math.min(STEP, Math.abs(cx - (c.x + c.w / 2)));
        for (const o of out) {
          if (o === c || c.y - GAP >= o.y + o.h || o.y - GAP >= c.y + c.h) continue;
          if (dx > 0 && o.x >= c.x + c.w - 0.5) room = Math.min(room, o.x - (c.x + c.w) - GAP);
          if (dx < 0 && o.x + o.w <= c.x + 0.5) room = Math.min(room, c.x - (o.x + o.w) - GAP);
        }
        if (room > 0.5) { c.x += dx * room; moved = true; }
      }
      if (dy) {
        let room = Math.min(STEP, Math.abs(cy - (c.y + c.h / 2)));
        for (const o of out) {
          if (o === c || c.x - GAP >= o.x + o.w || o.x - GAP >= c.x + c.w) continue;
          if (dy > 0 && o.y >= c.y + c.h - 0.5) room = Math.min(room, o.y - (c.y + c.h) - GAP);
          if (dy < 0 && o.y + o.h <= c.y + 0.5) room = Math.min(room, c.y - (o.y + o.h) - GAP);
        }
        if (room > 0.5) { c.y += dy * room; moved = true; }
      }
    }
    if (!moved) break;
  }
  const minX = Math.min(...out.map((p) => p.x)), maxX = Math.max(...out.map((p) => p.x + p.w));
  const minY = Math.min(...out.map((p) => p.y)), maxY = Math.max(...out.map((p) => p.y + p.h));
  const half = Math.max(cx - minX, maxX - cx);
  const k = Math.min(1.2, Math.max(1, (W / 2 - MARGIN) / half));
  const scaled = out.map((p) => ({ ...p, x: W / 2 + (p.x - cx) * k, y: TOP + (p.y - minY) * k, w: p.w * k, h: p.h * k }));
  return { items: scaled, H: Math.ceil((maxY - minY) * k + TOP + BOTTOM) };
}

/* the first two cards in the sequence share one row, the first on the left and the second beside it, tops level: whichever can
   move up or down to match the other does so, without coming within the gap of any other card */
function firstRow(items: Placed[]): Placed[] {
  const out = items.map((p) => ({ ...p }));
  const a = out.find((p) => orderOf(p.card) === 0), b = out.find((p) => orderOf(p.card) === 1);
  if (!a || !b) return out;
  /* how far c can move vertically (dy > 0 down) before it is within the gap of another card */
  const allow = (c: Placed, dy: number) => {
    let m = Math.abs(dy);
    for (const o of out) {
      if (o === c || c.x - GAP >= o.x + o.w || o.x - GAP >= c.x + c.w) continue;
      if (dy > 0 && o.y >= c.y + c.h - 0.5) m = Math.min(m, o.y - (c.y + c.h) - GAP);
      if (dy < 0 && o.y + o.h <= c.y + 0.5) m = Math.min(m, c.y - (o.y + o.h) - GAP);
    }
    return Math.max(0, m) * Math.sign(dy);
  };
  if (a.x > b.x) { const sa = { x: a.x, y: a.y, w: a.w, h: a.h }, sb = { x: b.x, y: b.y, w: b.w, h: b.h };
    const fit = (p: Placed, slot: Rect) => { const r = p.w / p.h; let w = slot.w, h = w / r; if (h > slot.h) { h = slot.h; w = h * r; } Object.assign(p, { x: slot.x + (slot.w - w) / 2, y: slot.y + (slot.h - h) / 2, w, h }); };
    fit(a, sb); fit(b, sa); }
  for (let i = 0; i < 4 && Math.abs(a.y - b.y) > 1; i++) {
    b.y += allow(b, a.y - b.y);
    a.y += allow(a, b.y - a.y);
  }
  return out;
}

/* every card takes its own picture's true shape. Each card's spot stays exactly where it is: the picture's shape is fitted inside
   its box and centred in it, so tall pictures come out narrower and nothing moves or overlaps. */
function trueShape(items: Placed[], aspects: Record<string, number>): Placed[] {
  return items.map((p) => {
    const a = aspects[p.card.id];
    if (!a) return p;
    let w = p.w, h = w / a;
    if (h > p.h) { h = p.h; w = h * a; }
    return { ...p, x: p.x + (p.w - w) / 2, y: p.y + (p.h - h) / 2, w, h };
  });
}

/* Two cards trade places, and nothing else moves. The first takes the other's exact box (its picture cropped to fit); the second takes the first's spot at its own
   picture's shape, centred on it, then grows towards its old size for as long as it stays the gap away from every other card and
   inside the canvas. */
function swapCards(items: Placed[], aspects: Record<string, number>, idA: string, idB: string, W: number): Placed[] {
  const out = items.map((p) => ({ ...p }));
  const a = out.find((p) => p.card.id === idA), b = out.find((p) => p.card.id === idB);
  if (!a || !b) return out;
  const spot = { a: { x: a.x, y: a.y, w: a.w, h: a.h }, b: { x: b.x, y: b.y, w: b.w, h: b.h } };
  const gap = (r: Rect, skip: Placed[]) => out.every((o) => skip.includes(o) || Math.hypot(Math.max(o.x - (r.x + r.w), r.x - (o.x + o.w), 0), Math.max(o.y - (r.y + r.h), r.y - (o.y + o.h), 0)) >= GAP);
  const settle1 = (c: Placed, into: Rect, want: number, others: Placed[]) => {
    const r = aspects[c.card.id] || c.w / c.h, cx = into.x + into.w / 2, cy = into.y + into.h / 2;
    let w = into.w, h = w / r;
    if (h > into.h) { h = into.h; w = h * r; }
    const ok = (nw: number, nh: number) => {
      const rect = { x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh };
      return rect.x >= MARGIN && rect.x + nw <= W - MARGIN && rect.y >= TOP && gap(rect, [a, b, ...others]) ? rect : null;
    };
    while (w * h < want) { const nw = w * 1.02, nh = nw / r; if (!ok(nw, nh)) break; w = nw; h = nh; }
    Object.assign(c, { x: cx - w / 2, y: cy - h / 2, w, h });
  };
  Object.assign(a, spot.b); // boxed in by its neighbours, so a portrait picture would come out tiny: it takes the other card's box exactly, its picture cropped to fit
  settle1(b, spot.a, spot.b.w * spot.b.h, [a]);
  return out;
}

/* make one card a little bigger without moving any other: it grows by up to `by` times its width, keeping its shape, from its middle
   or failing that out of one corner, as far as it stays the gap away from every other card and inside the canvas */
function growCard(items: Placed[], id: string, by: number, W: number): Placed[] {
  const out = items.map((p) => ({ ...p }));
  const c = out.find((p) => p.card.id === id);
  if (!c) return out;
  const w0 = c.w;
  const clear = (r: Rect) =>
    r.x >= MARGIN && r.x + r.w <= W - MARGIN && r.y >= TOP &&
    out.every((o) => o === c || Math.hypot(Math.max(o.x - (r.x + r.w), r.x - (o.x + o.w), 0), Math.max(o.y - (r.y + r.h), r.y - (o.y + o.h), 0)) >= GAP);
  while (c.w < w0 * by) {
    const nw = c.w * 1.02, nh = nw * (c.h / c.w);
    const tries = [
      { x: c.x + (c.w - nw) / 2, y: c.y + (c.h - nh) / 2 }, { x: c.x, y: c.y }, { x: c.x + c.w - nw, y: c.y },
      { x: c.x, y: c.y + c.h - nh }, { x: c.x + c.w - nw, y: c.y + c.h - nh },
    ];
    const t = tries.find((q) => clear({ x: q.x, y: q.y, w: nw, h: nh }));
    if (!t) break;
    Object.assign(c, { x: t.x, y: t.y, w: nw, h: nh });
  }
  return out;
}

/* two cards trade places and nothing else moves: each takes the other's exact box, its picture cropped to fit */
function swapPositions(items: Placed[], idA: string, idB: string): Placed[] {
  const out = items.map((p) => ({ ...p }));
  const a = out.find((p) => p.card.id === idA), b = out.find((p) => p.card.id === idB);
  if (!a || !b) return out;
  const ra = { x: a.x, y: a.y, w: a.w, h: a.h };
  Object.assign(a, { x: b.x, y: b.y, w: b.w, h: b.h });
  Object.assign(b, ra);
  return out;
}

/* a group of cards made one bigger size, all exactly the same: the size starts at the largest of them (smaller if they cannot all
   take it) and grows a step at a time, each card from its own middle or failing that out of a corner, until one of them would come
   within the gap of another card or the canvas edge, or they are `by` times the largest one's width. Nothing else moves. */
/* a group of cards made bigger, all exactly the same size (`by` times the largest one's width, each from its own middle). The cards
   round them ease aside just enough to keep the standard gap: overlapping pairs are pushed apart along the shorter way, Kayana Aid stays put, the group gives way
   only a little, and the pushing carries on outwards until nothing is closer than the gap. */
function enlargeGroup(items: Placed[], ids: string[], by: number, W: number): Placed[] {
  const out = items.map((p) => ({ ...p }));
  const group = ids.map((id) => out.find((p) => p.card.id === id)).filter((p): p is Placed => !!p);
  if (!group.length) return out;
  const nw = Math.max(...group.map((c) => c.w)) * by, ratio = group[0].h / group[0].w, nh = nw * ratio;
  group.forEach((c) => Object.assign(c, { x: c.x + c.w / 2 - nw / 2, y: c.y + c.h / 2 - nh / 2, w: nw, h: nh }));
  /* how readily a card gives way: Kayana Aid never, the enlarged group only a little, every other card fully */
  const give = (p: Placed) => (p.card.id === HERO_ID ? 0 : group.includes(p) ? 0.25 : 1);
  for (let pass = 0; pass < 1500; pass++) {
    let any = false;
    for (let i = 0; i < out.length; i++)
      for (let j = i + 1; j < out.length; j++) {
        const a = out[i], b = out[j];
        if (!give(a) && !give(b)) continue;
        const gx = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w)), gy = Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h));
        if (gx >= GAP || gy >= GAP) continue;
        any = true;
        const alongX = gx >= gy, need = GAP - (alongX ? gx : gy) + 0.5;
        const dir = alongX ? Math.sign(b.x + b.w / 2 - (a.x + a.w / 2)) || 1 : Math.sign(b.y + b.h / 2 - (a.y + a.h / 2)) || 1;
        const shareA = give(a) / (give(a) + give(b));
        const move = (c: Placed, d: number) => { if (alongX) c.x += d; else c.y += d; };
        move(a, -dir * need * shareA); move(b, dir * need * (1 - shareA));
      }
    out.forEach((c) => { if (give(c)) { c.x = Math.min(W - MARGIN - c.w, Math.max(MARGIN, c.x)); c.y = Math.max(TOP, c.y); } });
    if (!any) break;
  }
  return out;
}

/* true when no two cards are closer than the standard gap (a hair of slack for rounding) */
function spaced(items: Placed[]): boolean {
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j];
      if (Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w)) < GAP - 1 && Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h)) < GAP - 1) return false;
    }
  return true;
}

/* enlarge the group as much as it can be while every card stays the full gap from every other: if pushing the neighbours aside does
   not settle, a smaller enlargement is tried, down to none */
function enlargeGroupSafe(items: Placed[], ids: string[], by: number, W: number): Placed[] {
  for (let f = by; f > 1.005; f -= 0.03) {
    const r = enlargeGroup(items, ids, f, W);
    if (spaced(r)) return r;
  }
  return items;
}

/* nudge one card down by up to `dy`, no more than the free room beneath it allows, keeping its size, shape and place across; every
   other card stays where it is */
function nudgeDown(items: Placed[], id: string, dy: number): Placed[] {
  const out = items.map((p) => ({ ...p }));
  const c = out.find((p) => p.card.id === id);
  if (!c) return out;
  let room = dy;
  for (const o of out) if (o !== c && !(c.x >= o.x + o.w + GAP || o.x >= c.x + c.w + GAP) && o.y >= c.y + c.h - 0.5) room = Math.min(room, o.y - (c.y + c.h) - GAP);
  c.y += Math.max(0, room);
  return out;
}

/* no card is allowed to end up small: if the cards will not all reach MIN_CARD wide, try again on a taller canvas */
const MIN_CARD = 195;
function gallery(items: Placed[], W: number, bigHero?: number): { items: Placed[]; H: number } | null {
  let best: ReturnType<typeof galleryAt> = null;
  for (const hk of [1, 1.08, 1.16, 1.25]) {
    const r = galleryAt(items, W, hk, bigHero);
    if (r && (!best || r.minW > best.minW)) best = r;
    if (best && best.minW >= MIN_CARD) break;
  }
  return best;
}

/* give the BREATHE_IDS cards a little more room from the hero by sliding each one directly away from it, only as far as needed
   and only if it stays clear of every other card and inside the canvas; every other card stays exactly where it is */
function breathe(items: Placed[], W: number, H: number): Placed[] {
  const out = items.map((p) => ({ ...p }));
  const hero = out.find((p) => p.card.id === HERO_ID);
  if (!hero) return out;
  const clear = (c: Placed) =>
    c.x >= MARGIN && c.x + c.w <= W - MARGIN && c.y >= TOP && c.y + c.h <= H - BOTTOM &&
    out.every((o) => o === c || Math.hypot(Math.max(o.x - (c.x + c.w), c.x - (o.x + o.w), 0), Math.max(o.y - (c.y + c.h), c.y - (o.y + o.h), 0)) >= GAP);
  out.filter((c) => BREATHE_IDS.includes(c.card.id)).forEach((c) => {
    const gx = Math.max(hero.x - (c.x + c.w), c.x - (hero.x + hero.w)), gy = Math.max(hero.y - (c.y + c.h), c.y - (hero.y + hero.h));
    if (Math.max(gx, gy) >= BREATHE_GAP) return;
    const tries: [number, number][] = [];
    if (gx >= gy) tries.push([(c.x + c.w / 2 < hero.x + hero.w / 2 ? -1 : 1) * (BREATHE_GAP - gx), 0], [0, (c.y + c.h / 2 < hero.y + hero.h / 2 ? -1 : 1) * (BREATHE_GAP - gy)]);
    else tries.push([0, (c.y + c.h / 2 < hero.y + hero.h / 2 ? -1 : 1) * (BREATHE_GAP - gy)], [(c.x + c.w / 2 < hero.x + hero.w / 2 ? -1 : 1) * (BREATHE_GAP - gx), 0]);
    for (const [dx, dy] of tries) {
      const { x, y } = c;
      c.x += dx; c.y += dy;
      if (clear(c)) return;
      c.x = x; c.y = y;
    }
    /* boxed in: keep the far edges where they are and pull the edge that faces the hero back by the missing room, at the same shape */
    const need = BREATHE_GAP - Math.max(gx, gy), k = gx >= gy ? (c.w - need) / c.w : (c.h - need) / c.h;
    const nw = c.w * k, nh = c.h * k;
    if (gx >= gy && c.x + c.w / 2 >= hero.x + hero.w / 2) c.x += c.w - nw;
    if (gx < gy && c.y + c.h / 2 >= hero.y + hero.h / 2) c.y += c.h - nh;
    c.w = nw; c.h = nh;
  });
  return out;
}

/* the canvas is far too small for a scatter: an even grid, so nothing overlaps or is lost */
function gridFallback(cards: CardDef[], aspects: Record<string, number>, W: number, H: number): Placed[] {
  const aw = W - MARGIN * 2, ah = H - TOP - BOTTOM;
  const cols = Math.ceil(Math.sqrt((cards.length * aw) / ah)), rows = Math.ceil(cards.length / cols);
  const cw = aw / cols, ch = ah / rows;
  return cards.map((c, i) => {
    const a = clampAspect(aspects[c.id]);
    const w = Math.min(cw - 20, (ch - 20) * a), h = w / a;
    return { card: c, index: i, w, h, x: MARGIN + (i % cols) * cw + (cw - w) / 2, y: TOP + Math.floor(i / cols) * ch + (ch - h) / 2 };
  });
}

/* Phones and tablets: no dragging, an ordinary scrolling page. Kayana Aid runs full width at the top, then the cards follow in
   creation order in two or three staggered columns, each dropped into the shortest column, at a slightly different width and
   offset so it still reads as a collage. Nothing overlaps and nothing runs past the edge of the screen. */
function stackLayout(cards: CardDef[], aspects: Record<string, number>, W: number): { W: number; H: number; items: Placed[] } {
  const rand = rng(20260921);
  const pad = 16, cols = W < 600 ? 2 : 3, colW = (W - pad * 2 - GAP * (cols - 1)) / cols;
  const asp = (c: CardDef) => Math.min(1.7, Math.max(0.8, clampAspect(aspects[c.id])));
  const hero = cards.find((c) => c.id === HERO_ID);
  const rank = (c: CardDef) => (SMALL_IDS.includes(c.id) ? 1 : 0);
  const rest = cards.filter((c) => c !== hero).sort((p, q) => rank(p) - rank(q) || orderOf(p) - orderOf(q));
  const items: Placed[] = [];
  let y = 24;
  if (hero) {
    const w = W - pad * 2, h = Math.min(w / asp(hero), 420);
    items.push({ card: hero, index: 0, x: pad, y, w, h });
    y += h + GAP;
  }
  const heights = Array.from({ length: cols }, () => y);
  rest.forEach((card) => {
    const c = heights.indexOf(Math.min(...heights));
    const w = colW * (0.84 + rand() * 0.16), h = w / asp(card);
    items.push({ card, index: items.length, x: pad + c * (colW + GAP) + rand() * (colW - w), y: heights[c] + rand() * 14, w, h });
    heights[c] = items[items.length - 1].y + h + GAP;
  });
  return { W, H: Math.ceil(Math.max(...heights) + 24), items };
}

/* The whole desktop arrangement for a canvas W wide: the scatter, the creation order, Kayana Aid in the centre, the even gaps and the
   hand adjustments. It is a function of its own so the phone version can lay its canvas out in exactly the same way. */
/* The arrangement was tuned with a Product Information Management card in it. That card is gone, but its place is kept as an empty
   stand-in while the cards are laid out, so every other card stays exactly where it was, and the stand-in is dropped afterwards. */
const STAND_IN_ID = "go-digital-pim", STAND_IN_ASPECT = 1.5;

export function desktopPack(cards: CardDef[], aspects: Record<string, number>, W: number, phone = false): { W: number; H: number; items: Placed[] } {
  if (cards.some((c) => c.id === STAND_IN_ID)) return packCards(cards, aspects, W, phone);
  const stand: CardDef = { kind: "project", id: STAND_IN_ID, name: "", company: "" };
  const r = packCards([...cards, stand], { ...aspects, [STAND_IN_ID]: STAND_IN_ASPECT }, W, phone);
  return { ...r, items: r.items.filter((p) => p.card.id !== STAND_IN_ID) };
}

function packCards(cards: CardDef[], aspects: Record<string, number>, W: number, phone: boolean): { W: number; H: number; items: Placed[] } {
  const lh = Math.max(560, Math.round((cards.length * 66000) / W) + TOP + BOTTOM);
  const base = layout(cards, aspects, W, lh);
  /* on a phone the cards are left at their normal size (no enlarged group) */
  const rows = gallery(base, W);
  if (rows) { const t = tighten(rows.items, W); const shaped = swapPositions(growCard(swapCards(trueShape(firstRow(t.items), aspects), aspects, "go-digital-pim", "task-transfer-funds", W), "task-payment-fee", phone ? 1 : 1.25, W), "task-transfer-funds", "task-card-mapping"); const fin = nudgeDown(phone ? shaped : enlargeGroupSafe(shaped, ["task-stripe-terminal", "task-stripe-payout-schedule", "task-stripe-instant-payout"], 1.25, W), "task-auth-session", 60); return { W, H: Math.max(t.H, Math.ceil(Math.max(...fin.map((p) => p.y + p.h)) + BOTTOM)), items: fin }; }
  const raw = breathe(inOrder(settle(base, lh), aspects), W, lh);
  const top = Math.min(...raw.map((p) => p.y)), bottom = Math.max(...raw.map((p) => p.y + p.h));
  return { W, H: Math.ceil(bottom - top + TOP + BOTTOM), items: raw.map((p) => ({ ...p, y: p.y - top + TOP })) };
}

export function Tile({ p, focusable }: { p: Placed; focusable: boolean }) {
  const { card } = p;
  const project = card.kind === "project";
  const pal = paletteFor(p.index);
  const img = card.image;
  const href = project ? `/work/${card.id}` : card.pageHref ?? `/tasks/${card.id}`;
  const label = project ? card.company : card.projectName;
  const light = !!img || project || pal.bg === "#0a0a0a";
  const hero = card.id === HERO_ID;
  const compact = project && !hero;
  const titleSize = compact ? 13 : project ? Math.max(14, Math.min(34, p.w * 0.085)) : Math.max(12, Math.min(15, p.w * 0.062));
  const pad = hero ? 26 : 14;
  const showLabel = p.h > 90;
  const lines = Math.max(1, Math.min(hero ? 3 : 5, Math.floor((p.h - pad * 2 - (showLabel ? 22 : 0)) / (titleSize * (project ? 1.05 : 1.25)))));
  return (
    <Link
      href={href}
      prefetch={false}
      draggable={false}
      tabIndex={focusable ? 0 : -1}
      aria-hidden={focusable ? undefined : true}
      className="explore-card"
      style={{
        position: "absolute", left: p.x, top: p.y, width: p.w, height: p.h,
        display: "flex", flexDirection: "column", justifyContent: "flex-end",
        padding: pad, overflow: "hidden", textDecoration: "none",
        background: img ? `url(${img}) center/cover no-repeat #0a0a0a` : project ? "#0a0a0a" : pal.bg,
        color: light ? "#fff" : pal.color,
        border: img || project ? "none" : pal.border,
      }}
    >
      {(img || project) && (
        <span style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.78) 100%)", pointerEvents: "none" }} />
      )}
      <span style={{ position: "relative" }}>
        {showLabel && <span style={{ display: "block", fontSize: hero ? 10 : 8, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.75, marginBottom: hero ? 10 : 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>}
        <span
          style={{
            display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: compact ? "unset" : lines, overflow: "hidden",
            fontFamily: hero ? "var(--font-display)" : "var(--font-sans)",
            fontSize: titleSize,
            fontWeight: hero ? 800 : compact ? 400 : 500, lineHeight: hero ? 1.05 : 1.25, letterSpacing: hero ? "-0.02em" : "-0.01em",
          }}
        >
          {card.name}
        </span>
      </span>
    </Link>
  );
}

export default function ExploreView({ companies }: { companies: WorkCompany[] }) {
  const cards = useMemo(() => buildCards(companies), [companies]);
  const stageRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [grabbing, setGrabbing] = useState(false);
  const [aspects, setAspects] = useState<Record<string, number> | null>(null);

  /* read each image's own proportions first, so every card can be drawn at its picture's shape */
  useEffect(() => {
    let live = true;
    const load = (c: CardDef) =>
      new Promise<[string, number]>((resolve) => {
        if (!c.image) return resolve([c.id, 1.3]);
        const img = new Image();
        img.onload = () => resolve([c.id, img.naturalWidth / img.naturalHeight || 1.3]);
        img.onerror = () => resolve([c.id, 1.3]);
        img.src = c.image;
      });
    const timeout = new Promise<null>((r) => setTimeout(() => r(null), 3500));
    Promise.race([Promise.all(cards.map(load)), timeout]).then(async (res) => {
      const found = res ?? [];
      const map: Record<string, number> = Object.fromEntries(found);
      if (live) setAspects(map);
    });
    return () => { live = false; };
  }, [cards]);

  /* on a wide view the canvas is as wide as the view and only as tall as the cards need, so there is no dead space above or
     below; on a phone it is a fixed size larger than the view, so you drag to see the rest */
  const desktop = !!size && size.w >= 900;
  const packed = useMemo(() => {
    if (!size || !aspects) return null;
    if (!desktop) return stackLayout(cards, aspects, size.w);
    return desktopPack(cards, aspects, size.w);
  }, [cards, size, aspects, desktop]);
  const world = useMemo(() => (packed ? { W: packed.W, H: packed.H } : null), [packed]);
  const items = packed?.items ?? null;
  const stageH = packed ? packed.H : undefined;

  const worldRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const vel = useRef({ x: 0, y: 0 });
  const raf = useRef(0);
  const drag = useRef<{ sx: number; sy: number; lx: number; ly: number; lt: number; moved: boolean } | null>(null);
  const suppress = useRef(false);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const apply = () => {
    const el = worldRef.current;
    if (!el || !world) return;
    if (!desktop) { el.style.transform = "none"; return; }
    const mx = ((pos.current.x % world.W) + world.W) % world.W;
    const my = ((pos.current.y % world.H) + world.H) % world.H;
    el.style.transform = `translate3d(${mx - world.W}px, ${my - world.H}px, 0)`;
  };
  useEffect(() => { pos.current = { x: 0, y: 0 }; apply(); }, [world]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(apply); // eslint-disable-line react-hooks/exhaustive-deps

  /* keep gliding after release, slowing to a stop */
  const glide = () => {
    const step = () => {
      vel.current = { x: vel.current.x * 0.94, y: vel.current.y * 0.94 };
      if (Math.abs(vel.current.x) < 0.15 && Math.abs(vel.current.y) < 0.15) return;
      pos.current.x += vel.current.x; pos.current.y += vel.current.y;
      apply();
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };

  /* ease to the nearest composed view, where every card is whole */
  const recentre = () => {
    if (!world) return;
    cancelAnimationFrame(raf.current);
    const tx = Math.round(pos.current.x / world.W) * world.W;
    const ty = Math.round(pos.current.y / world.H) * world.H;
    const sx = pos.current.x, sy = pos.current.y, t0 = performance.now(), dur = 600;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      pos.current = { x: sx + (tx - sx) * e, y: sy + (ty - sy) * e };
      apply();
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.lx, dy = e.clientY - d.ly;
      const now = performance.now(), dt = Math.max(1, now - d.lt);
      pos.current.x += dx; pos.current.y += dy;
      vel.current = { x: (dx / dt) * 16 * 0.6 + vel.current.x * 0.4, y: (dy / dt) * 16 * 0.6 + vel.current.y * 0.4 };
      d.lx = e.clientX; d.ly = e.clientY; d.lt = now;
      if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 5) d.moved = true;
      apply();
    };
    const up = () => {
      const d = drag.current;
      if (!d) return;
      drag.current = null;
      setGrabbing(false);
      if (d.moved) {
        suppress.current = true;
        setTimeout(() => { suppress.current = false; }, 60);
        glide();
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const down = (e: React.PointerEvent) => {
    if (!desktop) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-explore-ui]")) return;
    cancelAnimationFrame(raf.current);
    vel.current = { x: 0, y: 0 };
    drag.current = { sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY, lt: performance.now(), moved: false };
    setGrabbing(true);
  };
  const key = (e: React.KeyboardEvent) => {
    if (!desktop) return;
    const step = 160;
    const d = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key];
    if (!d) return;
    e.preventDefault();
    cancelAnimationFrame(raf.current);
    pos.current.x += d[0]; pos.current.y += d[1];
    apply();
    vel.current = { x: 0, y: 0 };
  };

  return (
    <div
      ref={stageRef}
      data-tour="work-board"
      role="region"
      aria-label={desktop ? "Work, drag to explore" : "Work"}
      tabIndex={0}
      onPointerDown={down}
      onKeyDown={key}
      onClickCapture={(e) => { if (suppress.current) { e.preventDefault(); e.stopPropagation(); } }}
      style={{
        position: "relative", zIndex: 0, width: "100vw", marginLeft: "calc(50% - 50vw)",
        height: stageH ?? "min(82vh, 800px)", overflow: "hidden",
        background: "var(--paper-raised)", cursor: desktop ? (grabbing ? "grabbing" : "grab") : "auto",
        touchAction: desktop ? "none" : "pan-y", userSelect: "none", outline: "none",
      }}
    >
      <style>{`
        .explore-card { transition: transform .25s ease, box-shadow .25s ease; }
        .explore-recentre {
          position: absolute; right: 22px; bottom: 18px; z-index: 100; display: inline-flex; align-items: center; gap: 9px;
          padding: 10px 18px 10px 14px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.14); background: #0a0a0a; color: #fff;
          font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; cursor: pointer;
          box-shadow: 0 10px 26px -10px rgba(0,0,0,0.55); transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
        }
        .explore-recentre:hover { transform: translateY(-2px); background: #1a1a1a; box-shadow: 0 16px 30px -10px rgba(0,0,0,0.6); }
        .explore-recentre svg { transition: transform .35s ease; }
        .explore-recentre:hover svg { transform: rotate(90deg); }
        .explore-card:hover { transform: scale(1.03); box-shadow: 0 18px 40px -16px rgba(0,0,0,.45); z-index: 30 !important; }
      `}</style>
      {world && items && (
        <div ref={worldRef} style={{ position: "absolute", left: 0, top: 0, width: world.W * (desktop ? 3 : 1), height: world.H * (desktop ? 3 : 1), willChange: "transform" }}>
          {(desktop ? [0, 1, 2] : [1]).flatMap((ty) =>
            (desktop ? [0, 1, 2] : [1]).map((tx) => (
              <div key={`${tx}-${ty}`} style={{ position: "absolute", left: (desktop ? tx : 0) * world.W, top: (desktop ? ty : 0) * world.H, width: world.W, height: world.H }}>
                {items.map((p) => <Tile key={p.card.id} p={p} focusable={tx === 1 && ty === 1} />)}
              </div>
            ))
          )}
        </div>
      )}

      {desktop && <button
        type="button"
        data-explore-ui
        onClick={recentre}
        className="mono explore-recentre"
        aria-label="Re-centre the view"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          <circle cx="12" cy="12" r="8.5" />
        </svg>
        Re-centre
      </button>}
    </div>
  );
}
