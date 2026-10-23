import type { CSSProperties } from "react";
import { Quote } from "lucide-react";
import { rating, reviews, showTrust, type Review } from "@/lib/showcase";
import { SampleTag } from "@/components/sample-tag";
import { Stars } from "@/components/stars";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .replace(/\W/g, "")
    .slice(0, 2);

function ReviewCard({ review, hidden }: { review: Review; hidden?: boolean }) {
  return (
    <li className="review-card" aria-hidden={hidden || undefined}>
      <div className="review-head">
        <Stars value={review.stars} size={15} />
        <Quote size={22} strokeWidth={1.6} aria-hidden="true" />
      </div>
      <blockquote>{review.text}</blockquote>
      <div className="review-author">
        <span className="review-avatar" aria-hidden="true">
          {initials(review.name)}
        </span>
        <span>
          <strong>{review.name}</strong>
          {review.place} · {review.service}
        </span>
        <time>{review.when}</time>
      </div>
    </li>
  );
}

// Customer voices: the overall rating and two rows of review cards drifting in
// opposite directions (paused on hover). Each row is doubled for a seamless loop;
// the copies are hidden from assistive technology. With reduced motion the cards
// stand still in a wrapping grid.
export function Reviews() {
  if (!showTrust) return null;
  const half = Math.ceil(reviews.length / 2);
  const rows = [reviews.slice(0, half), reviews.slice(half)];
  return (
    <section
      className="section reviews"
      id="bewertungen"
      aria-labelledby="reviews-title"
    >
      <div className="section-top reviews-top">
        <div>
          <span className="eyebrow">
            KUNDENSTIMMEN <SampleTag />
          </span>
          <h2 id="reviews-title">
            Geräumt.
            <br />
            <span>Und gern weiterempfohlen.</span>
          </h2>
        </div>
        <div className="reviews-score">
          <strong>{rating.score.toLocaleString("de-DE")}</strong>
          <div>
            <Stars value={rating.score} size={20} />
            <span>
              {rating.count} Bewertungen auf {rating.source}
            </span>
          </div>
        </div>
      </div>
      <div className="reviews-rows" data-pause-offscreen>
        {rows.map((row, r) => (
          <div
            key={r}
            className={r ? "reviews-row is-reverse" : "reviews-row"}
            style={{ "--duration": `${row.length * 11}s` } as CSSProperties}
          >
            <ul className="reviews-track">
              {row.map((review) => (
                <ReviewCard key={review.name} review={review} />
              ))}
              {row.map((review) => (
                <ReviewCard key={`${review.name}-copy`} review={review} hidden />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
