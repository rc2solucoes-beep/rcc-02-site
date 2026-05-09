import type { PlaceDetails } from "@/lib/types/google";

export async function getPlaceDetails(): Promise<PlaceDetails | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    console.error("Missing Google Places API credentials");
    return null;
  }

  try {
    const url = `https://places.googleapis.com/v1/places/${placeId}?fields=displayName,formattedAddress,rating,reviews,userRatingCount&key=${apiKey}`;
    console.log("Fetching:", url.replace(apiKey, "***"));

    const response = await fetch(url);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Response status:", response.status);
      console.error("Response body:", errorBody);
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      displayName: data.displayName?.text || "RC2 Soluções",
      formattedAddress: data.formattedAddress || "",
      rating: data.rating || 0,
      reviews: (data.reviews || []).slice(0, 5).map((r: {
        authorAttribution?: { displayName?: string };
        rating?: number;
        text?: { text?: string } | string;
        publishTime?: string;
      }) => ({
        authorAttribution: {
          displayName: r.authorAttribution?.displayName || "",
        },
        rating: r.rating || 0,
        text: typeof r.text === "object" ? (r.text?.text || "") : (r.text || ""),
        publishTime: r.publishTime || "",
      })),
      userRatingCount: data.userRatingCount || 0,
    };
  } catch (error) {
    console.error("Error fetching place details:", error);
    return null;
  }
}
