import Link from "next/link";
import { AlertTriangle, Eye, Pencil } from "lucide-react";
import { formatSaoPauloDateTime } from "@/lib/datetime";
import {
  POST_ANOMALY_LABEL,
  POST_STATUS_LABEL,
  describePostDate,
  detectPostAnomalies,
  groupByMonth,
  type PostListItem,
} from "@/lib/admin/postList";

const STATUS_CLASS: Record<PostListItem["status"], string> = {
  published: "text-rc2-success",
  scheduled: "text-rc2-heading",
  draft: "text-rc2-text-secondary",
};

const actionClass =
  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rc2-heading border border-rc2-border hover:border-rc2-brand-text hover:text-rc2-brand-text transition-colors";

export function PostRow({ post, now }: { post: PostListItem; now: Date }) {
  const date = describePostDate(post);
  const anomalies = detectPostAnomalies(post, now);

  return (
    <li className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-rc2-bg-alt transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-0.5">
          <span
            className={`inline-block px-2 py-0.5 text-xs font-medium border border-rc2-border bg-rc2-surface ${STATUS_CLASS[post.status]}`}
          >
            {POST_STATUS_LABEL[post.status]}
          </span>
          <span className="text-xs text-rc2-text-secondary">
            {date.label} <time dateTime={date.iso}>{formatSaoPauloDateTime(date.iso)}</time>
          </span>
        </div>
        <p className="font-medium text-rc2-heading truncate">{post.title}</p>
        <p className="text-xs text-rc2-text-secondary truncate">/{post.slug}</p>
        {anomalies.length > 0 && (
          <ul className="mt-1.5 space-y-0.5">
            {anomalies.map((code) => (
              <li key={code} className="flex items-center gap-1.5 text-xs font-medium text-rc2-warning">
                <AlertTriangle size={12} aria-hidden="true" />
                {POST_ANOMALY_LABEL[code]}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link href={`/blog/${post.slug}/preview`} target="_blank" rel="noopener noreferrer" className={actionClass}>
          <Eye size={12} aria-hidden="true" />
          Visualizar<span className="sr-only">: {post.title}</span>
        </Link>
        <Link href={`/admin/posts/${post.id}`} className={actionClass}>
          <Pencil size={12} aria-hidden="true" />
          Editar<span className="sr-only">: {post.title}</span>
        </Link>
      </div>
    </li>
  );
}

/** Posts agrupados por mês (Brasília). Um mês que continua na página seguinte repete o cabeçalho. */
export function PostsList({ items, now }: { items: PostListItem[]; now: Date }) {
  const groups = groupByMonth(items);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.key} aria-labelledby={`mes-${group.key}`}>
          <h2 id={`mes-${group.key}`} className="mb-2 text-sm font-semibold text-rc2-heading">
            {group.label}
          </h2>
          <ul className="bg-rc2-surface border border-rc2-border divide-y divide-rc2-border">
            {group.items.map((post) => (
              <PostRow key={post.id} post={post} now={now} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
