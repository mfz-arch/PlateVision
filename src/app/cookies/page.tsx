import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';
import { CookieSettingsButton } from '@/components/legal/CookieSettingsButton';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: `Cookie Policy — ${LEGAL.siteName}`,
  description: 'The cookies and local storage PlateVision AI uses. We only use strictly necessary storage — no advertising or tracking cookies.'
};

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      intro="We keep this simple: PlateVision AI only uses storage that is strictly necessary for the app to work. We do not use advertising, analytics or cross-site tracking cookies."
      sections={[
        {
          id: 'what',
          title: 'What cookies are',
          content: (
            <p>
              Cookies and similar technologies (like browser local storage) are small pieces of data saved on your device.
              They let a website remember you between pages and visits.
            </p>
          )
        },
        {
          id: 'what-we-use',
          title: 'What we use',
          content: (
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-left text-xs">
                <caption className="sr-only">Cookies and storage used by PlateVision</caption>
                <thead className="bg-white/5 text-white">
                  <tr>
                    <th scope="col" className="p-3">Name</th>
                    <th scope="col" className="p-3">Type</th>
                    <th scope="col" className="p-3">Purpose</th>
                    <th scope="col" className="p-3">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr><td className="p-3 font-mono">pv_session</td><td className="p-3">Cookie (HttpOnly, essential)</td><td className="p-3">Keeps you securely signed in and ensures you only see your own meals.</td><td className="p-3">30 days</td></tr>
                  <tr><td className="p-3 font-mono">pv_cookie_consent_v1</td><td className="p-3">Local storage (essential)</td><td className="p-3">Remembers your cookie choice.</td><td className="p-3">Until cleared</td></tr>
                  <tr><td className="p-3 font-mono">platevision_user</td><td className="p-3">Local storage (essential)</td><td className="p-3">Caches your profile for faster loading. Removed on sign-out.</td><td className="p-3">Until sign-out</td></tr>
                  <tr><td className="p-3 font-mono">language</td><td className="p-3">Local storage (preference)</td><td className="p-3">Remembers English / French.</td><td className="p-3">Until cleared</td></tr>
                </tbody>
              </table>
            </div>
          )
        },
        {
          id: 'third-party',
          title: 'Third-party cookies',
          content: (
            <p>
              We do not place third-party advertising or analytics cookies. Sample images loaded from Unsplash and
              Cloudinary are served without setting tracking cookies by us. If we ever add optional analytics, they will only
              run after you choose &quot;Accept all&quot;, and this page will be updated first.
            </p>
          )
        },
        {
          id: 'control',
          title: 'Managing your choice',
          content: (
            <>
              <p>You can change your choice at any time:</p>
              <CookieSettingsButton />
              <p>
                You can also delete cookies in your browser settings. Blocking the essential session cookie will prevent you
                from signing in.
              </p>
            </>
          )
        }
      ]}
    />
  );
}
