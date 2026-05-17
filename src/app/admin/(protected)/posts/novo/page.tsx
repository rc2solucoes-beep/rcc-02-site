import { AdminHeader } from "@/components/admin/AdminHeader";
import { PostFormRefactored } from "@/components/admin/PostFormRefactored";
import { createPost } from "@/app/admin/(protected)/posts/actions";
import { listAuthors } from "@/lib/authors/server";

export const dynamic = 'force-dynamic';

async function loadAuthorsSafely() {
  try {
    return await listAuthors();
  } catch (error) {
    console.error("[NovoPostPage] Error loading authors:", error);
    return [];
  }
}

export default async function NovoPostPage() {
  const authors = await loadAuthorsSafely();

  return (
    <>
      <AdminHeader title="Novo post" description="Crie e publique um novo conteúdo" />
      <PostFormRefactored authors={authors} action={createPost} />
    </>
  );
}
