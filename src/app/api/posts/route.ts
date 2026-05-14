import { createPublicClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types/post";

export const revalidate = 60;

export async function GET() {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("posts")
      .select("id, title, slug, summary, cover_url, category, published_at, content_type")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) throw error;

    return Response.json(data ?? [], {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return Response.json([], { status: 500 });
  }
}
