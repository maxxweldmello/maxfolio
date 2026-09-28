import { NextRequest, NextResponse } from "next/server";
import { driveFetch } from "@/lib/driveFetch";

/**
 * Proxies an image out of Google Drive.
 *
 * Hotlinking Drive images straight from the browser (`lh3.googleusercontent.com/d/<id>`
 * or `drive.google.com/uc?export=view`) is inconsistent — Google's response depends on
 * the *viewer's own* Google session/cookies and browser extensions (ad-blockers commonly
 * treat googleusercontent.com as a tracker host when it's a subresource, not a direct nav).
 *
 * Fetching it here instead means our server makes the request, not the visitor's
 * browser — always the same request, so it's consistent for everyone.
 *
 * Usage: /api/drive-image?id=<Drive file id>
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing ?id=" }, { status: 400 });
  }

  try {
    // lh3.googleusercontent.com is Drive's view/thumbnail path — it has a far
    // more generous quota than uc?export=download, which throttles hard after
    // a handful of requests per day ("too many users have viewed or
    // downloaded this file recently").
    const { status, headers, body } = await driveFetch(`https://lh3.googleusercontent.com/d/${id}`);

    if (status !== 200) {
      return NextResponse.json({ error: "Could not fetch file from Drive" }, { status: 502 });
    }

    const contentType = (headers["content-type"] as string) ?? "application/octet-stream";

    return new NextResponse(new Uint8Array(body), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Could not fetch file from Drive" }, { status: 502 });
  }
}
