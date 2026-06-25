/**
 * Small rotating ring used inside buttons to signal an in-flight submit. Inherits
 * the button's text colour (currentColor) so it works on light and dark buttons.
 */
export default function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={`btn-spinner${className ? ` ${className}` : ""}`}
      aria-hidden="true"
    />
  );
}
