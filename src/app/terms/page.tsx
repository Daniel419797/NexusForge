import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — NexusForge",
  description: "NexusForge Terms of Service: your rights and obligations when using the platform.",
};

export default function TermsOfServicePage() {
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
          <Link href="/privacy" className="text-xs text-white/40 hover:text-white/60 transition-colors">
            Privacy Policy
          </Link>
        </nav>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Terms of Service</h1>
        <p className="text-sm text-white/40 mb-10">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>

        <div className="space-y-8 text-sm text-white/60 leading-relaxed">
          {/* 1 */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By creating an account or using NexusForge (&quot;the Platform&quot;), you agree to these Terms of Service.
              If you do not agree, do not use the Platform. These terms apply to both the managed (platform-hosted) and
              self-hosted versions of NexusForge.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. Description of Service</h2>
            <p>
              NexusForge is an open-source, multi-tenant Backend-as-a-Service (BaaS) platform that provides
              authentication, database management, real-time communication, AI agents, Web3/blockchain integration,
              and a plugin marketplace. The Platform may be accessed as a hosted service or self-deployed.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. Account Registration</h2>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>You must provide a valid email address and accurate information.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must be at least 16 years of age (or the age of digital consent in your jurisdiction).</li>
              <li>One person may not maintain more than one free account.</li>
              <li>You are responsible for all activity under your account.</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Acceptable Use</h2>
            <p>You agree NOT to use the Platform to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Violate any applicable law, regulation, or third-party rights.</li>
              <li>Transmit malware, viruses, or any malicious code.</li>
              <li>Attempt to gain unauthorized access to the Platform, other accounts, or connected systems.</li>
              <li>Perform denial-of-service attacks, exploit vulnerabilities, or run security testing without authorization.</li>
              <li>Store or process illegal content, including but not limited to CSAM.</li>
              <li>Circumvent rate limits, security controls, or authentication mechanisms.</li>
              <li>Use the Platform for spamming, phishing, or sending unsolicited bulk communications.</li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Your Data & Content</h2>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>You retain all rights to the data and content you store on the Platform.</li>
              <li>You grant NexusForge a limited license to process your data solely to provide the service.</li>
              <li>You are responsible for maintaining backups of your data.</li>
              <li>Upon account deletion, your data will be permanently removed per our Privacy Policy.</li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Self-Hosted Instances</h2>
            <p>
              If you self-host NexusForge, you are the data controller and are solely responsible for:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Compliance with GDPR, HIPAA, and all applicable regulations.</li>
              <li>Infrastructure security, backups, and access controls.</li>
              <li>Proper configuration of encryption keys, TLS certificates, and environment variables.</li>
              <li>Maintaining your own Privacy Policy and Terms of Service for your end users.</li>
            </ul>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Service Availability</h2>
            <p>
              We strive for high availability but provide the Platform &quot;as is&quot; without guarantees of uninterrupted
              service. Planned maintenance will be communicated in advance when possible. Self-hosted users
              manage their own uptime.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Intellectual Property</h2>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>The NexusForge source code is available under its open-source license.</li>
              <li>The NexusForge name, logo, and branding are proprietary and may not be used without permission.</li>
              <li>Third-party plugins and integrations are subject to their own licenses.</li>
            </ul>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, NexusForge and its contributors shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenue,
              whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses
              resulting from your use of the Platform.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3">10. Disclaimer of Warranties</h2>
            <p>
              The Platform is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or
              implied, including but not limited to implied warranties of merchantability, fitness for a particular
              purpose, and non-infringement.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3">11. Account Termination</h2>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>You may delete your account at any time from Settings → Compliance → Delete Account.</li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
              <li>Account deletion is permanent and irreversible — all data will be erased per GDPR Art. 17.</li>
            </ul>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3">12. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. Material changes will be communicated via email or
              in-app notification at least 30 days before they take effect. Continued use of the Platform after
              changes constitutes acceptance.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3">13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable laws. Any disputes
              shall be resolved through good-faith negotiation first, then through binding arbitration if necessary.
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2 className="text-lg font-bold text-white mb-3">14. Contact</h2>
            <p>
              For questions about these Terms, contact us at: <strong className="text-white/80">legal@nexusforge.dev</strong>
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-white/6 flex items-center justify-between">
          <Link href="/" className="text-xs text-white/30 hover:text-white/50 transition-colors">
            ← Back to Home
          </Link>
          <Link href="/privacy" className="text-xs text-white/30 hover:text-white/50 transition-colors">
            Privacy Policy →
          </Link>
        </div>
      </main>
    </div>
  );
}
