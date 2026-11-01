import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: `Privacy Policy — ${LEGAL.siteName}`,
  description: 'How PlateVision AI collects, uses, stores and protects your personal data, and how to exercise your GDPR and CCPA rights.'
};

const mail = <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>;

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={`This policy explains what personal data ${LEGAL.siteName} collects, why we collect it, who we share it with, and the rights you have over it. It is written to meet the requirements of the EU/UK GDPR and the California Consumer Privacy Act (CCPA/CPRA).`}
      sections={[
        {
          id: 'controller',
          title: 'Who we are',
          content: (
            <p>
              {LEGAL.operatorName} (&quot;we&quot;, &quot;us&quot;) operates {LEGAL.siteName} and is the data controller
              for the personal data described here. Contact us about privacy at any time: {mail}.
            </p>
          )
        },
        {
          id: 'data-we-collect',
          title: 'Data we collect',
          content: (
            <>
              <ul>
                <li><strong>Account data:</strong> email address and a securely hashed password (we never store your password in plain text).</li>
                <li><strong>Profile &amp; health-related data:</strong> name, age, gender, height, current and target weight, workout frequency, and goals you enter during onboarding.</li>
                <li><strong>Meal data:</strong> photos of meals you upload, the AI-generated nutrition breakdown, any corrections you make, and the date/time you logged each meal.</li>
                <li><strong>Technical data:</strong> IP address and basic request information processed temporarily for security (e.g. rate limiting and abuse prevention).</li>
              </ul>
              <p>
                Height, weight and diet information can be considered <strong>health data</strong> (a special category under
                GDPR). We process it only because you explicitly provide it to use the service, and you can delete it at any time.
              </p>
            </>
          )
        },
        {
          id: 'how-we-use',
          title: 'How and why we use your data',
          content: (
            <ul>
              <li><strong>To provide the service</strong> (contract): create your account, calculate your calorie and macro targets, analyze meal photos and keep your food journal.</li>
              <li><strong>With your explicit consent</strong>: processing health-related data you enter. You can withdraw consent by deleting your account.</li>
              <li><strong>Security</strong> (legitimate interest): protecting accounts, preventing fraud, spam and abuse.</li>
              <li><strong>Legal obligations</strong>: responding to lawful requests from authorities.</li>
            </ul>
          )
        },
        {
          id: 'sharing',
          title: 'Who we share data with',
          content: (
            <>
              <p>We do <strong>not sell or rent</strong> your personal data, and we do not share it for cross-context behavioral advertising. We use these service providers (processors) only to run the app:</p>
              <ul>
                <li><strong>Google (Gemini API)</strong> — analyzes the meal photos you submit to estimate nutrition. Depending on the API service tier in use, Google may retain inputs for abuse monitoring or service improvement under its own terms. Avoid including people or personal documents in meal photos.</li>
                <li><strong>MongoDB Atlas</strong> — stores your account, profile and meal journal.</li>
                <li><strong>Cloudinary</strong> — stores uploaded meal images.</li>
                <li><strong>Our hosting provider</strong> — serves the website and processes requests.</li>
              </ul>
              <p>Some providers may process data outside your country (including the United States). Where required, transfers rely on appropriate safeguards such as the EU Standard Contractual Clauses.</p>
            </>
          )
        },
        {
          id: 'retention',
          title: 'How long we keep data',
          content: (
            <p>
              We keep your account and meal journal for as long as your account is active. When you delete your account,
              your profile and all logged meals are deleted from our database immediately; residual copies in backups are
              overwritten in the normal backup cycle. Security logs are kept only as long as needed to protect the service.
            </p>
          )
        },
        {
          id: 'security',
          title: 'How we protect your data',
          content: (
            <ul>
              <li>All traffic is encrypted with HTTPS (TLS); browsers are instructed to always use HTTPS (HSTS).</li>
              <li>Passwords are hashed with bcrypt. Sessions use signed, HttpOnly, Secure cookies that JavaScript cannot read.</li>
              <li>Each account can only access its own meals — access is enforced on the server.</li>
              <li>Login, sign-up and AI endpoints are rate-limited to block brute-force and automated abuse.</li>
              <li>Secrets and API keys are kept server-side only.</li>
            </ul>
          )
        },
        {
          id: 'your-rights',
          title: 'Your rights',
          content: (
            <>
              <p>Depending on where you live, you have the right to:</p>
              <ul>
                <li><strong>Access &amp; portability</strong> — download all your data from the dashboard (&quot;Download my data&quot;).</li>
                <li><strong>Erasure</strong> — permanently delete your account and meals from the dashboard (&quot;Delete my account&quot;).</li>
                <li><strong>Rectification</strong> — correct your profile or any logged meal.</li>
                <li><strong>Object / restrict processing</strong> and <strong>withdraw consent</strong> at any time.</li>
                <li><strong>Know, delete and opt out</strong> (California residents). We do not sell or share personal information, so there is nothing to opt out of — and we will never discriminate against you for exercising your rights.</li>
                <li><strong>Complain</strong> to your local data protection authority.</li>
              </ul>
              <p>For any request we can&apos;t handle in-app, email {mail}. We respond within 30 days.</p>
            </>
          )
        },
        {
          id: 'children',
          title: 'Children',
          content: (
            <p>
              {LEGAL.siteName} is not intended for children under {LEGAL.minimumAge}. We do not knowingly collect data from
              them. If you believe a child has created an account, contact {mail} and we will delete it.
            </p>
          )
        },
        {
          id: 'cookies',
          title: 'Cookies',
          content: <p>We only use strictly necessary cookies and local storage. See our <a href="/cookies">Cookie Policy</a>.</p>
        },
        {
          id: 'changes',
          title: 'Changes to this policy',
          content: <p>If we make material changes, we will update the date above and notify signed-in users in the app before the changes take effect.</p>
        }
      ]}
    />
  );
}
