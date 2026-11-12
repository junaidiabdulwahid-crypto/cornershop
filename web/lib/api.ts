/** Every page talks to the API through this one function. */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3100/api/v1"; // NEXT_PUBLIC_ = public, never a secret
const TOKEN_KEY = "cornershop_token";

export function getToken(): string | null {
  return typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_KEY) : null; // no window on the server
}
export function saveToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}
export function signOut(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({})); // no crash on an empty or broken reply
  if (!res.ok) {
    // The API sends { statusCode, message }; message may be a list of validation errors
    const message = Array.isArray(data.message) ? data.message.join(", ") : data.message;
    throw new Error(message || `Request failed (${res.status})`);
  }
  return data as T;
}

/** A spot in Bokaro where demo.sh creates its sample shops. */
export const DEMO_SPOT = { latitude: 23.6695, longitude: 86.1513 } as const;
const DEMO_KEY = "cornershop_demo_area";

export function setDemoArea(on: boolean): void {
  if (on) window.sessionStorage.setItem(DEMO_KEY, "1");
  else window.sessionStorage.removeItem(DEMO_KEY);
}
export function inDemoArea(): boolean {
  return typeof window !== "undefined" && window.sessionStorage.getItem(DEMO_KEY) === "1";
}

/** The browser's location, or the demo spot when the visitor chose to try the demo area. */
export function currentPosition(): Promise<{ latitude: number; longitude: number }> {
  if (inDemoArea()) return Promise.resolve(DEMO_SPOT);
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("This browser cannot share its location."));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => reject(new Error("Allow location access to continue.")),
    );
  });
}

export function rupees(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export interface NearbyShop {
  id: string;
  name: string;
  category: string;
  distance_m: number;
}
export interface ShopDetail {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
}
export interface OfferItem {
  id: string;
  title: string;
  discount_percent: number;
  daily_limit: number;
  used_today: number;
}
export interface Receipt {
  redemption_id: string;
  bill_amount: number;
  discount_amount: number;
  payable_amount: number;
}
export interface ShopReviews {
  average_rating: number | null;
  count: number;
  reviews: Array<{ id: string; rating: number; comment: string; created_at: string }>;
}
