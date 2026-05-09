export async function GET() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    return Response.json({
      error: "Missing credentials",
      apiKeyDefined: !!apiKey,
      placeIdDefined: !!placeId,
    }, { status: 400 });
  }

  try {
    const url = `https://places.googleapis.com/v1/places/${placeId}?fields=displayName,formattedAddress,rating,reviews,userRatingCount&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.text();

    return Response.json({
      status: response.ok ? "success" : "api_error",
      statusCode: response.status,
      apiResponse: data,
      apiKeyDefined: true,
      placeIdDefined: true,
    });
  } catch (error) {
    return Response.json({
      status: "fetch_error",
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
