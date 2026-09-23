/**
 * Marks a control whose feature does not exist yet.
 *
 * The surface stays visible, so the intended shape of the product is legible,
 * but nothing renders as a link that silently does nothing.
 */
const ComingSoonLabel = ({ children, className = "" }) => (
  <span
    className={`inline-flex items-center gap-1 cursor-not-allowed text-slate-400 ${className}`}
    title="Coming soon"
    aria-disabled="true"
  >
    {children}
    <span className="rounded bg-slate-100 px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
      Soon
    </span>
  </span>
);

export default ComingSoonLabel;
