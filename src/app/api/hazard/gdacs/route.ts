/**
 * /api/hazard/gdacs
 *
 * Server-side proxy for the GDACS multi-hazard event API.
 * GDACS does not send CORS headers permitting browser-direct requests, so we
 * fetch it here on the server and forward the GeoJSON to the client.
 *
 * Called by hazard-feeds.ts when USE_LIVE_FEEDS === true.
 */

import { NextResponse } from "next/server"

const GDACS_URL =
  "https://www.gdacs.org/gdacsapi/api/events/geteventlist/EVENTS4APP"

export const runtime = "nodejs"
// Revalidate every 5 minutes (matches the client poll interval).
export const revalidate = 300

export async function GET() {
  try {
    const res = await fetch(GDACS_URL, {
      headers: {
        // Mimic a browser so GDACS doesn't reject the request.
        "User-Agent":
          "Mozilla/5.0 (compatible; EduFlow-HazardProxy/1.0; +https://eduflow.app)",
        Accept: "application/json, text/plain, */*",
      },
      next: { revalidate: 300 },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: "GDACS upstream error", status: res.status },
        { status: 502 }
      )
    }

    const data = await res.json()
    return NextResponse.json(data, {
      headers: {
        // Allow our own client origin.
        "Access-Control-Allow-Origin": "*",
        // Cache in the browser for 5 minutes.
        "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
      },
    })
  } catch (err) {
    console.error("[GDACS proxy] fetch error:", err)
    return NextResponse.json(
      { error: "GDACS proxy failed" },
      { status: 502 }
    )
  }
}
