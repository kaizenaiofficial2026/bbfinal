/**
 * Privacy Policy legal copy supplied in `We Value Your Privacy.docx`.
 *
 * Keep this content in one component so the checkout dialog remains easy to
 * reuse elsewhere without duplicating or drifting from the approved wording.
 * The legal copy is intentionally English-only, matching the existing Terms &
 * Conditions content.
 */
export function PrivacyPolicyContent() {
  return (
    <div className="legal-prose privacy-policy-prose">
      <p>
        This privacy policy sets out how we use and protects any information
        that you give us when you use this website.
      </p>
      <p>
        We are committed to ensuring that your privacy is protected. Should we
        ask you to provide certain information by which you can be identified
        when using this website, then you can be assured that it will only be
        used in accordance with this privacy statement.
      </p>
      <p>
        We may change this policy from time to time by updating this page. You
        should check this page from time to time to ensure that you are happy
        with any changes.
      </p>

      <section>
        <h2>What we collect</h2>
        <p>We may collect the following information:</p>
        <ul className="privacy-policy-list">
          <li>name and job title</li>
          <li>contact information including email address</li>
          <li>
            demographic information such as postcode, preferences and interests
          </li>
        </ul>
      </section>

      <section>
        <h2>What we do with the information we gather</h2>
        <p>
          We require this information to understand your needs and provide you
          with a better service, and for the following reasons:
        </p>
        <ul className="privacy-policy-list">
          <li>Internal record keeping.</li>
          <li>We may use the information to improve our products and services.</li>
          <li>
            We may periodically send promotional email about new products,
            special offers or other information which we think you may find
            interesting using the email address which you have provided, to do
            this you need to opt in for this service.
          </li>
          <li>We may contact you by email, phone, or mail.</li>
          <li>
            We may use the information to customise the website according to
            your interests.
          </li>
        </ul>
      </section>

      <section>
        <h2>Security</h2>
        <p>
          We are committed to ensuring that your information is secure. To
          prevent unauthorised access or disclosure we have put in place
          suitable physical, electronic and managerial procedures to safeguard
          and secure the information we collect online.
        </p>
      </section>

      <section>
        <h2>How we use cookies</h2>
        <p>
          A cookie is an element of data that a website can send to your
          browser, which may then store it on your system. We use cookies in some
          of our pages to store your preferences and record session information.
          The information that we collect is then used to ensure a more
          personalized service level for our users. Please be assured though
          that your credit card number will not be saved for security reasons.
          You must type the credit card number each time you make a purchase.
        </p>
        <p>
          You can adjust settings on your browser so that you will be notified
          when you receive a cookie. Please refer to your browser documentation
          to check if cookies have been enabled on your computer or to request
          not to receive cookies. As cookies allow you to take advantage of some
          of the Website’s essential features, we recommend that you accept
          cookies. For instance, if you block or otherwise reject our cookies,
          you will not be able to book flights or use any products or services
          on the Website that require you to log-in.
        </p>
        <p>
          This information is treated confidentially and will not be shared with
          anyone outside of the Company unless otherwise stated in this Privacy
          Policy. We will only use this information to make informed decisions
          regarding the purchase of online advertising.
        </p>
      </section>

      <section>
        <h2>Links to other websites</h2>
        <p>
          Our website may contain links to enable you to visit other websites of
          interest easily. However, once you have used these links to leave our
          site, you should note that we do not have any control over that other
          website. Therefore, we cannot be responsible for the protection and
          privacy of any information which you provide whilst visiting such
          sites and such sites are not governed by this privacy statement. You
          should exercise caution and look at the privacy statement applicable
          to the website in question.
        </p>
      </section>

      <section>
        <h2>Controlling your personal information</h2>
        <p>
          You may choose to restrict the collection or use of your personal
          information in the following ways:
        </p>
        <p>
          We will not sell, distribute or lease your personal information to
          third parties unless we have your permission or are required by law to
          do so.
        </p>
        <p>
          You may request details of personal information which we hold about
          you under the Data Protection Act 1998
        </p>
        <p>
          If you believe that any information we are holding on you is incorrect
          or incomplete, please write to or email us as soon as possible, at the
          above address. We will promptly correct any information found to be
          incorrect.
        </p>
      </section>
    </div>
  );
}
