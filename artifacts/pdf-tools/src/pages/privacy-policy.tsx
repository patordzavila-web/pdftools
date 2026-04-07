import { Layout } from "./home";

export function PrivacyPolicy() {
  return (
    <Layout
      title="Privacy Policy"
      description="Privacy policy for PDFTOOLS — how we handle your data, cookies, and Google AdSense advertising."
    >
      <div className="max-w-3xl mx-auto px-6 py-14">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">

          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Overview</h2>
            <p className="text-muted-foreground leading-relaxed">
              PDFTOOLS ("we", "us", or "our") is a free, browser-based PDF toolkit. This Privacy Policy explains what information is collected when you use our website and how it is used. We are committed to protecting your privacy and being transparent about our practices.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. File Processing — Your Files Stay on Your Device</h2>
            <p className="text-muted-foreground leading-relaxed">
              All PDF processing on PDFTOOLS happens entirely within your browser using client-side JavaScript. <strong className="text-foreground">Your files are never uploaded to any server.</strong> We do not have access to the contents of any documents you process using our tools. Files exist only in your browser's memory during the session and are discarded when you close the page or navigate away.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">We do not collect personal information such as your name, email address, or account details. We do not require registration to use any of our tools.</p>
            <p className="text-muted-foreground leading-relaxed">The only data stored locally on your device is:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2 ml-2">
              <li><strong className="text-foreground">Theme preference</strong> — whether you prefer light or dark mode (stored in your browser's localStorage).</li>
              <li><strong className="text-foreground">Recent files list</strong> — file names and tool names of recently processed files (stored in your browser's localStorage). This data never leaves your device.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Cookies and Advertising (Google AdSense)</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We use <strong className="text-foreground">Google AdSense</strong> to display advertisements on our website. Google AdSense uses cookies and similar tracking technologies to serve ads based on your prior visits to this website and other websites on the internet.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to our site and/or other sites on the internet. You may opt out of personalised advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Google Ads Settings</a>.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              For more information on how Google uses data when you use our site, please visit: <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">How Google uses data from sites that use Google's services</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">We use the following third-party services which may collect data according to their own privacy policies:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
              <li>
                <strong className="text-foreground">Google AdSense</strong> — advertising platform. See <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Google's Privacy Policy</a>.
              </li>
              <li>
                <strong className="text-foreground">MyMemory Translation API</strong> — used by the Translate PDF tool to translate extracted text. Text from pages you choose to translate is sent to this service. See <a href="https://mymemory.translated.net/doc/spec.php" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">MyMemory's documentation</a>.
              </li>
              <li>
                <strong className="text-foreground">Google Fonts</strong> — fonts loaded from Google's servers. See <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Google's Privacy Policy</a>.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Analytics</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not currently use any analytics service. We do not track page views, sessions, or user behaviour beyond what Google AdSense collects for advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              PDFTOOLS is not directed at children under the age of 13. We do not knowingly collect any personal information from children. If you believe a child has provided personal information, please contact us and we will take steps to remove it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated date. We encourage you to review this page periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy, you can contact us by visiting our website at <strong className="text-foreground">pdftools.replit.app</strong>.
            </p>
          </section>

        </div>
      </div>
    </Layout>
  );
}
