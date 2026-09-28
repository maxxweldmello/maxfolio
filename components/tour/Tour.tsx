"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";

export type TourStep = {
  /* the page this step belongs to */
  path: string;
  /* CSS selector of the part of the page to point at; a comma-separated list rings each part */
  target: string;
  title: string;
  body: string;
  /* the home menu is open while this step shows */
  menu?: boolean;
  /* CSS selector of something to press when the tour moves on from this step */
  click?: string;
  /* nothing is drawn over the page for this step: it only scrolls the page slowly down to the bottom, then the tour moves on */
  silent?: boolean;
  scroll?: "bottom";
  /* ring the text itself, as tight as its lines, rather than the whole block it sits in (which can run under a picture beside it) */
  text?: boolean;
  /* the target turns up more than once (the board repeats its cards): ring only the copy that shows most */
  one?: boolean;
  /* the step is left out where its part is not on the page (a button that only wide screens have) */
  skipIfMissing?: boolean;
  /* the step shows the board being dragged: the tour pulls it about by itself */
  drag?: boolean;
};

type Box = { x: number; y: number; w: number; h: number };

const KEY = "siteTour";     // the step the tour is on, kept for the length of the visit so it carries on from page to page
const PAD = 10;             // room between the highlighted part and its ring
const RADIUS = 18;
const CARD_W = 340;
const STEP_MS = 5000;       // each step stays this long, then the tour moves on by itself

const SCOPE = "siteTourScope"; // "all" when the tour was started from Home and runs through every page; otherwise the one page it was started on
const readScope = (): string => { try { return sessionStorage.getItem(SCOPE) ?? "all"; } catch { return "all"; } };
const writeScope = (v: string | null) => { try { if (v === null) sessionStorage.removeItem(SCOPE); else sessionStorage.setItem(SCOPE, v); } catch { /* storage can be off */ } };

const read = (): number | null => { try { const v = sessionStorage.getItem(KEY); return v === null ? null : Number(v); } catch { return null; } };
const write = (i: number | null) => { try { if (i === null) sessionStorage.removeItem(KEY); else sessionStorage.setItem(KEY, String(i)); } catch { /* storage can be off */ } };

/* the parts a step points at. Where the page repeats a part (the board loops its cards), a step marked `one` takes the copy nearest the
   middle of the screen, so it is the same copy that is scrolled to and ringed */
function targetsOf(step: TourStep): HTMLElement[] {
  const all = Array.from(document.querySelectorAll<HTMLElement>(step.target));
  if (!step.one || all.length < 2) return all;
  const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
  const dist = (el: HTMLElement) => { const r = el.getBoundingClientRect(); return Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy); };
  return [all.reduce((m, el) => (dist(el) < dist(m) ? el : m))];
}

/* the clear window in the blurred page, as a rounded rectangle path (the same shape as the ring) */
function roundedHole(b: Box) {
  const x = b.x - PAD, y = b.y - PAD, w = b.w + PAD * 2, h = b.h + PAD * 2, r = Math.min(RADIUS, w / 2, h / 2);
  return `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 -${r} ${r}h-${w - 2 * r}a${r} ${r} 0 0 1 -${r} -${r}v-${h - 2 * r}a${r} ${r} 0 0 1 ${r} -${r}Z`;
}

/**
 * A guided tour that runs across the site. It blurs the page, rings one part of it and shows a white card beside it; it moves on by
 * itself every few seconds, presses links and buttons for you, and carries on into the next page. Arrow buttons at the bottom right
 * go back and forward by hand. A round floating button (bobbing slowly, like a wave) starts it, and it can start by itself when a
 * page is opened.
 */
export default function Tour({ steps, label = "Site tour", autoStartDelay = 3600, phoneBottom = "44px", fab = true, fabTone = "light", phoneTopRight = false, phoneTop = "24px", phoneRight = "26px", fabInNav = false, phoneNavBottom = "76px" }: {
  steps: TourStep[]; label?: string; autoStartDelay?: number | null; phoneBottom?: string; fab?: boolean;
  /* "light" is a white button, for a dark page; "dark" is a black one, for a light page */
  fabTone?: "light" | "dark";
  /* on a phone the button sits small in the top right corner instead of the bottom left */
  phoneTopRight?: boolean;
  /* on phones and tablets the site's bottom tab bar carries the "?" button (it sends "site-tour:start"), so the floating one is hidden there */
  fabInNav?: boolean;
  /* on a phone the back and forward arrows sit at the bottom right, this far up so they clear the bottom tab bar */
  phoneNavBottom?: string;
  phoneTop?: string;
  phoneRight?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<number | null>(null);
  const [finished, setFinished] = useState<"all" | "page" | null>(null);   // the "that's the end" note, shown when a tour runs all the way out
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [vp, setVp] = useState({ w: 1200, h: 800 });
  const advanceRef = useRef<() => void>(() => {});
  const scope = useRef("all");
  const startRef = useRef<() => void>(() => {});   // starts the tour from where the visitor is; the tab bar's button reaches it by an event
  const dir = useRef(1);   // which way the tour last moved, so a skipped step is passed in the same direction

  useEffect(() => setMounted(true), []);

  /* on arriving at a page, once the page loader has gone: carry on a tour that is under way, or start one by itself */
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let poll: ReturnType<typeof setInterval> | undefined;
    const begin = () => {
      const at = read();
      scope.current = readScope();
      if (at !== null) {
        if (steps[at] && steps[at].path === pathname) setStep(at); else { write(null); writeScope(null); }
        return;
      }
      if (autoStartDelay == null || steps[0]?.path !== pathname) return;
      timer = setTimeout(() => { if (read() === null) { scope.current = "all"; writeScope("all"); write(0); setStep(0); } }, Math.min(autoStartDelay, 1200));
    };
    /* the loader is a white screen over the page; the tour waits until it has faded out and been removed */
    poll = setInterval(() => {
      if (document.querySelector("[data-page-loader]")) return;
      clearInterval(poll);
      timer = setTimeout(begin, 350);
    }, 100);
    return () => { clearInterval(poll); clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const end = useCallback(() => { write(null); writeScope(null); setStep(null); }, []);
  /* the tour ran out of steps: end it and say so */
  const finish = useCallback(() => {
    const kind = scope.current === "all" ? "all" : "page";
    write(null); writeScope(null); setStep(null); setFinished(kind);
  }, []);
  useEffect(() => {
    if (!finished) return;
    const t = setTimeout(() => setFinished(null), 9200);
    return () => clearTimeout(t);
  }, [finished]);

  /* to step i: on this page it just shows; on another page it goes there, and that page's tour carries on */
  const go = useCallback((i: number) => {
    if (i < 0) return;
    if (i >= steps.length) return finish();
    /* a tour started on one page stays on that page: it ends there, and does not go back to another one */
    if (scope.current !== "all" && steps[i].path !== scope.current) { if (step !== null && i > step) finish(); return; }
    dir.current = step !== null && i < step ? -1 : 1;
    write(i);
    if (steps[i].path !== pathname) { setStep(null); router.push(steps[i].path); } else setStep(i);
  }, [steps, pathname, router, finish, step]);

  const advance = useCallback(() => {
    if (step === null) return;
    const cur = steps[step];
    const el = cur.click ? document.querySelector<HTMLElement>(cur.click) : null;
    if (el) {
      const nextPath = steps[step + 1]?.path;
      if (nextPath && nextPath !== pathname) write(step + 1);   // the page changes: the next page's tour picks up from here
      el.click();
      if (!nextPath || nextPath === pathname) setTimeout(() => go(step + 1), 900);
      return;
    }
    go(step + 1);
  }, [step, steps, pathname, go]);
  advanceRef.current = advance;

  /* each step stays a few seconds, then moves on */
  useEffect(() => {
    if (step === null || steps[step].scroll) return;      // the scrolling step moves on when the scroll ends
    const t = setTimeout(() => advanceRef.current(), STEP_MS);
    return () => clearTimeout(t);
  }, [step, steps]);

  /* a step whose part is not on this page is passed over */
  useEffect(() => {
    if (step === null || !steps[step].skipIfMissing) return;
    const t = setTimeout(() => {
      const shown = targetsOf(steps[step]).some((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
      if (!shown) go(step + dir.current);
    }, 350);
    return () => clearTimeout(t);
  }, [step, steps, go]);

  /* the home menu open or shut as the step wants it */
  useEffect(() => {
    if (step === null) return;
    const strip = document.querySelector<HTMLElement>('[data-tour="journey"]');
    if (!strip) return;
    const open = strip.getAttribute("aria-expanded") === "true";
    if (steps[step].menu && !open) strip.click();
    if (!steps[step].menu && open) window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  }, [step, steps]);

  /* the highlighted part's place, followed frame by frame, so the window keeps up with a part that is still moving (the menu sliding
     in, a smooth scroll); the card waits until the part has stopped */
  const lastSig = useRef("");
  const settleT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    lastSig.current = "";
    setSettled(false);
    setBoxes([]);
    if (step === null || steps[step].silent) return;
    let raf = 0;
    const tick = () => {
      const next: Box[] = [];
      targetsOf(steps[step]).forEach((el) => {
        let r = el.getBoundingClientRect();
        if (steps[step].text) {
          const range = document.createRange();
          range.selectNodeContents(el);
          const t = range.getBoundingClientRect();
          if (t.width > 0 && t.height > 0) r = t;
        }
        /* keep the ring inside the screen when the part is taller than it */
        const x = Math.max(r.left, PAD), y = Math.max(r.top, PAD);
        const w = Math.min(r.right, window.innerWidth - PAD) - x, h = Math.min(r.bottom, window.innerHeight - PAD) - y;
        if (w > 0 && h > 0) next.push({ x, y, w, h });
      });
      const sig = next.map((b) => `${Math.round(b.x)},${Math.round(b.y)},${Math.round(b.w)},${Math.round(b.h)}`).join("|");
      if (sig !== lastSig.current) {
        lastSig.current = sig;
        setBoxes(next);
        setSettled(false);
        if (settleT.current) clearTimeout(settleT.current);
        settleT.current = setTimeout(() => setSettled(true), 250);
      }
      setVp((v) => (v.w === window.innerWidth && v.h === window.innerHeight ? v : { w: window.innerWidth, h: window.innerHeight }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    /* a step whose part never turns up still shows its card */
    const fallback = setTimeout(() => setSettled(true), 1500);
    return () => { cancelAnimationFrame(raf); clearTimeout(fallback); if (settleT.current) clearTimeout(settleT.current); };
  }, [step, steps]);

  /* a box round all the ringed parts, which is what the card is placed against */
  const box: Box | null = boxes.length
    ? (() => {
        const x = Math.min(...boxes.map((b) => b.x)), y = Math.min(...boxes.map((b) => b.y));
        return { x, y, w: Math.max(...boxes.map((b) => b.x + b.w)) - x, h: Math.max(...boxes.map((b) => b.y + b.h)) - y };
      })()
    : null;

  /* the silent step: scroll the page slowly to its bottom, then move on */
  useEffect(() => {
    if (step === null || !steps[step].scroll) return;
    let raf = 0, start: ReturnType<typeof setTimeout> | undefined, next: ReturnType<typeof setTimeout> | undefined;
    /* it starts from the top of the page, waits a moment, then scrolls slowly and evenly to the bottom */
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });   // the page may smooth-scroll by default, which would fight a scroll set every frame
    start = setTimeout(() => {
      const to = document.documentElement.scrollHeight - window.innerHeight;
      const ms = Math.min(45000, Math.max(8000, (to / 260) * 1000));
      const t0 = performance.now();
      const tick = (now: number) => {
        const k = Math.min(1, (now - t0) / ms);
        window.scrollTo({ top: to * k, behavior: "instant" as ScrollBehavior });
        if (k < 1) raf = requestAnimationFrame(tick); else next = setTimeout(() => advanceRef.current(), 900);
      };
      raf = requestAnimationFrame(tick);
    }, 1800);
    return () => { cancelAnimationFrame(raf); if (start) clearTimeout(start); if (next) clearTimeout(next); };
  }, [step, steps]);

  /* the drag step: press on the board, pull it across and up, let go, and it glides on */
  useEffect(() => {
    if (step === null || !steps[step].drag) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let raf = 0;
    timers.push(setTimeout(() => {
      const stage = document.querySelector<HTMLElement>(steps[step].target);
      if (!stage) return;
      const r = stage.getBoundingClientRect();
      const sx = r.left + r.width * 0.62, sy = r.top + Math.min(r.height, window.innerHeight) * 0.5;
      const fire = (type: string, x: number, y: number, target: EventTarget) =>
        target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, pointerType: "mouse", isPrimary: true }));
      /* two pulls: left and up, then back the other way, each with the press, the move and the release of a real drag */
      const pull = (fromX: number, fromY: number, dx: number, dy: number, dur: number, done: () => void) => {
        fire("pointerdown", fromX, fromY, stage);
        const t0 = performance.now();
        const tick = (now: number) => {
          const k = Math.min(1, (now - t0) / dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          fire("pointermove", fromX + dx * e, fromY + dy * e, window);
          if (k < 1) raf = requestAnimationFrame(tick); else { fire("pointerup", fromX + dx, fromY + dy, window); done(); }
        };
        raf = requestAnimationFrame(tick);
      };
      pull(sx, sy, -420, -160, 1300, () => {
        timers.push(setTimeout(() => pull(sx - 420, sy - 160, 300, 120, 900, () => {}), 500));
      });
    }, 900));
    return () => { timers.forEach(clearTimeout); cancelAnimationFrame(raf); };
  }, [step, steps]);

  /* bring a part that is off screen into view */
  useEffect(() => {
    if (step === null || steps[step].silent) return;
    const t = setTimeout(() => {
      const el = targetsOf(steps[step])[0];
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      /* how much of the part is on screen, against how much of it could be (the fixed bar at the top takes about 90px) */
      const shown = Math.min(r.bottom, vh - 24) - Math.max(r.top, 90), could = Math.min(r.height, vh - 90 - 24);   // room is kept for the ring round it
      if (shown >= could - 2) return;
      /* a short hop scrolls smoothly; a long way back (from the bottom of the page) jumps, so the part is found at once */
      const far = r.top < -vh * 1.5 || r.top > vh * 2.5;
      const behavior: ScrollBehavior = far ? "auto" : "smooth";
      const top = r.height <= vh - 90
        ? window.scrollY + r.top - (vh - r.height) / 2       // a part that fits: centre it
        : window.scrollY + r.top - 90;                       // a tall part: its top just under the bar
      window.scrollTo({ top: Math.max(0, top), behavior });
    }, 250);
    return () => clearTimeout(t);
  }, [step, steps]);

  useEffect(() => {
    if (step === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (!e.isTrusted) return;               // the tour's own key press that shuts the menu is not the visitor's
      if (e.key === "Escape") end();
      if (e.key === "ArrowRight") advanceRef.current();
      if (e.key === "ArrowLeft") go(step - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, end, go]);

  /* the bottom tab bar's "?" button asks for the tour to start */
  useEffect(() => {
    const on = () => startRef.current();
    window.addEventListener("site-tour:start", on);
    return () => window.removeEventListener("site-tour:start", on);
  }, []);

  if (!mounted) return null;

  /* started from Home, the tour runs through every page; started from any other page, it runs that page's steps only */
  const startHere = () => {
    const first = Math.max(0, steps.findIndex((st) => st.path === pathname));
    scope.current = pathname === steps[0]?.path ? "all" : pathname;
    writeScope(scope.current);
    go(first);
  };
  startRef.current = startHere;
  const cur = step === null ? null : steps[step];
  /* when the ringed part covers most of the screen there is nothing left to blur, so the page is left clear and only the ring is drawn */
  const big = !!box && (box.w * box.h) / (vp.w * vp.h) > 0.45;
  const small = vp.w < 640;
  const cardW = Math.min(CARD_W, vp.w - 24);
  const CARD_H = 210;

  /* the card goes beside the highlighted part where there is room, otherwise above or below it */
  let card: React.CSSProperties = { left: Math.max(12, (vp.w - cardW) / 2), bottom: 90 };
  if (box) {
    const ring = { x: box.x - PAD, y: box.y - PAD, w: box.w + PAD * 2, h: box.h + PAD * 2 };
    const below = vp.h - (ring.y + ring.h), above = ring.y;
    if (big && !small) card = { left: Math.max(12, vp.w - cardW - 28), top: 96 };            // over a part that fills the screen: the top right corner
    else if (!small && vp.w - (ring.x + ring.w) >= cardW + 24) card = { left: ring.x + ring.w + 16, top: Math.min(Math.max(12, ring.y), vp.h - CARD_H - 12) };
    else if (!small && ring.x >= cardW + 24) card = { left: ring.x - cardW - 16, top: Math.min(Math.max(12, ring.y + ring.h / 2 - CARD_H / 2), vp.h - CARD_H - 12) };
    else if (below >= CARD_H + 24) card = { left: Math.max(12, Math.min(ring.x, vp.w - cardW - 12)), top: ring.y + ring.h + 16 };
    else if (above >= CARD_H + 24) card = { left: Math.max(12, Math.min(ring.x, vp.w - cardW - 12)), top: ring.y - CARD_H - 16 };
  }

  const pill: React.CSSProperties = {
    width: 62, height: 40, borderRadius: 999, border: 0, cursor: "pointer", background: "#fff", color: "#000", fontSize: 18, lineHeight: 1,
    display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
  };

  return createPortal(
    <>
      <style>{`
        @keyframes tour-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes tour-bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-14px) } }
        @keyframes tour-wave { 0% { transform: scale(1); opacity: 0.55 } 100% { transform: scale(2.1); opacity: 0 } }
        @media (max-width: 639px) { .tour-fab { bottom: var(--tour-phone-bottom, 44px) !important; } .tour-nav { bottom: var(--tour-nav-bottom, 76px) !important; right: 16px !important; } }
        .tour-fab { position: fixed; left: clamp(28px, 3.2vw, 56px); bottom: clamp(36px, 5vh, 64px); z-index: 9990; width: 56px; height: 56px; animation: tour-bob 3.6s ease-in-out infinite; }
        .tour-fab button { position: relative; z-index: 1; width: 100%; height: 100%; border-radius: 50%; border: 0; cursor: pointer; background: #fff; color: #000;
          box-shadow: 0 8px 26px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; font: 500 20px/1 var(--font-mono, ui-monospace, monospace); }
        .tour-fab button:hover { background: #ececec; }
        .tour-fab i { position: absolute; inset: 0; border-radius: 50%; border: 1px solid rgba(255,255,255,0.75); animation: tour-wave 3.6s ease-out infinite; }
        .tour-fab i + i { animation-delay: 1.8s; }
        @keyframes tour-bob-s { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-5px) } }
        @keyframes tour-wave-s { 0% { transform: scale(1); opacity: 0.5 } 100% { transform: scale(1.7); opacity: 0 } }
        @media (max-width: 639px) {
          .tour-fab-tr { left: auto !important; right: var(--tour-tr-right, 26px); top: var(--tour-tr-top, 24px); bottom: auto !important; width: 34px; height: 34px; animation-name: tour-bob-s; }
          .tour-fab-tr button { font-size: 15px; box-shadow: 0 4px 14px rgba(0,0,0,0.35); }
          .tour-fab-tr i { animation-name: tour-wave-s; }
        }
        @media (max-width: 1023px) { .tour-fab-innav { display: none !important; } }
        .tour-fab-dark button { background: #000; color: #fff; }
        .tour-fab-dark button:hover { background: #262626; }
        .tour-fab-dark i { border-color: rgba(0,0,0,0.6); }
        @media (prefers-reduced-motion: reduce) { .tour-fab, .tour-fab i { animation: none; } }

        /* the page behind the tour: blurred, dimmed and grainy, with a clear window over the part being pointed at */
        .tour-veil { position: fixed; inset: 0; z-index: 10000; background: rgba(0,0,0,0.32); backdrop-filter: blur(7px) saturate(0.8); -webkit-backdrop-filter: blur(7px) saturate(0.8); animation: tour-fade 0.3s ease both; }
        .tour-veil::after { content: ""; position: absolute; inset: 0; opacity: 0.5; mix-blend-mode: overlay; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E"); background-size: 200px 200px; }

        /* the frame round the highlighted part: a rounded hairline */
        .tour-frame { position: fixed; z-index: 10000; pointer-events: none; border: 1.5px solid rgba(255,255,255,0.9); border-radius: ${RADIUS}px; animation: tour-fade 0.3s ease both; }

        /* the card: flat, white, softly rounded */
        .tour-card { position: fixed; z-index: 10001; font-family: var(--font-sans, system-ui); animation: tour-fade 0.3s ease both; }
        .tour-in { position: relative; background: #fff; color: #000; padding: 22px 24px 24px; border-radius: 28px; border: 2px dashed #000; box-shadow: 0 0 0 1px rgba(255,255,255,0.55); }   /* a dashed black border; the thin white line outside it keeps the edge clear on a dark page */
        .tour-card h3 { margin: 0; padding-right: 32px; font-family: var(--font-display, serif); font-size: 30px; line-height: 1; font-weight: 500; letter-spacing: -0.02em; color: #000; }
        .tour-card p { margin: 12px 0 0; font-size: 14.5px; line-height: 1.65; color: rgba(0,0,0,0.62); }
        .tour-card .x { position: absolute; top: 14px; right: 14px; width: 28px; height: 28px; border: 0; background: transparent; cursor: pointer; color: rgba(0,0,0,0.5); font-size: 18px; line-height: 1; }
        .tour-card .x:hover { color: #000; }
        /* the closing card, like the end of a film: the page blurs and dims, black bars close in top and bottom, and the credits come up one line at a time */
        .tour-end { position: fixed; inset: 0; z-index: 10003; display: flex; align-items: center; justify-content: center; cursor: default;
          background: rgba(0,0,0,0.5); backdrop-filter: blur(12px) saturate(0.8); -webkit-backdrop-filter: blur(12px) saturate(0.8);
          animation: tour-end-life 9s ease both; font-family: var(--font-sans, system-ui); }
        .tour-end::after { content: ""; position: absolute; inset: 0; opacity: 0.45; mix-blend-mode: overlay; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E"); background-size: 200px 200px; }
        @keyframes tour-end-life { 0% { opacity: 0 } 6% { opacity: 1 } 92% { opacity: 1 } 100% { opacity: 0 } }
        .tour-end .bar { position: absolute; left: 0; right: 0; height: clamp(38px, 9vh, 90px); background: #000; }
        .tour-end .bar.t { top: 0; animation: tour-bar-t 1s cubic-bezier(.7,0,.2,1) both; }
        .tour-end .bar.b { bottom: 0; animation: tour-bar-b 1s cubic-bezier(.7,0,.2,1) both; }
        @keyframes tour-bar-t { from { transform: translateY(-100%) } to { transform: translateY(0) } }
        @keyframes tour-bar-b { from { transform: translateY(100%) } to { transform: translateY(0) } }
        /* the closing scene: the poster in the middle, "The" to its left and "End." to its right, curved bracket corners round the picture,
           and ornament lines on the black bars above and below */
        .tour-end .stage { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: clamp(20px, 4.5vw, 64px);
          width: min(1180px, calc(100vw - 32px)); padding: 0 clamp(0px, 1vw, 12px); color: #fff; }
        .tour-end .frame { position: relative; margin: 0 clamp(14px, 2vw, 26px); }
        .tour-end .frame img { display: block; height: min(64dvh, 560px); aspect-ratio: 1059 / 1486; width: auto; max-width: 100%; object-fit: contain; background: #000;
          border: 1px solid rgba(255,255,255,0.28); box-shadow: 0 30px 90px rgba(0,0,0,0.7); }
        .tour-end .frame svg.cn { position: absolute; width: 30px; height: 30px; fill: none; stroke: rgba(255,255,255,0.85); stroke-width: 1.4; stroke-linecap: round; }
        .tour-end .frame svg.tl { top: -14px; left: -14px; } .tour-end .frame svg.tr { top: -14px; right: -14px; transform: scaleX(-1); }
        .tour-end .frame svg.bl { bottom: -14px; left: -14px; transform: scaleY(-1); } .tour-end .frame svg.br { bottom: -14px; right: -14px; transform: scale(-1, -1); }
        .tour-end .line { opacity: 0; animation: tour-line 1s ease both; }
        @keyframes tour-line { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        .tour-end .side { display: flex; flex-direction: column; justify-content: center; gap: clamp(14px, 2.4vh, 24px); }
        .tour-end .side.l { align-items: flex-end; text-align: right; }
        .tour-end .word { font-family: var(--font-display, serif); font-weight: 500; font-size: clamp(3.4rem, 8.4vw, 7.4rem); line-height: 0.9; letter-spacing: -0.04em; text-shadow: 0 6px 40px rgba(0,0,0,0.6); }
        .tour-end .sub { margin: 0; max-width: 24ch; font-size: 14px; line-height: 1.7; color: rgba(255,255,255,0.75); }
        .tour-end .cred { display: grid; gap: 9px; font: 400 10px/1.5 var(--font-mono, ui-monospace, monospace); letter-spacing: 0.24em; text-transform: uppercase; color: rgba(255,255,255,0.45); }
        .tour-end .cred b { display: block; font-weight: 400; color: rgba(255,255,255,0.92); letter-spacing: 0.2em; }
        .tour-end .kick { font: 400 10px/1 var(--font-mono, ui-monospace, monospace); letter-spacing: 0.38em; text-transform: uppercase; color: rgba(255,255,255,0.55); }
        .tour-end .bar { display: flex; align-items: center; justify-content: center; gap: 14px; }
        .tour-end .orn { width: clamp(70px, 14vw, 170px); height: 14px; stroke: rgba(255,255,255,0.5); fill: none; stroke-width: 1; }
        .tour-end .orn.r { transform: scaleX(-1); }
        .tour-end .hint { font: 400 10.5px/1.4 var(--font-mono, ui-monospace, monospace); letter-spacing: 0.32em; text-transform: uppercase; color: rgba(255,255,255,0.72); text-align: center; }
        @media (max-width: 860px) {
          .tour-end .stage { gap: 10px; }
          .tour-end .frame img { height: min(52dvh, 420px); }
          .tour-end .word { font-size: clamp(2.2rem, 11vw, 3.6rem); }
          .tour-end .sub, .tour-end .cred, .tour-end .kick { display: none; }
          .tour-end .frame { margin: 0 6px; }
          .tour-end .orn { width: 44px; }
          .tour-end .hint { letter-spacing: 0.2em; font-size: 9.5px; }
        }
        .tour-nav { position: fixed; right: 20px; bottom: 20px; z-index: 10002; display: flex; gap: 8px; }
        .tour-nav button:hover:not(:disabled) { background: #ececec; }
        .tour-nav button:disabled { opacity: 0.35; cursor: default; }
      `}</style>

      {finished && (
        <div className="tour-end" role="status" onClick={() => setFinished(null)}>
          <div className="bar t">
            <svg className="orn" viewBox="0 0 170 14" aria-hidden><path d="M0 7 H130 C140 7 142 2 150 2 C158 2 160 7 170 7" /></svg>
            <span className="kick line" style={{ animationDelay: "0.8s" }}>Fin</span>
            <svg className="orn r" viewBox="0 0 170 14" aria-hidden><path d="M0 7 H130 C140 7 142 2 150 2 C158 2 160 7 170 7" /></svg>
          </div>
          <div className="stage">
            <div className="side l">
              <span className="word line" style={{ animationDelay: "1s" }}>The</span>
              <p className="sub line" style={{ animationDelay: "1.9s" }}>
                {finished === "all" ? "Thanks for taking the whole tour, from the first arrow to the last line of the résumé." : "Thanks for looking around. That's everything this page has to show."}
              </p>
            </div>
            <div className="frame">
              <img src="/tour/demo.webp" alt="" />
              <svg className="cn tl" viewBox="0 0 30 30" aria-hidden><path d="M2 28 V13 C2 6.8 6.8 2 13 2 H28" /></svg>
              <svg className="cn tr" viewBox="0 0 30 30" aria-hidden><path d="M2 28 V13 C2 6.8 6.8 2 13 2 H28" /></svg>
              <svg className="cn bl" viewBox="0 0 30 30" aria-hidden><path d="M2 28 V13 C2 6.8 6.8 2 13 2 H28" /></svg>
              <svg className="cn br" viewBox="0 0 30 30" aria-hidden><path d="M2 28 V13 C2 6.8 6.8 2 13 2 H28" /></svg>
            </div>
            <div className="side r">
              <span className="word line" style={{ animationDelay: "1.5s" }}>End.</span>
              <div className="cred line" style={{ animationDelay: "2.4s" }}>
                <span>Written &amp; built by<b>Maxwel D&apos;Mello</b></span>
                <span>Shot entirely<b>in production</b></span>
              </div>
            </div>
          </div>
          <div className="bar b">
            <svg className="orn" viewBox="0 0 170 14" aria-hidden><path d="M0 7 H130 C140 7 142 12 150 12 C158 12 160 7 170 7" /></svg>
            <span className="hint line" style={{ animationDelay: "3s" }}>Press ? to watch it again</span>
            <svg className="orn r" viewBox="0 0 170 14" aria-hidden><path d="M0 7 H130 C140 7 142 12 150 12 C158 12 160 7 170 7" /></svg>
          </div>
        </div>
      )}

      {fab && step === null && (
        <div className={`tour-fab${fabTone === "dark" ? " tour-fab-dark" : ""}${phoneTopRight ? " tour-fab-tr" : ""}${fabInNav ? " tour-fab-innav" : ""}`} style={{ ["--tour-phone-bottom" as string]: phoneBottom, ["--tour-tr-top" as string]: phoneTop, ["--tour-tr-right" as string]: phoneRight } as React.CSSProperties}>
          <i /><i />
          <button type="button" aria-label={`Start the ${label.toLowerCase()}`} title={label} onClick={startHere}>?</button>
        </div>
      )}

      {cur && !cur.silent && (
        <>
          {/* the blurred, grainy page; a clear window is cut over the highlighted part, and a click anywhere ends the tour */}
          {big && box ? (() => {
            /* a part that fills most of the screen: the blurred page is drawn as four bands round it, so the part itself stays clear */
            const x0 = Math.max(0, box.x - PAD), y0 = Math.max(0, box.y - PAD);
            const x1 = Math.min(vp.w, box.x + box.w + PAD), y1 = Math.min(vp.h, box.y + box.h + PAD);
            const bands: React.CSSProperties[] = [
              { left: 0, top: 0, width: vp.w, height: y0 },
              { left: 0, top: y1, width: vp.w, height: Math.max(0, vp.h - y1) },
              { left: 0, top: y0, width: x0, height: Math.max(0, y1 - y0) },
              { left: x1, top: y0, width: Math.max(0, vp.w - x1), height: Math.max(0, y1 - y0) },
            ];
            return bands.map((st, i) => <div key={`band-${step}-${i}`} aria-hidden className="tour-veil" onClick={end} style={{ inset: "auto", ...st }} />);
          })() : (
            <div
              aria-hidden
              key={`veil-${step}`}
              className="tour-veil"
              onClick={end}
              style={!boxes.length ? { background: "transparent", backdropFilter: "none", WebkitBackdropFilter: "none" } : boxes.length ? { clipPath: `path(evenodd, "M0 0H${vp.w}V${vp.h}H0Z ${boxes.map(roundedHole).join(" ")}")` } : undefined}
            />
          )}
          {boxes.map((b, i) => (
            <div key={`frame-${step}-${i}`} aria-hidden className="tour-frame" style={{ left: b.x - PAD, top: b.y - PAD, width: b.w + PAD * 2, height: b.h + PAD * 2 }} />
          ))}
          {settled && <div key={`card-${step}`} className="tour-card" role="dialog" aria-modal="true" aria-label={label} style={{ width: cardW, ...card }}>
            <div className="tour-in">
              <button type="button" className="x" aria-label="End the tour" onClick={end}>×</button>
              <h3>{cur.title}</h3>
              <p>{cur.body}</p>
            </div>
          </div>}
        </>
      )}
      {cur && (
        <>
          <div className="tour-nav" style={{ ["--tour-nav-bottom" as string]: phoneNavBottom } as React.CSSProperties}>
            <button type="button" style={pill} aria-label="Previous" disabled={step === 0 || (scope.current !== "all" && steps[step! - 1]?.path !== scope.current)} onClick={() => go(step! - 1)}>←</button>
            <button type="button" style={pill} aria-label="Next" onClick={advance}>→</button>
          </div>
        </>
      )}
    </>,
    document.body
  );
}
