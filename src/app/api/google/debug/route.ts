import { getPlaceDetails } from "@/lib/google/places";

export async function GET() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  try {
    const details = await getPlaceDetails();
    return Response.json({
      status: "success",
      apiKeyDefined: !!apiKey,
      placeIdDefined: !!placeId,
      apiKeyPreview: apiKey?.substring(0, 10) + "...",
      placeIdValue: placeId,
      details,
    });
  } catch (error) {
    return Response.json({
      status: "error",
      apiKeyDefined: !!apiKey,
      placeIdDefined: !!placeId,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
