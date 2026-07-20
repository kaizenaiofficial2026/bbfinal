/**
 * The KaizenAI wordmark — see LOGO.md for the spec.
 *
 * This is the BUILDER's mark, not Beyond Borders branding. Its only use is the
 * "made with ♥" credit in the admin sidebar; it must never appear on the public
 * site, in emails, or on receipts, all of which carry the Beyond Borders logo.
 *
 * Syne 800 with tight tracking is loaded as `--font-syne` in app/layout.tsx.
 */
export default function Logo({ className }: { className?: string }) {
  return (
    <span className={className ? `kaizen-logo ${className}` : "kaizen-logo"}>
      Kaizen<span className="kaizen-logo-ai">AI</span>
    </span>
  );
}
