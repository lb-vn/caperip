export interface UserLocation {
  lat: number;
  lng: number;
  city: string | null;
  state: string | null;
  postcode: string | null;
}

type GeoState = "idle" | "pending" | "granted" | "denied";

type GeoResult = {
  city: string | null;
  state: string | null;
  postcode: string | null;
};

// resolves through our own /api/geocode, which calls OpenStreetMap server-side
async function reverseGeocode(lat: number, lng: number): Promise<GeoResult> {
  try {
    const res = await fetch("/api/geocode", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lat, lng }),
    });
    if (!res.ok) return { city: null, state: null, postcode: null };
    return (await res.json()) as GeoResult;
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
