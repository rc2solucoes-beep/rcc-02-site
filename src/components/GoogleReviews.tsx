"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import type { PlaceDetails } from "@/lib/types/google";

interface GoogleReviewsProps {
  maxReviews?: number;
  showGoogleLink?: boolean;
  columns?: 1 | 2;
}

export function GoogleReviews({ maxReviews = 5, showGoogleLink = true, columns = 1 }: GoogleReviewsProps) {
  const [place, setPlace] = useState<PlaceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch("/api/google/places");
        if (!res.ok) throw new Error("Failed to fetch reviews");
        const data = await res.json();
        setPlace(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-96 bg-gray-200 animate-pulse rounded-lg" />
    );
  }

  if (error || !place) {
    return (
      <div className="w-full text-center py-12">
        <p className="text-gray-600">
          Não conseguimos carregar as avaliações no momento.
        </p>
        <a
          href="https://www.google.com/maps/search/RC2+Solu%C3%A7%C3%B5es"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-rc2-orange hover:underline"
        >
          Ver no Google Maps →
        </a>
      </div>
    );
  }

  const reviews = place.reviews.slice(0, maxReviews);

  return (
    <div className="w-full space-y-8">
      {/* Resumo das Avaliações */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={20}
                className={
                  i < Math.round(place.rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }
              />
            ))}
          </div>
          <span className="text-2xl font-bold">{place.rating.toFixed(1)}</span>
        </div>
        <p className="text-gray-600">
          {place.userRatingCount} avaliações no Google
        </p>
      </div>

      {/* Lista de Reviews */}
      <div className={columns === 2 ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "space-y-4"}>
        {reviews.map((review, i) => {
          const isLastOdd = columns === 2 && i === reviews.length - 1 && reviews.length % 2 !== 0;
          return (
            <div
              key={i}
              className={`border border-gray-200 rounded-lg p-4 space-y-2${isLastOdd ? " sm:col-span-2 sm:max-w-[calc(50%-0.5rem)] sm:mx-auto sm:w-full" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-rc2-ebony">
                    {review.authorAttribution.displayName}
                  </p>
                  <div className="flex gap-0.5 mt-1">
                    {[...Array(5)].map((_, j) => (
                      <Star
                        key={j}
                        size={14}
                        className={
                          j < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }
                      />
                    ))}
                  </div>
                </div>
                <time className="text-sm text-gray-500 whitespace-nowrap">
                  {new Date(review.publishTime).toLocaleDateString("pt-BR")}
                </time>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                {review.text}
              </p>
            </div>
          );
        })}
      </div>

      {/* Link para ver mais */}
      {showGoogleLink && (
        <div className="text-center pt-4">
          <a
            href="https://www.google.com/maps/search/RC2+Solu%C3%A7%C3%B5es"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-2 border border-rc2-ebony text-rc2-ebony hover:bg-rc2-ebony hover:text-rc2-sand transition-colors rounded"
          >
            Ver todas as avaliações no Google →
          </a>
        </div>
      )}
    </div>
  );
}
