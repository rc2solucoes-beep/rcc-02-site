import { getOrgSettings, getOrganizationSchema, getLocalBusinessSchema } from "@/lib/schema";
import { BASE_URL } from "@/lib/siteMetadata";
import { NextResponse } from "next/server";

/**
 * GET /api/schema-debug
 * Debug endpoint to view generated schemas
 */

export async function GET() {
  try {
    const settings = await getOrgSettings();
    const orgSchema = getOrganizationSchema(settings, BASE_URL);
    const localSchema = getLocalBusinessSchema(settings, BASE_URL);

    return NextResponse.json(
      {
        status: "ok",
        settings: {
          contact_email: settings.contact_email,
          phone: settings.phone,
          address: settings.address,
          address_lat: settings.address_lat,
          address_lng: settings.address_lng,
          gmb_url: settings.gmb_url,
          instagram_url: settings.instagram_url,
          linkedin_url: settings.linkedin_url,
          facebook_url: settings.facebook_url,
          youtube_url: settings.youtube_url,
        },
        schemas: {
          organization: orgSchema,
          localBusiness: localSchema,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
