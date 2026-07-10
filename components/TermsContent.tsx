/**
 * The Terms & Conditions legal copy, shared by the `/terms` page and the
 * `TermsDialog` popup so there's a single source of truth. Intentionally
 * English-only (legal copy is not machine-translated).
 */
export function TermsContent() {
  return (
    <div className="legal-prose">
      <ul className="legal-list">
        <li>
          Payments made for tour packages are{" "}
          <strong>NON-REFUNDABLE</strong>.
        </li>
        <li>
          In the event of any requirement you should abide by to send copies of
          Credit card and passport by e-mail.
        </li>
        <li>
          Beyond Borders reserves the right to cross check credit card details
          once you arrive to Colombo.
        </li>
        <li>
          In the event of fraudulent use of your Credit Card, please refer to the
          below stated guidelines.
          <p>
            In the event of credit card fraud or unauthorized use of your credit
            card by third parties, most banks and credit card companies bear the
            risk and cover all the charges resulting from such fraud or misuse,
            which may sometimes be subject to a deductible (usually set at
            USD&nbsp;50 (or the equivalent in your local currency)). In the event
            that your Credit Card Company or bank charges the deductible from you
            because of unauthorized transactions resulting from a reservation made
            on our Platform, we will pay you this deductible, up to an aggregate
            amount of USD&nbsp;50 (or the equivalent in your local currency). In
            order to identify you, please make sure that you report this fraud to
            your credit card provider (in accordance with its reporting rules and
            procedures) and contact us immediately by email{" "}
            <a href="mailto:info@beyondborders.lk">info@beyondborders.lk</a>.
            Please state &lsquo;credit card fraud&rsquo; in the subject line of
            your email and provide us with evidence of the charged deductible
            (e.g. policy of the credit card company). This identification only
            applies to credit card reservations made using beyondborders.lk secure
            server and the unauthorized use of your credit card resulted through
            our default or negligence and through no fault of your own while using
            the secure server.
          </p>
        </li>
        <li>
          Company has the rights to amend the above Terms and Conditions.
        </li>
      </ul>
      <p className="legal-note">
        If you agree with the above terms and conditions, please mark the box on
        the payment page to continue.
      </p>
    </div>
  );
}
