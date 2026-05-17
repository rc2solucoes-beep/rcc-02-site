import { notFound } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PostFormRefactored } from "@/components/admin/PostFormRefactored";
import { DeletePostButton } from "@/components/admin/DeletePostButton";
import { updatePost, deletePost } from "@/app/admin/(protected)/posts/actions";
import { listAuthors } from "@/lib/authors/server";
import type { Post } from "@/lib/types/post";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

async function loadAuthorsSafely() {
  try {
    return await listAuthors();
  } catch (error) {
    console.error("[EditPostPage] Error loading authors:", error);
    return [];
  }
}

async function getPost(id: string): Promise<Post | null> {
  try {
    const supabase = await createSessionClient();
    const { data, error } = await supabase.from("posts").select("*").eq("id", id).single();

    if (error) {
      console.error("[getPost] Supabase error:", error);
      return null;
    }

    if (!data) return null;

    // Ensure all data is JSON-serializable for Client Component
    // Sanitize every field to prevent serialization errors
    const sanitizedPost: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === undefined) {
        sanitizedPost[key] = null;
      } else if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        sanitizedPost[key] = value;
      } else if (Array.isArray(value)) {
        // Convert arrays to arrays of primitives
        sanitizedPost[key] = value.map(v => typeof v === "object" ? JSON.stringify(v) : v);
      } else if (typeof value === "object") {
        // Convert objects to JSON strings
        sanitizedPost[key] = JSON.stringify(value);
      } else {
        sanitizedPost[key] = String(value);
      }
    }

    return sanitizedPost as Post;
  } catch (error) {
    console.error("[getPost] Error:", error);
    throw error;
  }
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const [post, authors] = await Promise.all([getPost(id), loadAuthorsSafely()]);
  if (!post) {
    console.warn(`[EditPostPage] Post not found: ${id}`);
    notFound();
  }

  const updatePostWithId = updatePost.bind(null, id);
  const deletePostWithId = deletePost.bind(null, id);

  return (
    <>
      <AdminHeader
        title="Editar post"
        description={post.title}
        action={<DeletePostButton postId={id} deleteAction={deletePostWithId} />}
      />
      <PostFormRefactored authors={authors} post={post} action={updatePostWithId} />
    </>
  );
}
