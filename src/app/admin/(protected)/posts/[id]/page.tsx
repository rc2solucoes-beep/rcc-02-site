import { notFound } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PostFormRefactored } from "@/components/admin/PostFormRefactored";
import { DeletePostButton } from "@/components/admin/DeletePostButton";
import { updatePost, deletePost } from "@/app/admin/(protected)/posts/actions";
import type { Post } from "@/lib/types/post";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

async function getPost(id: string): Promise<Post | null> {
  const supabase = await createSessionClient();
  const { data } = await supabase.from("posts").select("*").eq("id", id).single();
  if (!data) return null;

  // Ensure all data is JSON-serializable for Client Component
  return {
    ...data,
    published_at: data.published_at ? String(data.published_at) : null,
    updated_at: data.updated_at ? String(data.updated_at) : null,
    created_at: data.created_at ? String(data.created_at) : null,
    scheduled_publish_at: data.scheduled_publish_at ? String(data.scheduled_publish_at) : null,
    related_post_ids: Array.isArray(data.related_post_ids) ? data.related_post_ids : [],
    seo_keyword_secondary: Array.isArray(data.seo_keyword_secondary) ? data.seo_keyword_secondary : [],
    tags: Array.isArray(data.tags) ? data.tags : [],
  } as Post;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  const updatePostWithId = updatePost.bind(null, id);
  const deletePostWithId = deletePost.bind(null, id);

  return (
    <>
      <AdminHeader
        title="Editar post"
        description={post.title}
        action={<DeletePostButton postId={id} deleteAction={deletePostWithId} />}
      />
      <PostFormRefactored post={post} action={updatePostWithId} />
    </>
  );
}
