import './LegalPages.css';

const TermsOfService: React.FC = () => {
  return (
    <main className="legal-page">
      <article className="legal-card">
        <header className="legal-top">
          <div>
            <h1 className="legal-title">Terms of Service</h1>
            <p className="legal-subtitle">Last updated: April 20, 2026</p>
          </div>
          <a className="legal-home-link" href="#/">Back to StudyNX</a>
        </header>

        <section className="legal-section">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using StudyNX, you agree to be bound by these Terms of Service.
            If you do not agree to these terms, you must not use the service.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Description of Service</h2>
          <p>
            StudyNX is a productivity platform that helps users track study sessions, organize
            academic goals, receive AI-generated study assistance, and optionally sync events to
            third-party services such as Google Calendar.
          </p>
          <p>
            StudyNX may update features over time, including adding, modifying, or removing
            capabilities to improve reliability and user experience.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. Eligibility and Account Responsibilities</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account access and for
            all activity under your account. You agree to provide accurate account information and
            to keep it updated.
          </p>
          <ul>
            <li>You must not use StudyNX for unlawful, abusive, or fraudulent activities.</li>
            <li>You must not attempt unauthorized access to other accounts or systems.</li>
            <li>You must not interfere with normal service operation, security, or performance.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. User Content and Data</h2>
          <p>
            You retain ownership of the study data and content you provide. By using StudyNX, you
            grant permission to process that data only as necessary to deliver the service,
            including analytics, dashboard calculations, and AI assistance outputs.
          </p>
          <p>
            You are responsible for ensuring you have rights to any content you submit and for
            avoiding sensitive personal information in optional text fields unless necessary.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. AI-Generated Assistance Disclaimer</h2>
          <p>
            StudyNX may provide AI-generated recommendations for planning and productivity support.
            These outputs are informational and may occasionally be incomplete or inaccurate.
            You remain responsible for academic decisions and outcomes.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Third-Party Services</h2>
          <p>
            Optional integrations, including Google OAuth and Google Calendar, are subject to the
            terms and privacy policies of their respective providers. StudyNX is not responsible
            for downtime, changes, or restrictions imposed by third-party platforms.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Intellectual Property</h2>
          <p>
            The StudyNX application, branding, design assets, source code structure, and service
            logic are protected by applicable intellectual property laws. You may not copy,
            distribute, or commercially exploit StudyNX materials without permission except as
            allowed under applicable open-source licensing where relevant.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Service Availability and Changes</h2>
          <p>
            StudyNX is provided on an "as is" and "as available" basis. We do not guarantee
            uninterrupted operation, specific uptime, or error-free performance. We may suspend or
            modify features to maintain platform stability, security, or compliance.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, StudyNX and its maintainers are not liable for
            indirect, incidental, special, consequential, or punitive damages, including data loss,
            missed deadlines, productivity impacts, or academic consequences arising from use of
            the service.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Termination</h2>
          <p>
            We reserve the right to suspend or terminate access for violations of these terms,
            abuse of platform features, or actions that threaten security or integrity of StudyNX.
            You may discontinue use at any time.
          </p>
        </section>

        <section className="legal-section">
          <h2>11. Changes to These Terms</h2>
          <p>
            We may revise these terms as the product evolves. Updates will be reflected by the
            "Last updated" date. Continued use after updates indicates acceptance of revised terms.
          </p>
        </section>

        <section className="legal-section legal-contact">
          <h2>12. Contact</h2>
          <p>
            For legal, compliance, or policy questions, contact: mradulg306@gmail.com.
          </p>
        </section>
      </article>
    </main>
  );
};

export default TermsOfService;
