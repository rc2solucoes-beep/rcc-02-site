import { createSessionClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/AdminHeader";
import Link from "next/link";
import type { Post } from "@/lib/types/post";
import { Pencil, Plus, Eye } from "lucide-react";

export const revalidate = 0;

async function getPosts(): Promise<Post[]> {
  try {
    const supabase = await createSessionClient();
    const { data } = await supabase
      .from("posts")
      .select("id,slug,title,status,published_at,created_at,updated_at,summary,cover_url,content")
      .order("created_at", { ascending: false });
    return (data as Post[]) ?? [];
  } catch {
    return [];
  }
}

const STATUS_STYLES: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  scheduled: "bg-blue-100 text-blue-700",
  draft:     "bg-yellow-100 text-yellow-700",
  archived:  "bg-zinc-100 text-zinc-500",
};

const STATUS_LABEL: Record<string, string> = {
  published: "Publicado",
  scheduled: "Agendado",
  draft:     "Rascunho",
  archived:  "Arquivado",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <>
      <AdminHeader
        title="Posts"
        description={`${posts.length} posts`}
        action={
          <Link
            href="/admin/posts/novo"
            className="flex items-center gap-2 px-4 py-2 bg-rc2-orange text-rc2-heading text-sm font-medium hover:bg-rc2-orange/90 transition-colors"
          >
            <Plus size={15} />
            Novo post
          </Link>
        }
      />
      <div className="p-4 md:p-6 lg:p-8">
        {posts.length === 0 ? (
          <div className="bg-white border border-border p-12 text-center text-muted-foreground text-sm">
            Nenhum post ainda.{" "}
            <Link href="/admin/posts/novo" className="text-rc2-orange underline">
              Criar o primeiro
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-border divide-y divide-border">
            {posts.map((post) => (
              <div key={post.id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-zinc-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${STATUS_STYLES[post.status]}`}>
                      {STATUS_LABEL[post.status]}
                    </span>
                    <span className="text-xs text-rc2-ebony/40">{formatDate(post.created_at)}</span>
                  </div>
                  <p className="font-medium text-rc2-ebony truncate">{post.title}</p>
                  <p className="text-xs text-muted-foreground truncate">/{post.slug}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/blog/${post.slug}/preview`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rc2-ebony/70 border border-border hover:border-rc2-orange hover:text-rc2-orange transition-colors"
                  >
                    <Eye size={12} />
                    Visualizar
                  </Link>
                  <Link
                    href={`/admin/posts/${post.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rc2-ebony/70 border border-border hover:border-rc2-orange hover:text-rc2-orange transition-colors"
                  >
                    <Pencil size={12} />
                    Editar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
