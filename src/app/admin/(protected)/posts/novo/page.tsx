import { AdminHeader } from "@/components/admin/AdminHeader";
import { PostForm } from "@/components/admin/PostForm";
import { createPost } from "@/app/admin/(protected)/posts/actions";

export const dynamic = 'force-dynamic';

export default function NovoPostPage() {
  return (
    <>
      <AdminHeader title="Novo post" description="Crie e publique um novo conteúdo" />
      <PostForm action={createPost} />
    </>
  );
}
