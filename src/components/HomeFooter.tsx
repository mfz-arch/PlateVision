'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  Scale,
  AlertTriangle,
  FileText,
  Camera,
  CheckCircle2,
  Mail,
  Server,
  Activity,
  ExternalLink
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LEGAL } from '@/lib/legal';

export const HomeFooter: React.FC = () => {
  const { language } = useLanguage();
  const isFr = language === 'fr';

  const handleOpenCookiePreferences = () => {
    try {
      localStorage.removeItem('pv_cookie_consent_v1');
    } catch {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pv:open-cookie-settings'));
    }
  };

  return (
    <footer
      aria-label="Site Footer and Legal Disclaimers"
      className="relative z-20 w-full mt-24 bg-[#070b14] text-slate-400 border-t-2 border-slate-800 shadow-2xl selection:bg-[#b6ff2e] selection:text-[#070b14]"
    >
      {/* 1. TOP TRUST & COMPLIANCE BADGES STRIP */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="font-bold text-white text-[11px] sm:text-xs">
                  {isFr ? 'Chiffrement SSL 256-Bit' : '256-Bit SSL Cloud Security'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {isFr ? 'Protection des données de bout en bout' : 'End-to-end encrypted transmissions'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#b6ff2e]/10 border border-[#b6ff2e]/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-[#b6ff2e]" />
              </div>
              <div>
                <p className="font-bold text-white text-[11px] sm:text-xs">
                  {isFr ? 'Conformité RGPD & CCPA' : 'GDPR & CCPA Data Privacy'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {isFr ? 'Suppression totale en 1 clic' : 'Right to erasure & zero data sale'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <Scale className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <p className="font-bold text-white text-[11px] sm:text-xs">
                  {isFr ? 'Validation Mifflin-St Jeor' : 'Mifflin-St Jeor Science'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {isFr ? 'Normes BMR médicales reconnues' : 'Peer-reviewed metabolic formulas'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-lime-500/10 border border-lime-500/30 flex items-center justify-center shrink-0">
                <Server className="w-4 h-4 text-lime-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#b6ff2e] animate-pulse" />
                  <p className="font-bold text-white text-[11px] sm:text-xs">
                    {isFr ? 'Serveurs Opérationnels' : 'All Systems Operational'}
                  </p>
                </div>
                <p className="text-[10px] text-slate-400">
                  {isFr ? 'Haute disponibilité cloud 99.9%' : '99.9% uptime SLA monitoring'}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 2. MAIN 4-COLUMN STRUCTURED DIRECTORY */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Column 1: Brand & Enterprise Profile (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0f172a] to-black border-2 border-[#b6ff2e]/50 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Camera className="w-5 h-5 text-[#b6ff2e]" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                PLATE<span className="text-[#b6ff2e]">VISION</span> <span className="text-xs px-1.5 py-0.5 rounded-md bg-[#b6ff2e]/20 text-[#b6ff2e] border border-[#b6ff2e]/40 font-mono font-bold">AI</span>
              </span>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              {isFr
                ? 'Plateforme SaaS de pointe alimentée par vision par ordinateur multimodale. Estime la densité calorique et la répartition des macronutriments à partir d\'une simple photographie d\'assiette en moins de 2 secondes.'
                : 'Next-generation SaaS platform powered by multimodal computer vision. Automatically estimates caloric density and volumetric macronutrient breakdown from a single meal photo in under 2 seconds.'}
            </p>

            <div className="pt-2 space-y-2">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-[#b6ff2e] shrink-0" />
                <span>{isFr ? 'Journal nutritionnel pour athlètes et sportifs' : 'Precision food journaling for athletes & wellness'}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-[#b6ff2e] shrink-0" />
                <span>{isFr ? 'Aucune revente de données biométriques' : 'Strict data privacy — zero telemetry monetization'}</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#b6ff2e] hover:underline"
              >
                <span>{isFr ? 'Accès Portail Administration' : 'Executive Admin Portal'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Column 2: Legal & Governance (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <p className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#b6ff2e]" />
              <span>{isFr ? 'Légal & Conformité' : 'Legal & Compliance'}</span>
            </p>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors flex items-center justify-between">
                  <span>{isFr ? 'Conditions Générales d\'Utilisation' : 'Terms of Service'}</span>
                  <span className="text-[10px] text-slate-500 font-mono">EN / FR</span>
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors flex items-center justify-between">
                  <span>{isFr ? 'Politique de Confidentialité' : 'Privacy Policy (GDPR / CCPA)'}</span>
                  <span className="text-[10px] text-slate-500 font-mono">v2.1</span>
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-white transition-colors">
                  {isFr ? 'Politique relative aux Cookies' : 'Cookie & Tracking Policy'}
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleOpenCookiePreferences}
                  className="text-left text-slate-400 hover:text-[#b6ff2e] transition-colors underline underline-offset-4 cursor-pointer font-medium"
                >
                  {isFr ? 'Paramètres & Consentement Cookies' : 'Cookie Preferences & Consent'}
                </button>
              </li>
              <li>
                <Link href="/accessibility" className="hover:text-white transition-colors">
                  {isFr ? 'Déclaration d\'Accessibilité (WCAG 2.1)' : 'Accessibility Statement (WCAG 2.1)'}
                </Link>
              </li>
              <li>
                <Link href="/terms#dmca" className="hover:text-white transition-colors">
                  {isFr ? 'Procédure DMCA & Droit d\'Auteur' : 'DMCA & Copyright Compliance'}
                </Link>
              </li>
              <li>
                <Link href="/terms#health-disclaimer" className="text-amber-400 hover:text-amber-300 transition-colors font-semibold">
                  {isFr ? 'Avertissement Médical Complet' : 'Official Medical Disclaimer'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Technology & Methodology (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <p className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>{isFr ? 'Plateforme' : 'Technology'}</span>
            </p>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>{isFr ? 'Vision Par Ordinateur IA' : 'Multimodal Vision AI'}</li>
              <li>{isFr ? 'Calcul BMR & TDEE' : 'BMR & TDEE Estimation'}</li>
              <li>{isFr ? 'Détection Volumétrique' : 'Volumetric Portion Model'}</li>
              <li>{isFr ? 'Fonction "Fix Result" IA' : 'Real-Time Result Correction'}</li>
              <li>{isFr ? 'Application Web PWA' : 'Progressive Web App'}</li>
              <li>{isFr ? 'Export Données (RGPD Art. 17)' : 'Data Portability (GDPR)'}</li>
            </ul>
          </div>

          {/* Column 4: Contact, Support & Corporate Info (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <p className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-400" />
              <span>{isFr ? 'Support & Contact' : 'Corporate & Inquiries'}</span>
            </p>
            <div className="space-y-2 text-xs">
              <div>
                <p className="text-[11px] text-slate-400 font-bold uppercase">{isFr ? 'Support Utilisateur' : 'Athlete Help Desk'}</p>
                <a href={`mailto:${LEGAL.contactEmail}`} className="text-white hover:text-[#b6ff2e] transition-colors font-mono">
                  {LEGAL.contactEmail}
                </a>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-bold uppercase">{isFr ? 'Questions Juridiques & RGPD' : 'Legal & Privacy Desk'}</p>
                <a href={`mailto:${LEGAL.contactEmail}`} className="text-white hover:text-[#b6ff2e] transition-colors font-mono">
                  privacy@platevision.app
                </a>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-bold uppercase">{isFr ? 'Agent Copyright / DMCA' : 'DMCA Designated Agent'}</p>
                <a href={`mailto:${LEGAL.dmcaEmail}`} className="text-white hover:text-[#b6ff2e] transition-colors font-mono">
                  {LEGAL.dmcaEmail}
                </a>
              </div>
              <div className="pt-2 text-[11px] text-slate-400 leading-snug">
                <p>{isFr ? 'Opéré par :' : 'Operating Entity:'} <strong className="text-white">{LEGAL.operatorName}</strong></p>
                <p className="text-[10px] text-slate-400 mt-0.5">{isFr ? 'Délai de réponse moyen sous 24-48h ouvrées.' : 'Standard inquiry turnaround: 24–48 business hours.'}</p>
              </div>
            </div>
          </div>

        </div>

        {/* 3. CRITICAL LEGAL & MEDICAL DISCLAIMER CALLOUT BOX ("No Chance To Get Sued") */}
        <div className="mt-10 rounded-3xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-amber-950/20 to-black p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-3 border-b border-amber-500/20 pb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-300">
                {isFr
                  ? 'AVERTISSEMENT MÉDICAL OFFICIEL ET MENTIONS LÉGALES OBLIGATOIRES (CONFORMITÉ FDA / FTC / UE)'
                  : 'MANDATORY MEDICAL & REGULATORY DISCLAIMER (FDA, FTC & EU COMPLIANCE)'}
              </h4>
              <p className="text-[11px] text-amber-200/80">
                {isFr
                  ? 'Veuillez lire attentivement ces informations avant d\'utiliser l\'application.'
                  : 'Please review this official notice carefully prior to using PlateVision AI.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-[11px] leading-relaxed text-slate-300 font-normal">
            
            <div className="space-y-2">
              <p>
                <strong className="text-white uppercase font-bold">
                  {isFr ? '1. Absence d\'Appareil Médical & Pas d\'Avis Médical :' : '1. Not a Medical Device & No Medical Advice:'}
                </strong>{' '}
                {isFr
                  ? 'PlateVision AI est un logiciel de journalisation personnelle et d\'estimation nutritionnelle générale. PlateVision AI N\'EST PAS un dispositif médical, n\'est pas homologué par la FDA, l\'EMA ou une quelconque autorité de santé, et ne fournit aucun avis médical, diagnostic, prescription diététique ou protocole thérapeutique. Aucun élément de cette plateforme ne doit remplacer une consultation auprès d\'un médecin, d\'un diététicien nutritionniste agréé ou d\'un professionnel de santé qualifié.'
                  : 'PlateVision AI is an educational self-monitoring software tool and dietary journal. PlateVision AI is NOT a medical device, is not cleared or certified by the FDA, EMA, or any regulatory health body, and does NOT provide medical advice, diagnosis, dietary prescription, or medical treatment. Nothing contained in this service should replace qualified consultation with a licensed physician, registered dietitian, or certified medical specialist.'}
              </p>
              <p>
                <strong className="text-white uppercase font-bold">
                  {isFr ? '2. Nature Estimative des Calculs :' : '2. Algorithmic Estimations & Portion Variance:'}
                </strong>{' '}
                {isFr
                  ? 'Toutes les valeurs caloriques, macronutriments (protéines, glucides, lipides) et conseils générés sont des estimations automatisées obtenues par vision par ordinateur et bases de composition standardisées. La précision peut varier selon les ingrédients cachés, sauces, huiles de cuisson et variations culinaires. Ne comptez pas sur l\'application pour gérer des allergies sévères, un diabète, des troubles du comportement alimentaire (TCA) ou une grossesse.'
                  : 'All caloric metrics, macronutrient targets (protein, carbohydrates, fats), and AI recommendations are automated approximations derived from photographic volumetric computer vision and standard nutritional databases. Actual values fluctuate due to hidden culinary oils, seasonings, preparation methods, and ingredient density. Never rely on this service to manage food allergies, diabetes, eating disorders, or medical dietary regimens.'}
              </p>
            </div>

            <div className="space-y-2">
              <p>
                <strong className="text-white uppercase font-bold">
                  {isFr ? '3. Consultation Médicale Préalable Obligatoire :' : '3. Mandatory Healthcare Provider Consultation:'}
                </strong>{' '}
                {isFr
                  ? 'Consultez impérativement un professionnel de santé avant d\'entreprendre tout changement de régime, déficit calorique, surplus pondéral, jeûne ou programme d\'entraînement intensif, en particulier si vous présentez des antécédents médicaux (maladies cardiovasculaires, rénales, métaboliques). Ne retardez jamais une consultation médicale en vous basant sur des informations fournies par PlateVision AI.'
                  : 'Always consult your healthcare provider before initiating any caloric restriction, weight-loss regimen, muscle building surplus, or rigorous fitness routine, especially if you have pre-existing cardiovascular, renal, or metabolic conditions. Never disregard qualified medical advice or delay seeking clinical care due to information provided by PlateVision AI.'}
              </p>
              <p>
                <strong className="text-white uppercase font-bold">
                  {isFr ? '4. Conformité FTC & Résultats Individuels :' : '4. FTC Results & Testimonial Compliance:'}
                </strong>{' '}
                {isFr
                  ? 'Les témoignages d\'athlètes et simulations de progression à 90 jours reflètent des expériences individuelles et des calculs théoriques fondés sur l\'équation de Mifflin-St Jeor. Ils ne constituent en aucun cas une garantie formelle de perte de poids ou de gain musculaire. Les résultats individuels dépendent du métabolisme propre, de la rigueur et du niveau d\'activité physique de chaque utilisateur.'
                  : 'Athlete case studies, testimonials, and 90-day trajectory projections represent individual user experiences and theoretical calculations based on the Mifflin-St Jeor equation. They do not constitute guaranteed weight-loss, fat reduction, or muscle gain outcomes. Individual results vary based on metabolic rate, adherence, genetics, and activity.'}
              </p>
            </div>

          </div>
        </div>

        {/* 4. COPYRIGHT & REGULATORY IDENTIFIERS (Bottom Bar) */}
        <div className="mt-10 pt-6 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-0.5 text-center sm:text-left">
            <p className="font-bold text-white">
              © {new Date().getFullYear()} PlateVision AI. {isFr ? 'Tous droits réservés.' : 'All rights reserved.'}
            </p>
            <p className="text-[10px] text-slate-400">
              {isFr
                ? 'PlateVision™ et le logo PlateVision sont des marques déposées de PlateVision AI. Conforme aux directives FTC, RGPD et CCPA.'
                : 'PlateVision™ and the PlateVision logo are registered trademarks of PlateVision AI. Built in compliance with FTC, GDPR, and CCPA standards.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#b6ff2e]" />
              <span>TLS 1.3 / AES-256</span>
            </span>
            <span>•</span>
            <span>GDPR Ready</span>
            <span>•</span>
            <span>CCPA Compliant</span>
            <span>•</span>
            <span>Mifflin-St Jeor Standard</span>
          </div>
        </div>

      </div>

      {/* Extra mobile safe padding for navigation bars */}
      <div className="h-16 md:hidden pointer-events-none" />
    </footer>
  );
};

