import { AdminHeader } from "@/components/admin/AdminHeader";
import { PostFormRefactored } from "@/components/admin/PostFormRefactored";
import { createPost } from "@/app/admin/(protected)/posts/actions";

export const dynamic = 'force-dynamic';

export default function NovoPostPage() {
  return (
    <>
      <AdminHeader title="Novo post" description="Crie e publique um novo conteúdo" />
      <PostFormRefactored action={createPost} />
    </>
  );
}
