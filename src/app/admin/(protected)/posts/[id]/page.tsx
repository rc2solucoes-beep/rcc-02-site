import { notFound } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PostForm } from "@/components/admin/PostForm";
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

  return (
    <>
      <AdminHeader
        title="Editar post"
        description={post.title}
        action={
          <form action={async () => { "use server"; await deletePost(id); }}>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
              onClick={(e) => {
                if (!confirm("Excluir este post permanentemente?")) e.preventDefault();
              }}
            >
              Excluir
            </button>
          </form>
        }
      />
      <PostForm post={post} action={updatePostWithId} />
    </>
  );
}
