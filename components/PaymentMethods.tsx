/**
 * "We accept" card-network badges (Visa + Mastercard). Presentational + i18n-
 * agnostic (the label is passed in) so it works in both server and client
 * components. Inline SVG — no external image assets, scales crisply.
 */
export default function PaymentMethods({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div className={`payment-methods${className ? ` ${className}` : ""}`}>
      <span className="payment-methods-label">{label}</span>
      <div className="payment-methods-logos">
        {/* Visa */}
        <span className="payment-logo" role="img" aria-label="Visa">
          <svg viewBox="0 0 64 22" xmlns="http://www.w3.org/2000/svg">
            <text
              x="0"
              y="18"
              fontFamily="Arial, Helvetica, sans-serif"
              fontSize="22"
              fontWeight="800"
              fontStyle="italic"
              letterSpacing="1"
              fill="#1A1F71"
            >
              VISA
            </text>
          </svg>
        </span>

        {/* Mastercard */}
        <span className="payment-logo" role="img" aria-label="Mastercard">
          <svg viewBox="0 0 46 34" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <clipPath id="mcLeftCircle">
                <circle cx="18" cy="14" r="11" />
              </clipPath>
            </defs>
            <circle cx="18" cy="14" r="11" fill="#EB001B" />
            <circle cx="28" cy="14" r="11" fill="#F79E1B" />
            {/* The exact intersection of the two circles, in the darker orange. */}
            <circle
              cx="28"
              cy="14"
              r="11"
              fill="#FF5F00"
              clipPath="url(#mcLeftCircle)"
            />
            <text
              x="23"
              y="32"
              textAnchor="middle"
              fontFamily="Arial, Helvetica, sans-serif"
              fontSize="6.2"
              letterSpacing="0.2"
              fill="#4a4a4a"
            >
              mastercard
            </text>
          </svg>
        </span>
      </div>
    </div>
  );
}
