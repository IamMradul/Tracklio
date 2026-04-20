import './LegalPages.css';

const PrivacyPolicy: React.FC = () => {
  return (
    <main className="legal-page">
      <article className="legal-card">
        <header className="legal-top">
          <div>
            <h1 className="legal-title">Privacy Policy</h1>
            <p className="legal-subtitle">Last updated: April 20, 2026</p>
          </div>
          <a className="legal-home-link" href="#/">Back to StudyNX</a>
        </header>

        <section className="legal-section">
          <h2>1. Overview</h2>
          <p>
            This Privacy Policy explains how StudyNX collects, uses, stores, and protects your
            information when you use the platform. We are committed to handling your data
            responsibly and transparently.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Information We Collect</h2>
          <p>StudyNX may process the following categories of information:</p>
          <ul>
            <li>Account information such as email and display identity from authentication providers.</li>
            <li>Study activity data including sessions, subjects, goals, reminders, and planning entries.</li>
            <li>Integration data from authorized services such as Google Calendar event metadata.</li>
            <li>Technical data like browser type, timestamps, and limited diagnostics for reliability.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. How We Use Information</h2>
          <p>We use collected information only to operate and improve StudyNX, including:</p>
          <ul>
            <li>Authenticating users and securing account access.</li>
            <li>Rendering dashboards, progress analytics, and streak calculations.</li>
            <li>Generating personalized AI study assistance based on your submitted data.</li>
            <li>Syncing approved schedule/session data with connected calendar services.</li>
            <li>Monitoring performance and preventing misuse or security incidents.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Legal Basis and Consent</h2>
          <p>
            We process your data to provide requested services, fulfill platform functionality, and
            respond to your explicit actions such as enabling integrations. Where required, consent
            is requested before accessing third-party APIs.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Data Sharing</h2>
          <p>
            We do not sell your personal data. Information is shared only with service providers
            needed to deliver functionality, such as authentication, database hosting, and optional
            Google API integrations initiated by you.
          </p>
          <p>
            These providers process data under their own terms and security obligations.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Data Retention</h2>
          <p>
            Study data is retained while your account remains active or as needed for service
            continuity. You may request deletion, and we will remove or anonymize applicable data
            subject to legal and security constraints.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Security Measures</h2>
          <p>
            We apply reasonable safeguards including authenticated access, scoped API permissions,
            row-level access controls where available, and secure transport protocols. No system can
            guarantee absolute security, but we continuously improve protections.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. International Processing</h2>
          <p>
            Your information may be processed in regions where our infrastructure or providers
            operate. By using StudyNX, you acknowledge such transfer and processing for service
            delivery purposes.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Your Rights</h2>
          <p>Depending on your jurisdiction, you may have rights to:</p>
          <ul>
            <li>Access a copy of personal data we hold about you.</li>
            <li>Request correction of inaccurate information.</li>
            <li>Request deletion of your personal data.</li>
            <li>Withdraw consent for optional integrations.</li>
            <li>Object to or restrict certain processing activities.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>10. Children and Student Use</h2>
          <p>
            StudyNX is intended for general educational productivity use. If you are under the age
            required in your region to manage online consent, use StudyNX only with appropriate
            guardian or institutional approval.
          </p>
        </section>

        <section className="legal-section">
          <h2>11. Policy Updates</h2>
          <p>
            We may update this Privacy Policy to reflect legal, technical, or product changes.
            Material updates will be indicated by revising the "Last updated" date on this page.
          </p>
        </section>

        <section className="legal-section legal-contact">
          <h2>12. Contact</h2>
          <p>
            For privacy-related requests or questions, contact: mradulg306@gmail.com.
          </p>
        </section>
      </article>
    </main>
  );
};

export default PrivacyPolicy;
