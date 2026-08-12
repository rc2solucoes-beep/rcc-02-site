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
      <div className="w-full rounded-lg border border-border bg-white p-6" role="status" aria-live="polite">
        <p className="text-sm text-rc2-text/70 mb-4">Carregando avaliações do Google...</p>
        <div className="w-full h-40 bg-gray-200 animate-pulse rounded-lg" />
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="w-full text-center py-12">
        <p className="text-gray-600" role="alert">
          Não conseguimos carregar as avaliações no momento.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Tente novamente em instantes ou abra as avaliações diretamente no Google.
        </p>
        <a
          href="https://www.google.com/maps/search/RC2+Solu%C3%A7%C3%B5es"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-rc2-brand-text hover:underline"
        >
          Ver no Google Maps →
        </a>
      </div>
    );
  }

  const reviews = place.reviews.slice(0, maxReviews);

  if (reviews.length === 0) {
    return (
      <div className="w-full text-center py-12">
        <p className="text-gray-600">Ainda não há avaliações visíveis neste momento.</p>
        <p className="text-sm text-gray-500 mt-2">
          Você pode conferir nosso perfil completo no Google Maps.
        </p>
        <a
          href="https://www.google.com/maps/search/RC2+Solu%C3%A7%C3%B5es"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-rc2-brand-text hover:underline"
        >
          Ver no Google Maps →
        </a>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {/* Resumo das Avaliações */}
      <div className="rc2-shadow-deep flex flex-col items-center gap-2 rounded-xl border border-border bg-rc2-bg-alt p-6 text-center">
        <div className="flex items-center gap-3">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={22}
                className={
                  i < Math.round(place.rating)
                    ? "fill-rc2-brand text-rc2-brand"
                    : "text-rc2-text/20"
                }
                aria-hidden
              />
            ))}
          </div>
          <span className="rc2-bold text-3xl text-rc2-heading">{place.rating.toFixed(1)}</span>
        </div>
        <p className="text-sm text-rc2-text-secondary">
          {place.userRatingCount} avaliações no Google
        </p>
      </div>

      {/* Lista de Reviews */}
      <div className={columns === 2 ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "space-y-4"}>
        {reviews.map((review, i) => {
          const isLastOdd = columns === 2 && i === reviews.length - 1 && reviews.length % 2 !== 0;
          return (
            <figure
              key={i}
              className={`group rc2-card rc2-card-hover relative flex flex-col overflow-hidden p-6 pt-7${isLastOdd ? " sm:col-span-2 sm:max-w-[calc(50%-0.5rem)] sm:mx-auto sm:w-full" : ""}`}
            >
              {/* Acento estrutural — aba laranja no topo */}
              <span
                className="absolute left-0 top-0 h-1 w-10 bg-rc2-brand transition-all duration-200 group-hover:w-full group-hover:opacity-90"
                aria-hidden
              />
              <div className="mb-3 flex items-center justify-between gap-4">
                <div className="flex gap-0.5" aria-label={`${review.rating} de 5 estrelas`}>
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      size={14}
                      className={
                        j < review.rating
                          ? "fill-rc2-brand text-rc2-brand"
                          : "text-rc2-text/20"
                      }
                      aria-hidden
                    />
                  ))}
                </div>
                <time className="whitespace-nowrap text-xs text-rc2-text-secondary">
                  {new Date(review.publishTime).toLocaleDateString("pt-BR")}
                </time>
              </div>
              <blockquote className="flex-1 text-sm leading-relaxed text-rc2-text/80">
                {review.text}
              </blockquote>
              <figcaption className="mt-4 border-t border-border pt-3 text-sm font-semibold text-rc2-heading">
                {review.authorAttribution.displayName}
              </figcaption>
            </figure>
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
            className="inline-block px-6 py-2 border border-rc2-text text-rc2-text hover:bg-rc2-text hover:text-rc2-dark-text transition-colors rounded"
          >
            Ver todas as avaliações no Google →
          </a>
        </div>
      )}
    </div>
  );
}
