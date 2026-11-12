"use client"; // runs in the browser: button, location, state

import Link from "next/link";
import { useState } from "react";
import { apiRequest, currentPosition, setDemoArea, type NearbyShop } from "../lib/api";

/** Home: find shops near the visitor. */
export default function HomePage() {
  const [shops, setShops] = useState<NearbyShop[]>([]);
  const [status, setStatus] = useState("Tap the button to find shops near you.");
  const [loading, setLoading] = useState(false);

  async function findNearby(demo: boolean) {
    setDemoArea(demo); // demo = stand at the sample shops in Bokaro
    setLoading(true);
    try {
      const { latitude, longitude } = await currentPosition();
      const list = await apiRequest<NearbyShop[]>(`/shops/nearby?lat=${latitude}&lng=${longitude}&radius_m=2000`);
      setShops(list);
      setStatus(list.length > 0 ? `${list.length} shops within 2 km` : "No shops within 2 km yet.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not load shops");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Offers around the corner</h1>
      <p className="muted">Discounts from cafes, salons and stores near you, redeemed right at the counter.</p>
      <div className="row" style={{ justifyContent: "flex-start" }}>
        <button type="button" onClick={() => findNearby(false)} disabled={loading}>
          {loading ? "Finding…" : "Find shops near me"}
        </button>
        <button type="button" className="ghost" onClick={() => findNearby(true)} disabled={loading}>
          Try the demo area
        </button>
      </div>
      <p>{status}</p>
      {shops.map((shop) => (
        <div key={shop.id} className="card">
          <Link href={`/shops/${shop.id}`} className="row">
            <span><strong>{shop.name}</strong> <span className="pill">{shop.category}</span></span>
            <span className="muted">{shop.distance_m} m</span>
          </Link>
        </div>
      ))}
    </main>
  );
}
