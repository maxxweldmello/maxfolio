import { NextRequest, NextResponse } from "next/server";
import { driveFetch } from "@/lib/driveFetch";

/**
 * Proxies a non-image file (the resume PDF) out of Google Drive, served
 * inline so the browser's own native PDF viewer renders it — same as the
 * old local file did, so `#toolbar=0&navpanes=0&view=FitH` on the <iframe>
 * src still works exactly as before, instead of Drive's own embedded
 * viewer (which doesn't fit itself to an arbitrary container size).
 *
 * Usage: /api/drive-file?id=<Drive file id>
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing ?id=" }, { status: 400 });
  }

  try {
    const { status, body } = await driveFetch(`https://drive.google.com/uc?export=download&id=${id}`);

    if (status !== 200) {
      return NextResponse.json({ error: "Could not fetch file from Drive" }, { status: 502 });
    }

    return new NextResponse(new Uint8Array(body), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Could not fetch file from Drive" }, { status: 502 });
  }
}
