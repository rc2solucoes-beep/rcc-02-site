import type { PlaceDetails } from "@/lib/types/google";

export async function getPlaceDetails(): Promise<PlaceDetails | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    console.error("Missing Google Places API credentials");
    return null;
  }

  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?fields=displayName,formattedAddress,rating,reviews,userRatingCount&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      displayName: data.displayName?.text || "RC2 Soluções",
      formattedAddress: data.formattedAddress || "",
      rating: data.rating || 0,
      reviews: (data.reviews || []).slice(0, 5),
      userRatingCount: data.userRatingCount || 0,
    };
  } catch (error) {
    console.error("Error fetching place details:", error);
    return null;
  }
}
