import { HONEYPOT_FIELD } from "@/lib/security/honeypot";

/**
 * The concealed spam-trap input every public form renders. Hidden from humans
 * and from assistive tech, skipped by the tab order, and named so that browser
 * autofill has no reason to touch it — see lib/security/honeypot.ts.
 */
export default function HoneypotField({ id = "hp" }: { id?: string }) {
  return (
    <div className="visually-hidden" aria-hidden="true">
      <label htmlFor={id}>Leave this field empty</label>
      <input
        id={id}
        name={HONEYPOT_FIELD}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </div>
  );
}
