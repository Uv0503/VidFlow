export function Button({ children, variant = "primary", className = "", ...props }) {
  const styles = {
    primary: "bg-violet-500 text-white hover:bg-violet-400",
    secondary: "bg-white/10 text-white hover:bg-white/15",
    danger: "bg-red-500/15 text-red-300 hover:bg-red-500/25",
    ghost: "bg-transparent text-zinc-300 hover:bg-white/10",
  };
  return (
    <button
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20";

export function Input({ label, className = "", ...props }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-zinc-300">
      {label}
      <input className={`${fieldClass} ${className}`} {...props} />
    </label>
  );
}

export function Textarea({ label, className = "", ...props }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-zinc-300">
      {label}
      <textarea className={`${fieldClass} min-h-32 resize-y ${className}`} {...props} />
    </label>
  );
}

export function Loader({ label = "Loading" }) {
  return (
    <div className="flex min-h-48 items-center justify-center gap-3 text-zinc-400">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-violet-400" />
      {label}
    </div>
  );
}

export function SkeletonGrid({ count = 8 }) {
  return (
    <div className="video-grid">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-video rounded-2xl bg-white/10" />
          <div className="mt-4 h-4 w-4/5 rounded bg-white/10" />
          <div className="mt-2 h-3 w-2/5 rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-16 text-center">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      {description && <p className="mx-auto mt-2 max-w-md text-zinc-500">{description}</p>}
    </div>
  );
}

export function ErrorMessage({ message }) {
  if (!message) return null;
  return <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{message}</div>;
}
