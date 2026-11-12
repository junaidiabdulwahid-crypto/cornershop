"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  apiRequest, currentPosition, getToken, rupees,
  type OfferItem, type Receipt, type ShopDetail, type ShopReviews,
} from "../../../lib/api";

export default function ShopPage() {
  const { id } = useParams<{ id: string }>();
  const [shop, setShop] = useState<ShopDetail | null>(null);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [reviews, setReviews] = useState<ShopReviews | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    apiRequest<ShopDetail>(`/shops/${id}`).then(setShop).catch((e: Error) => setError(e.message));
    apiRequest<OfferItem[]>(`/shops/${id}/offers`).then(setOffers).catch(() => setOffers([]));
    apiRequest<ShopReviews>(`/shops/${id}/reviews`).then(setReviews).catch(() => setReviews(null));
  }, [id]);

  useEffect(load, [load]); // load once when the page opens, and again when id changes

  if (error) return <main><p className="error">{error}</p></main>;
  if (!shop) return <main><p className="muted">Loading…</p></main>;

  return (
    <main>
      <h1>{shop.name}</h1>
      <p className="muted">
        {shop.category} · {reviews && reviews.average_rating !== null ? `★ ${reviews.average_rating} (${reviews.count})` : "No reviews yet"}
      </p>

      <h2>Offers today</h2>
      {offers.length === 0 && <p className="muted">No offers right now.</p>}
      {offers.map((o) => <OfferCard key={o.id} offer={o} onRedeemed={load} />)}

      <h2>Reviews</h2>
      <ReviewForm shopId={id} onSaved={load} />
      {reviews?.reviews.map((r) => (
        <div key={r.id} className="card">
          <strong>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</strong>
          <p style={{ margin: "6px 0 0" }}>{r.comment}</p>
        </div>
      ))}
    </main>
  );
}

function OfferCard({ offer, onRedeemed }: { offer: OfferItem; onRedeemed: () => void }) {
  const [bill, setBill] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const left = offer.daily_limit - offer.used_today;

  async function redeem() {
    if (!getToken()) { setMessage("Sign in first"); return; }
    setBusy(true);
    setMessage(null);
    try {
      const { latitude, longitude } = await currentPosition(); // the API checks you are within 100 m
      const r = await apiRequest<Receipt>(`/offers/${offer.id}/redeem`, {
        method: "POST",
        body: JSON.stringify({ bill_amount: Number(bill), latitude, longitude }),
      });
      setReceipt(r);
      onRedeemed();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not redeem");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="row">
        <strong>{offer.title}</strong>
        <span className="pill">{left > 0 ? `${left} left today` : "Fully used today"}</span>
      </div>
      {receipt ? (
        <p>Bill {rupees(receipt.bill_amount)} − {rupees(receipt.discount_amount)} = <strong>pay {rupees(receipt.payable_amount)}</strong></p>
      ) : (
        <div className="row" style={{ marginTop: 10 }}>
          <input placeholder="Bill amount (₹)" value={bill} onChange={(e) => setBill(e.target.value)} inputMode="decimal" style={{ margin: 0 }} />
          <button type="button" onClick={redeem} disabled={busy || !bill || left <= 0}>{busy ? "…" : "Redeem"}</button>
        </div>
      )}
      {message && <p className="error">{message}</p>}
    </div>
  );
}

function ReviewForm({ shopId, onSaved }: { shopId: string; onSaved: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setMessage(null);
    try {
      await apiRequest(`/shops/${shopId}/reviews`, { method: "POST", body: JSON.stringify({ rating, comment }) });
      setComment("");
      onSaved();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save the review"); // e.g. 409 "already reviewed"
    }
  }

  return (
    <div className="card">
      <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
        {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>)}
      </select>
      <textarea placeholder="What was it like?" maxLength={300} value={comment} onChange={(e) => setComment(e.target.value)} />
      <button type="button" onClick={save} disabled={!comment.trim()}>Post review</button>
      {message && <p className="error">{message}</p>}
    </div>
  );
}
