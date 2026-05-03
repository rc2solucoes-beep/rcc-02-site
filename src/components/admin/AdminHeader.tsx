interface AdminHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function AdminHeader({ title, description, action }: AdminHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 px-8 py-6 border-b border-border bg-white">
      <div>
        <h1 className="text-xl font-semibold text-rc2-ebony">{title}</h1>
        {description && (
          <p className="text-sm text-rc2-ebony/60 mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
