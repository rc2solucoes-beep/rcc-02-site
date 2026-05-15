"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RichEditor } from "@/components/admin/RichEditor";
import type { Post } from "@/lib/types/post";
import type { PostFormState } from "@/app/admin/(protected)/posts/actions";
import { slugify } from "@/lib/utils";

interface PostFormProps {
  post?: Post;
  action: (prevState: PostFormState, formData: FormData) => Promise<PostFormState>;
}

const initialState: PostFormState = {};

function FieldError({ errors, field }: { errors?: Record<string, string[]>; field: string }) {
  const msgs = errors?.[field];
  if (!msgs?.length) return null;
  return <p className="mt-1 text-xs text-red-600">{msgs[0]}</p>;
}

const inputBase = "w-full border border-border bg-rc2-sand px-3 py-2.5 text-sm text-rc2-ebony placeholder:text-rc2-placeholder outline-none focus:border-rc2-orange focus:ring-1 focus:ring-rc2-orange transition-colors";

export function PostForm({ post, action }: PostFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [content, setContent] = useState(post?.content ?? "");
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!post);
  const contentInputRef = useRef<HTMLInputElement>(null);

  // Sync content to hidden input
  useEffect(() => {
    if (contentInputRef.current) {
      contentInputRef.current.value = content;
    }
  }, [content]);

  return (
    <form action={formAction} className="p-8 space-y-6 max-w-4xl">
      {state.message && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3">{state.message}</p>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="title">Título</label>
        <input
          id="title" name="title" type="text" required
          value={title}
          onChange={(e) => {
            const nextTitle = e.target.value;
            setTitle(nextTitle);
            if (!slugManuallyEdited) setSlug(slugify(nextTitle));
          }}
          className={inputBase}
          placeholder="Título do post"
        />
        <FieldError errors={state.errors} field="title" />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="slug">Slug</label>
        <div className="flex items-center gap-0">
          <span className="border border-r-0 border-border bg-zinc-100 px-3 py-2.5 text-sm text-muted-foreground whitespace-nowrap">/blog/</span>
          <input
            id="slug" name="slug" type="text" required
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugManuallyEdited(true); }}
            className={`${inputBase} flex-1`}
            placeholder="meu-post"
          />
        </div>
        <FieldError errors={state.errors} field="slug" />
      </div>

      {/* Summary */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="summary">Resumo</label>
        <textarea
          id="summary" name="summary" required rows={2}
          defaultValue={post?.summary}
          className={`${inputBase} resize-none`}
          placeholder="Breve descrição para SEO e listagem"
        />
        <FieldError errors={state.errors} field="summary" />
      </div>

      {/* Cover URL */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="cover_url">
          URL da imagem de capa <span className="text-rc2-ebony/40 font-normal">(opcional)</span>
        </label>
        <input
          id="cover_url" name="cover_url" type="url"
          defaultValue={post?.cover_url ?? ""}
          className={inputBase}
          placeholder="https://..."
        />
        <FieldError errors={state.errors} field="cover_url" />
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-1.5">Conteúdo</label>
        <input type="hidden" name="content" ref={contentInputRef} defaultValue={content} />
        <RichEditor content={content} onChange={setContent} />
        <FieldError errors={state.errors} field="content" />
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-rc2-ebony mb-1.5" htmlFor="status">Status</label>
        <select id="status" name="status" defaultValue={post?.status ?? "draft"} className={`${inputBase} cursor-pointer`}>
          <option value="draft">Rascunho</option>
          <option value="published">Publicado</option>
          <option value="archived">Arquivado</option>
        </select>
        <FieldError errors={state.errors} field="status" />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-8 h-11 bg-rc2-orange text-white font-semibold text-sm uppercase tracking-wide hover:bg-rc2-orange/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? "Salvando..." : "Salvar post"}
        </button>
        <Link href="/admin/posts" className="px-4 h-11 flex items-center text-sm text-rc2-ebony/60 hover:text-rc2-ebony transition-colors">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
