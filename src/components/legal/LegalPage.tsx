import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera } from 'lucide-react';
import { LEGAL } from '@/lib/legal';

interface LegalPageProps {
  title: string;
  intro: string;
  sections: { id: string; title: string; content: React.ReactNode }[];
}

const OTHER_PAGES = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/cookies', label: 'Cookie Policy' },
  { href: '/accessibility', label: 'Accessibility' }
];

/** Shared, accessible layout for all legal pages (single h1, ToC, semantic sections). */
export function LegalPage({ title, intro, sections }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-[#14171d] text-white">
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#14171d]/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group" aria-label="PlateVision home">
            <span className="w-9 h-9 rounded-xl bg-[#23262f] border border-[#b6ff2e]/40 flex items-center justify-center">
              <Camera className="w-5 h-5 text-[#b6ff2e]" aria-hidden="true" />
            </span>
            <span className="text-base font-extrabold tracking-wider">
              PLATE<span className="text-[#b6ff2e]">VISION</span>
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#c4c8d2] bg-white/5 border border-white/10 hover:text-[#b6ff2e] hover:border-[#b6ff2e]/40 transition-all"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to app
          </Link>
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1f232b] via-[#1a1d24] to-[#14171d] p-7 sm:p-10">
          <div aria-hidden="true" className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#b6ff2e]/10 blur-3xl" />
          <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#b6ff2e]">Legal</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm text-[#c4c8d2] leading-relaxed">{intro}</p>
          <p className="mt-4 text-xs text-[#9ea3b0]">Last updated: {LEGAL.lastUpdated}</p>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr]">
          <nav aria-label="On this page" className="lg:sticky lg:top-24 self-start">
            <p className="text-[11px] uppercase tracking-widest font-bold text-[#9ea3b0] mb-3">On this page</p>
            <ol className="space-y-2 text-sm">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-[#c4c8d2] hover:text-[#b6ff2e] transition-colors">
                    {i + 1}. {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="space-y-10 legal-prose">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="scroll-mt-24">
                <h2 id={`${s.id}-title`} className="text-xl font-extrabold text-white mb-3">
                  <span className="text-[#b6ff2e] mr-2">{i + 1}.</span>{s.title}
                </h2>
                <div className="space-y-3 text-sm text-[#c4c8d2] leading-relaxed">{s.content}</div>
              </section>
            ))}
          </article>
        </div>
      </main>

      <footer className="border-t border-white/[0.08] py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9ea3b0]">
          <p>© {new Date().getFullYear()} {LEGAL.operatorName}. All rights reserved.</p>
          <nav aria-label="Legal" className="flex flex-wrap gap-4">
            {OTHER_PAGES.map((p) => (
              <Link key={p.href} href={p.href} className="hover:text-[#b6ff2e] transition-colors">{p.label}</Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
