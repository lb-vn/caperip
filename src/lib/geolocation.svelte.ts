export interface UserLocation {
  lat: number;
  lng: number;
  city: string | null;
  state: string | null;
  postcode: string | null;
}

type GeoState = "idle" | "pending" | "granted" | "denied";

async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<{
  city: string | null;
  state: string | null;
  postcode: string | null;
}> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "User-Agent": "cape.rip speed test" } },
    );
    if (!res.ok) return { city: null, state: null, postcode: null };
    const data = await res.json();
    const addr = data.address ?? {};
    return {
      city: addr.city ?? addr.town ?? addr.village ?? addr.county ?? null,
      state: addr["ISO3166-2-lvl4"]?.split("-")[1] ?? null,
      postcode: addr.postcode ?? null,
    };
  } catch {
    return { city: null, state: null, postcode: null };
  }
}

export function useGeolocation() {
  let state = $state<GeoState>("idle");
  let location = $state<UserLocation | null>(null);

  if (typeof navigator !== "undefined" && navigator.permissions) {
    navigator.permissions.query({ name: "geolocation" }).then((result) => {
      if (result.state === "granted") {
        request();
      }
    });
  }

  async function request() {
    if (state === "granted") return;
    state = "pending";

    if (!navigator.geolocation) {
      state = "denied";
      return;
    }

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 300000,
        });
      });

      const { latitude: lat, longitude: lng } = pos.coords;
      const geo = await reverseGeocode(lat, lng);

      location = { lat, lng, ...geo };
      state = "granted";
    } catch {
      state = "denied";
    }
  }

  return {
    get state() {
      return state;
    },
    get location() {
      return location;
    },
    request,
  };
}
