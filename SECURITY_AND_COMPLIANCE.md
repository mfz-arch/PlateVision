# PlateVision AI — Security, Compliance & Accessibility Guide

This document details all technical safeguards, legal compliance frameworks, and web accessibility standards implemented in **PlateVision AI** to prevent liability, protect user privacy, and secure the application against attacks.

---

## 1. Essential Legal Policies & Disclosures

| Policy | Route | Purpose & Compliance Scope |
| :--- | :--- | :--- |
| **Privacy Policy** | [`/privacy`](file:///Users/mac/Desktop/my_IT_projects/PlateVision/src/app/privacy/page.tsx) | Complies with **EU/UK GDPR**, **CCPA/CPRA**, and consumer protection laws. Discloses all personal data collected (account credentials, meal photos, physical attributes), explicit consent for health data (GDPR Art. 9), third-party processors (Google Gemini, MongoDB Atlas, Cloudinary), retention limits, and data subject rights (export/erasure). |
| **Terms of Service** | [`/terms`](file:///Users/mac/Desktop/my_IT_projects/PlateVision/src/app/terms/page.tsx) | Outlines rules of use, user-generated content licenses, acceptable use, governing law, and a robust **limitation of liability** clause. |
| **DMCA Copyright Notice** | [`/terms#dmca`](file:///Users/mac/Desktop/my_IT_projects/PlateVision/src/app/terms/page.tsx#L97) | Establishes statutory safe harbor under 17 U.S.C. § 512 with a designated copyright agent (`copyright@platevision.app`), step-by-step takedown notice requirements, and counter-notice provisions. |
| **Cookie Policy & Banner** | [`/cookies`](file:///Users/mac/Desktop/my_IT_projects/PlateVision/src/app/cookies/page.tsx) | Complies with the **ePrivacy Directive** and GDPR. Discloses essential cookies (`pv_session`), user preferences, and strictly prohibits non-essential third-party advertising or cross-site tracking cookies. An interactive consent banner and permanent preferences toggle allow users to update consent anytime. |
| **Accessibility Statement** | [`/accessibility`](file:///Users/mac/Desktop/my_IT_projects/PlateVision/src/app/accessibility/page.tsx) | Pledges conformance to **WCAG 2.2 Level AA**, **ADA Title III**, and **Section 508**. Details accessible features, known limitations, and provides a barrier reporting email (`privacy@platevision.app`) with a 5-day response commitment. |
| **Explicit Consent Checkbox** | `OnboardingModal` | Users must check an explicit acceptance box linking to the Terms and Privacy Policy before creating an account, ensuring legally binding consent. |

---

## 2. Web Accessibility (ADA & WCAG 2.2 AA Compliance)

- **Color Contrast**:
  - Main text colors (`#ffffff`, `#c4c8d2`, `#9ea3b0`) on dark graphite backgrounds (`#14171d`, `#23262f`) deliver contrast ratios from **5.4:1 to 14:1**, exceeding the WCAG AA minimum of 4.5:1 for normal text and 3:1 for large text.
  - Accent lime (`#b6ff2e`) on dark backgrounds yields a contrast ratio exceeding **13:1**.
- **Keyboard Navigation**:
  - Global `:focus-visible` ring (`2px solid #b6ff2e` with `3px offset`) styled in [`globals.css`](file:///Users/mac/Desktop/my_IT_projects/PlateVision/src/app/globals.css) ensures a crisp outline on all focused interactive elements.
  - **Skip to Main Content Link**: Accessible skip link placed at the very top of [`layout.tsx`](file:///Users/mac/Desktop/my_IT_projects/PlateVision/src/app/layout.tsx) enables keyboard and screen reader users to jump straight to `#main-content`.
  - **Modal Key Trapping**: All modal dialogues (`SignInModal`, `OnboardingModal`, `ScannerZone`) support the `Escape` key to instantly dismiss the overlay.
- **Image Alternative Text**:
  - Every `<img>` tag across the hero demonstration, user dashboards, and plate scanners includes descriptive `alt` text explaining the content and context of the image.
- **Audio & Video Captions**:
  - PlateVision does not currently use pre-recorded media. The Accessibility Statement includes a formal policy guaranteeing synchronized closed captions and transcripts for any future multimedia.
- **Reduced Motion Support**:
  - Implements `@media (prefers-reduced-motion: reduce)` in CSS to eliminate rapid scanner animations for vestibular-sensitive users.

---

## 3. Data Security & Technical Safeguards

- **HTTP Security Headers & HTTPS Enforcement**:
  Configured in [`next.config.ts`](file:///Users/mac/Desktop/my_IT_projects/PlateVision/next.config.ts):
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (enforces TLS/HTTPS).
  - `X-Frame-Options: DENY` (prevents clickjacking attacks).
  - `X-Content-Type-Options: nosniff` (prevents MIME-type confusion).
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy: camera=(self), microphone=(), geolocation=(), browsing-topics=()`.
  - `Content-Security-Policy`: Restricts scripts, styles, frames, and outbound connections strictly to authorized endpoints (Google Gemini, Cloudinary, Unsplash).
- **Authentication & Access Control**:
  - Passwords are encrypted using salted `bcrypt` (10 rounds).
  - Session management uses signed, stateless cookies (`pv_session`) with `HttpOnly`, `Secure`, and `SameSite=Lax` flags, preventing cross-site scripting (XSS) token theft and mitigating CSRF.
  - Password strength validation requires a minimum of 8 characters containing both letters and numbers.
  - Account data isolation: All meal queries derive user identity solely from the verified cryptographic session cookie—never from client request parameters.
- **NoSQL Injection & Input Sanitization**:
  - Implemented in [`src/backend/security/sanitize.ts`](file:///Users/mac/Desktop/my_IT_projects/PlateVision/src/backend/security/sanitize.ts).
  - Strict type checking and sanitization on all emails and strings prevents MongoDB operator injection (`$gt`, `$ne`, etc.).
- **Bot, Spam & Brute-Force Protection**:
  - Registration endpoint rate-limited to 5 requests / hour per IP.
  - Login endpoint rate-limited to 10 attempts / 15 minutes per IP.
  - AI Scanner endpoint rate-limited to 30 requests / hour per user.
  - Hidden honeypot fields (`website`) on registration and login forms automatically flag and block bot submissions.
- **Automated Database Backups**:
  - Backup script available at [`scripts/backup-db.sh`](file:///Users/mac/Desktop/my_IT_projects/PlateVision/scripts/backup-db.sh).
  - Dumps MongoDB collections into timestamped, gzipped archives and prunes copies older than 30 days.
  - In production on MongoDB Atlas, automated continuous backups and point-in-time restore (PITR) provide disaster recovery.

---

## 4. Content & Operational Rules

- **Intellectual Property & Media Licenses**:
  - Photography licensed under the **Unsplash License** for commercial and non-commercial use.
  - Icons licensed under the permissive **ISC License** (Lucide React).
  - Fonts utilize the secure system font stack.
  - Explicit copyright notices (`© PlateVision AI`) and trademark assertions are displayed in the universal footer.
- **FTC & FDA Health Claim Disclaimers**:
  - Clear medical disclaimers prominently positioned in the footer, terms, and scanner results:
    > *"PlateVision AI provides automated nutrition estimates for wellness journaling and general informational purposes only. It is not a medical device, does not provide medical advice or treatment, and has not been evaluated by the FDA. Consult a healthcare professional before altering your diet."*
  - Avoids deceptive advertising or unsubstantiated health guarantees.

