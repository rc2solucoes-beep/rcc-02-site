import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Pagination } from "@/components/admin/Pagination";
import { PostsFilterBar } from "@/components/admin/posts/PostsFilterBar";
import { PostsList } from "@/components/admin/posts/PostsList";
import { listAdminPosts } from "@/lib/admin/listAdminPosts";
import type { RawSearchParams } from "@/lib/admin/listParams";
import { hasActivePostFilters, parsePostListParams, postListHref, POSTS_LIST_PATH } from "@/lib/admin/postList";

export const revalidate = 0;

export default async function PostsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = parsePostListParams(await searchParams);
  const result = await listAdminPosts(params);

  // Página além do alcance: leva à última (RF-CMS-07).
  if (result.ok && result.total > 0 && result.page > result.pageCount) {
    redirect(postListHref(params, { page: result.pageCount }));
  }

  const filtered = hasActivePostFilters(params);
  const description = !result.ok
    ? undefined
    : filtered
      ? `${result.total} ${result.total === 1 ? "post encontrado" : "posts encontrados"}`
      : `${result.total} ${result.total === 1 ? "post" : "posts"}`;

  return (
    <>
      <AdminHeader
        title="Posts"
        description={description}
        action={
          <Link
            href="/admin/posts/novo"
            className="flex items-center gap-2 px-4 py-2 bg-rc2-brand text-rc2-heading text-sm font-medium hover:bg-rc2-brand-hover transition-colors"
          >
            <Plus size={15} aria-hidden="true" />
            Novo post
          </Link>
        }
      />
      <div className="p-4 md:p-6 lg:p-8">
        <PostsFilterBar params={params} />

        {params.rangeIgnored && (
          <p role="status" className="mb-4 border border-rc2-border bg-rc2-surface px-4 py-3 text-sm text-rc2-text">
            A data inicial é posterior à final. O período foi ignorado.
          </p>
        )}

        {!result.ok ? (
          <div role="alert" className="bg-rc2-surface border border-rc2-border p-8 text-center text-sm text-rc2-text">
            <p className="font-medium text-rc2-error">Não foi possível carregar os posts.</p>
            <p className="mt-1 text-rc2-text-secondary">Isto não significa que a lista esteja vazia.</p>
            <Link href={postListHref(params)} className="mt-4 inline-block font-medium text-rc2-brand-text underline">
              Tentar novamente
            </Link>
          </div>
        ) : result.total === 0 ? (
          filtered ? (
            <div className="bg-rc2-surface border border-rc2-border p-12 text-center text-sm text-rc2-text">
              <p className="font-medium text-rc2-heading">Nenhum post encontrado</p>
              <p className="mt-1 text-rc2-text-secondary">Nenhum post corresponde aos filtros aplicados.</p>
              <Link href={POSTS_LIST_PATH} className="mt-4 inline-block font-medium text-rc2-brand-text underline">
                Limpar filtros
              </Link>
            </div>
          ) : (
            <div className="bg-rc2-surface border border-rc2-border p-12 text-center text-sm text-rc2-text-secondary">
              Nenhum post ainda.{" "}
              <Link href="/admin/posts/novo" className="font-medium text-rc2-brand-text underline">
                Criar o primeiro
              </Link>
            </div>
          )
        ) : (
          <>
            <PostsList items={result.items} now={new Date()} />
            <Pagination
              page={result.page}
              pageCount={result.pageCount}
              total={result.total}
              hrefFor={(page) => postListHref(params, { page })}
              noun={{ singular: "post", plural: "posts" }}
            />
          </>
        )}
      </div>
    </>
  );
}
