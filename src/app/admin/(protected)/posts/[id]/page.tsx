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
  return (data as Post) ?? null;
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
