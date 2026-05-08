import { unstable_cache } from "next/cache";
import { getPlaceDetails } from "@/lib/google/places";

const getCachedPlaceDetails = unstable_cache(
  async () => getPlaceDetails(),
  ["google-place-details"],
  { revalidate: 3600 }
);

export async function GET() {
  try {
    const details = await getCachedPlaceDetails();

    if (!details) {
      return Response.json(
        { error: "Could not fetch place details" },
        { status: 500 }
      );
    }

    return Response.json(details);
  } catch (error) {
    console.error("API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
