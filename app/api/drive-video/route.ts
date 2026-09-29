import { NextRequest, NextResponse } from "next/server";

/**
 * Streams a video out of Google Drive.
 *
 * Google's usercontent responses carry `Cross-Origin-Resource-Policy:
 * same-site`, which makes browsers silently refuse to play/fetch them when
 * embedded from a different origin (this app) — a redirect to Drive's URL
 * doesn't work around that. So this proxies the bytes through instead: same
 * origin as far as the browser is concerned, no CORP block.
 *
 * Files under Drive's ~100MB virus-scan threshold serve directly. Larger
 * files return an HTML interstitial gated behind a `confirm` + `uuid` pair
 * minted fresh per request, resolved here before the real fetch.
 *
 * Forwards the browser's Range header through to Drive and mirrors back
 * whatever status/headers Drive responds with (206 partial content when
 * ranged), so seeking/scrubbing works.
 *
 * `id` is restricted to the known set of video ids this site actually
 * embeds — this proxy would otherwise let anyone serve arbitrary Drive
 * content (including attacker-controlled HTML) from our own origin.
 *
 * Usage: /api/drive-video?id=<Drive file id>
 */
const ALLOWED_IDS = new Set([
  "11RQqVyA__WgJUJ8gsaTED8iVzkIkcDU0", // task-auth-session
  "1vQOGf12n_xD-A2tdzTByH_QmLvy53AZB", // task-menus
  "1FjDR5X9ppYEDU2rK_BeS2UqfAtEC7SE6", // task-property-onboarding
  "1yPgSA8LGa-OTFevNBgVrYupVY1djozcv", // task-compliance
  "1wJvDLGcvh_7pcDVBOx1_y3seAPrmqakW", // task-stripe-payout-schedule
  "1-lvktE-TPGqsoYYMHVMeZbIJJdYj7afQ", // task-stripe-instant-payout (1)
  "14tkX-XkLAXKWsgjVlIIMniIvuHRno90Q", // task-stripe-instant-payout (2)
  "1gBfTatO8tl7-TOBaxRSar8hrLgRXBO5s", // task-payment-fee
  "1OHH_dQqfH2AFC5cx5udqYvUWtftCQMoR", // task-card-mapping
  "1QtPf2ftaRaGCxRpJrOgrk4oI39v5JEH0", // task-knowledge-base
  "1fdKBCckqxIw_0MXgxWbxoA3TxY8To8ZS", // task-transfer-funds
  "1JR4z_z-KF3bKSZ-61tz7FkkZdM70Fpd6", // task-selective-notifications
  "1mPumUtXGo2PZsmoATHmgjL67yTOY8B-g", // task-selective-notifications screenshot-1
  "1G3dh90U5jZ62bzaS6nvuqs6Q15FIJGGT", // kayana-aid campaign
  "1bwuv8jJea2lEemFK30cEl2ZodpOkWMky", // kayana-aid custom-domain
  "1qS9IZNrA5Z7rpcRM1S6zFXntfRMCVOed", // kayana-aid donation-dashboard
  "1c4WzKEZ8-eonUZripmvh-sg9lNYfw7p_", // kayana-aid donor-flow
  "1Xv10maPxw7qYdSCbjo5-85642R2jkBpm", // kayana-aid embedded-widget
  "1W03HOGdpJoaTGmCC55fIkkYm-P_oGIRs", // kayana-aid events
  "1PlUnMFwReMyym8gjTCo2NW1JT9CABWK3", // kayana-aid fundraiser-flow
  "1S88B-Gs5iMeRTJA8Ib210iUJsIYmFDtg", // kayana-aid reports-dashboard
  "1ttlLbn1j8CbqZCz7kciXn2bQ2XLqObjJ", // kayana-aid shop
  "1m9l4q2UrV7dNoOD_Q_Gc_3wVAPUCI9je", // kayana-aid signup-onboarding
  "1L6MZUI4rUfSiHQJsWxw11z-HeShp3ZK4", // kayana-aid support
  "1KoWCkwvRA5bcHjW04lzPsha8bJys6dCH", // kayana-aid team
]);

const SAFE_VIDEO_TYPES = new Set([
  "video/quicktime",
  "video/mp4",
  "video/webm",
  "video/x-m4v",
]);

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing ?id=" }, { status: 400 });
  }
  if (!ALLOWED_IDS.has(id)) {
    return NextResponse.json({ error: "Unknown file id" }, { status: 403 });
  }

  const base = `https://drive.usercontent.google.com/download?id=${id}&export=download`;
  const range = req.headers.get("range");

  try {
    let url = base;

    const probe = await fetch(base, { method: "HEAD" });
    if ((probe.headers.get("content-type") ?? "").includes("text/html")) {
      const html = await fetch(base).then((r) => r.text());
      const uuidMatch = html.match(/name="uuid" value="([^"]+)"/);
      if (!uuidMatch) {
        return NextResponse.json({ error: "Could not resolve download token" }, { status: 502 });
      }
      url = `${base}&confirm=t&uuid=${uuidMatch[1]}`;
    }

    const upstream = await fetch(url, {
      headers: range ? { Range: range } : undefined,
    });

    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json({ error: "Could not fetch video from Drive" }, { status: 502 });
    }

    const upstreamType = upstream.headers.get("content-type") ?? "";
    const safeType = [...SAFE_VIDEO_TYPES].find((t) => upstreamType.includes(t)) ?? "video/mp4";

    const headers = new Headers();
    for (const key of ["content-length", "content-range", "accept-ranges"]) {
      const v = upstream.headers.get(key);
      if (v) headers.set(key, v);
    }
    headers.set("content-type", safeType);
    headers.set("x-content-type-options", "nosniff");
    headers.set("content-disposition", "inline");
    headers.set("accept-ranges", "bytes");
    headers.set("cache-control", "public, max-age=86400");

    return new NextResponse(upstream.body, { status: upstream.status, headers });
  } catch {
    return NextResponse.json({ error: "Could not fetch video from Drive" }, { status: 502 });
  }
}
