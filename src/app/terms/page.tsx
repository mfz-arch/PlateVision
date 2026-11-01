import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: `Terms of Service — ${LEGAL.siteName}`,
  description: 'The rules for using PlateVision AI, including the health disclaimer, limitation of liability, intellectual property and DMCA copyright procedure.'
};

const mail = <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>;

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={`These Terms govern your use of ${LEGAL.siteName}. By creating an account or using the service you agree to them. If you do not agree, please do not use the service.`}
      sections={[
        {
          id: 'service',
          title: 'The service',
          content: (
            <p>
              {LEGAL.siteName} lets you photograph meals and receive AI-generated estimates of calories and macronutrients,
              and keep a personal food journal. Features may change, and we may suspend or discontinue parts of the service
              at any time.
            </p>
          )
        },
        {
          id: 'health-disclaimer',
          title: 'Health & medical disclaimer',
          content: (
            <>
              <p><strong>{LEGAL.siteName} is not a medical device and does not provide medical, nutritional or dietary advice.</strong></p>
              <ul>
                <li>All nutrition values, calorie targets and &quot;AI advice&quot; are <strong>automated estimates</strong> and can be inaccurate. Portion sizes and ingredients cannot be reliably determined from a photo.</li>
                <li>Do not rely on the app to manage allergies, diabetes, eating disorders, pregnancy, or any medical condition.</li>
                <li><strong>FTC Compliance &amp; Realistic Results:</strong> Any testimonials, meal breakdowns, or macronutrient projections reflect automated estimations and individual experiences. They do not constitute guarantees of weight loss, muscle gain, or metabolic results. The FDA has not evaluated statements provided by this service.</li>
                <li>Always consult a doctor or registered dietitian before changing your diet or exercise routine.</li>
                <li>If you experience a medical emergency, contact your local emergency services immediately.</li>
              </ul>
            </>
          )
        },
        {
          id: 'accounts',
          title: 'Your account',
          content: (
            <ul>
              <li>You must be at least {LEGAL.minimumAge} years old to create an account.</li>
              <li>Provide accurate information and keep your password confidential. You are responsible for activity on your account.</li>
              <li>Tell us promptly at {mail} if you suspect unauthorized access.</li>
              <li>You may delete your account at any time from the dashboard.</li>
            </ul>
          )
        },
        {
          id: 'acceptable-use',
          title: 'Acceptable use',
          content: (
            <>
              <p>You agree not to:</p>
              <ul>
                <li>upload content that is illegal, infringing, sexually explicit, hateful, or that depicts other people without their consent;</li>
                <li>attempt to access other users&apos; data, probe or break our security, or reverse-engineer the service;</li>
                <li>use bots, scrapers or automated scripts, or overload the service (including the AI endpoints);</li>
                <li>resell or commercially exploit the service without our written permission.</li>
              </ul>
              <p>We may suspend or terminate accounts that violate these Terms.</p>
            </>
          )
        },
        {
          id: 'your-content',
          title: 'Your content',
          content: (
            <p>
              You keep ownership of the meal photos and data you upload. You grant us a limited, non-exclusive license to
              store, process and display that content solely to operate the service for you (including sending photos to our
              AI provider for analysis). This license ends when you delete the content or your account. You confirm you have
              the right to upload any content you submit.
            </p>
          )
        },
        {
          id: 'ip',
          title: 'Our intellectual property',
          content: (
            <p>
              The {LEGAL.siteName} name, logo, design, software and original text are owned by {LEGAL.operatorName} and
              protected by copyright and trademark laws. © {new Date().getFullYear()} {LEGAL.operatorName}. All rights reserved.
              Sample food images are used under the Unsplash License. Icons are from Lucide (ISC License).
            </p>
          )
        },
        {
          id: 'dmca',
          title: 'Copyright complaints (DMCA)',
          content: (
            <>
              <p>
                We respect intellectual property rights. If you believe content on {LEGAL.siteName} infringes your copyright,
                send a notice to our designated agent at <a href={`mailto:${LEGAL.dmcaEmail}`}>{LEGAL.dmcaEmail}</a> including:
              </p>
              <ul>
                <li>your physical or electronic signature;</li>
                <li>identification of the copyrighted work you claim is infringed;</li>
                <li>identification of the infringing material and where it is located;</li>
                <li>your contact information (address, phone, email);</li>
                <li>a statement that you have a good-faith belief the use is not authorized by the owner, its agent, or the law;</li>
                <li>a statement, under penalty of perjury, that the information is accurate and you are authorized to act on the owner&apos;s behalf.</li>
              </ul>
              <p>
                We will remove or disable access to infringing material and, where appropriate, terminate repeat infringers.
                If your content was removed and you believe this was a mistake, you may send a counter-notice to the same address.
              </p>
            </>
          )
        },
        {
          id: 'warranty',
          title: 'No warranty',
          content: (
            <p>
              The service is provided <strong>&quot;as is&quot; and &quot;as available&quot;</strong>, without warranties of
              any kind, express or implied, including accuracy of nutrition estimates, fitness for a particular purpose, and
              uninterrupted availability — to the maximum extent permitted by law.
            </p>
          )
        },
        {
          id: 'liability',
          title: 'Limitation of liability',
          content: (
            <p>
              To the maximum extent permitted by law, {LEGAL.operatorName} will not be liable for any indirect, incidental,
              special, consequential or punitive damages, or for any health outcome, loss of data or loss of profits arising
              from your use of the service. Our total liability for any claim is limited to the greater of the amount you paid
              us in the 12 months before the claim or 50 EUR/USD. Nothing in these Terms limits liability that cannot be
              limited by law, or your statutory rights as a consumer.
            </p>
          )
        },
        {
          id: 'law',
          title: 'Governing law & changes',
          content: (
            <>
              <p>
                These Terms are governed by the laws of {LEGAL.governingLaw}, without prejudice to mandatory consumer
                protection rules of your country of residence.
              </p>
              <p>
                We may update these Terms. For material changes we will notify you in the app in advance; continuing to use
                the service after the effective date means you accept the updated Terms. Questions? Contact {mail}.
              </p>
            </>
          )
        }
      ]}
    />
  );
}
