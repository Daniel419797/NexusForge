import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — NexusForge",
  description: "NexusForge Privacy Policy: how we collect, use, and protect your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-white">
      {/* Header */}
      <header className="border-b border-white/6 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <nav className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs font-mono">NF</span>
            </div>
            <span className="text-sm font-bold">
              <span className="text-purple-400">Nexus</span>Forge
            </span>
          </Link>
          <Link href="/terms" className="text-xs text-white/40 hover:text-white/60 transition-colors">
            Terms of Service
          </Link>
        </nav>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-white/40 mb-10">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>

        <div className="space-y-8 text-sm text-white/60 leading-relaxed">
          {/* 1 — Controller Identity */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Data Controller</h2>
            <p>
              NexusForge (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is the data controller responsible for your personal data.
              NexusForge is an open-source Backend-as-a-Service platform that can be self-hosted or used as a managed service.
            </p>
            <p className="mt-2">
              For privacy inquiries, please contact us at: <strong className="text-white/80">privacy@nexusforge.dev</strong>
            </p>
          </section>

          {/* 2 — Data We Collect */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. Data We Collect</h2>
            <p>We collect data in the following categories:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li><strong className="text-white/80">Account Data:</strong> Email address, name, hashed password (Argon2id), and account role.</li>
              <li><strong className="text-white/80">Authentication Data:</strong> OAuth profile information (Google/GitHub) if you choose social login.</li>
              <li><strong className="text-white/80">Usage Data:</strong> IP address, user agent, timestamps of authentication events, API requests, and feature usage.</li>
              <li><strong className="text-white/80">Project Data:</strong> Configuration, database settings, plugin preferences, and deployment metadata you provide.</li>
              <li><strong className="text-white/80">Communication Data:</strong> Email address for transactional and optional marketing communications.</li>
              <li><strong className="text-white/80">Consent Records:</strong> Immutable logs of your consent decisions and timestamps.</li>
            </ul>
          </section>

          {/* 3 — Legal Basis (GDPR Art. 6) */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. Legal Basis for Processing</h2>
            <p>We process your personal data under the following legal bases (GDPR Art. 6):</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li><strong className="text-white/80">Contract Performance (Art. 6(1)(b)):</strong> To provide the NexusForge platform, authenticate your account, and manage your projects.</li>
              <li><strong className="text-white/80">Legitimate Interest (Art. 6(1)(f)):</strong> For security monitoring, fraud prevention, platform improvement, and audit logging.</li>
              <li><strong className="text-white/80">Consent (Art. 6(1)(a)):</strong> For marketing emails, analytics cookies, and third-party data sharing — only when you explicitly opt in.</li>
              <li><strong className="text-white/80">Legal Obligation (Art. 6(1)(c)):</strong> To comply with applicable laws, including HIPAA audit log retention when HIPAA mode is enabled.</li>
            </ul>
          </section>

          {/* 4 — How We Use Your Data */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. How We Use Your Data</h2>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>To create and manage your account and authenticate sessions.</li>
              <li>To send transactional emails (verification, password reset, security alerts).</li>
              <li>To provide, maintain, and improve the NexusForge platform.</li>
              <li>To monitor and prevent security threats, fraud, and abuse.</li>
              <li>To maintain audit logs for compliance (GDPR, HIPAA).</li>
              <li>To send marketing communications (only with your explicit consent).</li>
              <li>To respond to support requests and legal obligations.</li>
            </ul>
          </section>

          {/* 5 — Data Retention */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Data Retention</h2>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li><strong className="text-white/80">Account Data:</strong> Retained while your account is active. Deleted upon account deletion request (GDPR Art. 17).</li>
              <li><strong className="text-white/80">Audit Logs:</strong> Retained for a minimum of 6 years when HIPAA mode is enabled, otherwise 2 years.</li>
              <li><strong className="text-white/80">Consent Records:</strong> Retained indefinitely as immutable proof of consent decisions.</li>
              <li><strong className="text-white/80">Transactional Emails:</strong> Delivery logs retained for 30 days.</li>
            </ul>
          </section>

          {/* 6 — Data Sharing */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Data Sharing & Third Parties</h2>
            <p>We do not sell your personal data. We may share data with:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li><strong className="text-white/80">Infrastructure Providers:</strong> Hosting and database services that process data on our behalf.</li>
              <li><strong className="text-white/80">OAuth Providers:</strong> Google and GitHub, when you choose social login.</li>
              <li><strong className="text-white/80">Law Enforcement:</strong> When required by applicable law or court order.</li>
            </ul>
            <p className="mt-2">Self-hosted instances process all data on your own infrastructure with no data transmitted to NexusForge.</p>
          </section>

          {/* 7 — Your Rights (GDPR Art. 12-23) */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Your Rights</h2>
            <p>Under GDPR, you have the following rights:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li><strong className="text-white/80">Access (Art. 15):</strong> Export all your data from Settings → Compliance → Export Data.</li>
              <li><strong className="text-white/80">Rectification (Art. 16):</strong> Update your profile information at any time.</li>
              <li><strong className="text-white/80">Erasure (Art. 17):</strong> Permanently delete your account from Settings → Compliance → Delete Account.</li>
              <li><strong className="text-white/80">Restrict Processing (Art. 18):</strong> Contact us to restrict processing of your data.</li>
              <li><strong className="text-white/80">Data Portability (Art. 20):</strong> Export your data in machine-readable JSON format.</li>
              <li><strong className="text-white/80">Object (Art. 21):</strong> Withdraw consent for marketing emails and analytics at any time.</li>
              <li><strong className="text-white/80">Withdraw Consent (Art. 7(3)):</strong> Manage all consent preferences from Settings → Compliance.</li>
            </ul>
          </section>

          {/* 8 — Security */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Security Measures</h2>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Passwords hashed with Argon2id (memory-hard).</li>
              <li>AES-256-GCM encryption for sensitive data at rest.</li>
              <li>TLS/HTTPS enforced in production.</li>
              <li>JWT-based authentication with short-lived access tokens.</li>
              <li>Rate limiting and account lockout protection.</li>
              <li>HIPAA-grade session management and PHI encryption when enabled.</li>
              <li>Comprehensive audit logging of all security events.</li>
            </ul>
          </section>

          {/* 9 — Cookies */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3">9. Cookies & Local Storage</h2>
            <p>
              We use essential cookies and local storage for authentication session management. Non-essential cookies
              (analytics, marketing) are only set after you explicitly consent via the cookie banner. You can manage
              cookie preferences at any time.
            </p>
          </section>

          {/* 10 — International Transfers */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3">10. International Data Transfers</h2>
            <p>
              If you are located in the EU/EEA, your data may be processed in countries outside the EU/EEA. We ensure
              appropriate safeguards are in place, including Standard Contractual Clauses (SCCs) where required.
              Self-hosted instances keep all data within your chosen jurisdiction.
            </p>
          </section>

          {/* 11 — Changes */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Material changes will be communicated via email
              or an in-app notification. Continued use of the platform after changes constitutes acceptance of
              the updated policy.
            </p>
          </section>

          {/* 12 — Contact */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3">12. Contact Us</h2>
            <p>
              For any privacy-related questions, data requests, or to exercise your rights, contact us at:
            </p>
            <p className="mt-2"><strong className="text-white/80">Email:</strong> privacy@nexusforge.dev</p>
            <p><strong className="text-white/80">Response Time:</strong> Within 30 days as required by GDPR Art. 12(3).</p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-white/6 flex items-center justify-between">
          <Link href="/" className="text-xs text-white/30 hover:text-white/50 transition-colors">
            ← Back to Home
          </Link>
          <Link href="/terms" className="text-xs text-white/30 hover:text-white/50 transition-colors">
            Terms of Service →
          </Link>
        </div>
      </main>
    </div>
  );
}
