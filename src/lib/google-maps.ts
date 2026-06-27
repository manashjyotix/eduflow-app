/**
 * google-maps.ts — lightweight client-side loader for the Google Maps JS API.
 *
 * The key is read from `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. When it is absent the
 * UI falls back to the self-contained SVG `RouteMap`, so the app keeps working
 * with no key configured (demo mode). When a key IS present, components get a
 * real Google map with real roads + POI styling.
 *
 * Production note: restrict the key (HTTP referrers + Maps JS API only) and
 * keep per-school isolation + parent consent for any live GPS feed.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
  interface Window {
    google?: any
  }
}

export const GOOGLE_MAPS_API_KEY: string =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""

export const hasGoogleMapsKey = (): boolean => GOOGLE_MAPS_API_KEY.trim().length > 0

let loaderPromise: Promise<any> | null = null

/** Inject the Maps JS API once and resolve with the global `google` object. */
export function loadGoogleMaps(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser"))
  }
  if (window.google?.maps) return Promise.resolve(window.google)
  if (!hasGoogleMapsKey()) {
    return Promise.reject(new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"))
  }
  if (loaderPromise) return loaderPromise

  loaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script")
    const params = new URLSearchParams({
      key: GOOGLE_MAPS_API_KEY,
      libraries: "geometry",
    })
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`
    script.async = true
    script.defer = true
    script.onload = () => {
      // With a plain script tag the namespace is ready on load, but poll
      // briefly as a safety net against any deferred initialisation.
      let tries = 0
      const check = () => {
        if (window.google?.maps?.Map) return resolve(window.google)
        if (tries++ > 40) return reject(new Error("Google Maps namespace never became ready"))
        setTimeout(check, 50)
      }
      check()
    }
    script.onerror = () => {
      loaderPromise = null
      reject(new Error("Failed to load the Google Maps script"))
    }
    document.head.appendChild(script)
  })
  return loaderPromise
}

/**
 * Map style array: hides commercial clutter (shops, attractions, transit) and
 * keeps emergency-relevant places (hospitals, clinics, police, schools,
 * colleges) visible.
 */
export const EMERGENCY_MAP_STYLE = [
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "poi.attraction", stylers: [{ visibility: "off" }] },
  { featureType: "poi.sports_complex", stylers: [{ visibility: "off" }] },
  { featureType: "poi.place_of_worship", stylers: [{ visibility: "off" }] },
  { featureType: "poi.government", stylers: [{ visibility: "off" }] }, // hides post offices / govt offices
  { featureType: "poi.park", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "poi.medical", elementType: "labels", stylers: [{ visibility: "on" }] },
  { featureType: "poi.school", elementType: "labels", stylers: [{ visibility: "on" }] },
] as const
