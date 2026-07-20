import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
}) {
  return (
    <header className="app-page-header">
      <div className="min-w-0 flex-1">
        {eyebrow ? <p className="app-page-eyebrow">{eyebrow}</p> : null}
        <div className="mt-1 flex items-start gap-2.5">
          {Icon ? (
            <span className="app-page-icon mt-0.5 shrink-0">
              <Icon size={20} />
            </span>
          ) : null}
          <div className="min-w-0">
            <h1 className="app-page-title">{title}</h1>
            {description ? <p className="app-page-description">{description}</p> : null}
          </div>
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function PageSection({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="app-section-title">{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function PointsPill({ children }: { children: ReactNode }) {
  return <div className="app-points-pill">{children}</div>;
}

export function AppPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`app-panel ${className}`.trim()}>{children}</div>;
}

export function BtnPrimary({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return (
    <button type="button" className={`app-btn-primary ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

export function BtnSecondary({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return (
    <button type="button" className={`app-btn-secondary ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
