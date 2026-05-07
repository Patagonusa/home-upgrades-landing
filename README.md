# California Home Upgrades Program — Landing Page

**Live:** https://californiahomeupgradesprogram.com
**Render:** (set after Render service creation — likely `home-upgrades-landing.onrender.com`)
**Repo:** `Patagonusa/home-upgrades-landing` (auto-deploys to Render on push to `main`)

Cloned and adapted from `cesp-landing`. Single-page static site driving California homeowners to a free in-home assessment with the **"No Payments Until 2028"** financing offer.

---

## How It Works

### Lead flow
1. Visitor fills the 4-step form (Homeowner? → ZIP → Project Type → Contact + TCPA)
2. Form submits to Patagon CRM webhook (`POST https://patagon-crm.onrender.com/api/webhooks/lead`)
3. Lead is tagged `source: "General Builders"`, `form_name: "Home Upgrades Estimate Request"`
4. Lead created in Supabase `leads` table

### Luna chat
- Widget appears after 15s, auto-opens with home-upgrade greeting
- Connects to `https://www.salesdispatch.ai/api/chat`
- Same backend/endpoint as CESP — only greeting/subtitle copy differs
- Supports English and Spanish

### Phone
- **(888) 480-4286** — same number as CESP campaign (intentional per Felipe)

---

## File structure

```
home-upgrades-landing/
├── index.html                  # Main landing page (single-page, all inline CSS/JS)
├── luna-chat.js                # Luna AI chat widget
├── privacy.html                # Privacy Policy (TCPA + CCPA)
├── terms.html                  # Terms of Service
├── terms-and-conditions.html   # Terms & Conditions + government disclaimer
├── favicon.svg                 # Favicon
├── robots.txt
├── sitemap.xml
├── images/
│   ├── logo.png                # Home Upgrades Program bear seal
│   ├── hero-bg.jpg
│   ├── about-team.jpg
│   └── project-01..08.jpg      # 8 portfolio photos (re-labeled for blueprint services)
└── README.md
```

---

## Form — 4-step estimate request

| Step | Question | Fields |
|------|----------|--------|
| 1 | Are you the homeowner? | Yes / No |
| 2 | Where is your home located? | ZIP (CA area auto-detect) |
| 3 | What would you like upgraded? | Multi-select: Bathroom, Roofing, Windows & Doors, Flooring, HVAC, Solar, Kitchen, Exterior/ADU |
| 4 | Contact info | First, Last (req), Phone (req), Email (req), Address (opt), Best time to call (opt), TCPA consent (req) |

### TCPA compliance
- Unchecked-by-default consent checkbox (per blueprint 5.2)
- Consent text references autodialer, prerecorded voice, artificial voice, SMS
- Submit button disabled until consent checked
- Consent timestamp + full TCPA text sent in form payload

### Form payload → CRM
```json
{
  "first_name": "...",
  "last_name": "...",
  "phone": "(555) 123-4567",
  "email": "...",
  "zip": "91335",
  "is_homeowner": "Yes",
  "project_type": "Bathroom Remodel, Roofing",
  "source": "General Builders",
  "form_name": "Home Upgrades Estimate Request",
  "campaign": "Home Upgrades Web",
  "best_time_to_call": "Morning",
  "tcpa_consent": true,
  "tcpa_timestamp": "..."
}
```

---

## Deployment

- **Hosting:** Render Static Site (Global CDN)
- **Auto-deploy:** Every push to `main` triggers deploy
- **Build:** none (static HTML)
- **Publish path:** `.` (repo root)
- **Domain:** californiahomeupgradesprogram.com (GoDaddy → Render)
- **SSL:** auto-provisioned by Render (Let's Encrypt)

---

## ⚠️ CRM-side configuration TODO (Felipe)

Two things need to happen on the Patagon CRM side for this site to work end-to-end:

1. **Add CORS origins** for the new domain to `/api/webhooks/lead` (and `/api/chat/*`):
   - `https://californiahomeupgradesprogram.com`
   - `https://www.californiahomeupgradesprogram.com`
   - `https://home-upgrades-landing.onrender.com` (or whatever Render hostname is generated)
2. **Lead detection routing**: the CRM has an `isCESPLead()` helper that routes CESP leads to the CRM path (not QuickBase). Add an analogous `isGeneralBuildersLead()` (or extend `isCESPLead`) so leads with `source: "General Builders"` or `form_name: "Home Upgrades Estimate Request"` route to the CRM the same way.

Without (1), browser CORS will block form/chat requests. Without (2), General Builders leads will default to whichever path the existing logic chooses (likely QuickBase).

---

## Legal

> California Home Upgrades Program is a private home-improvement campaign operated by **General Builders**, a California licensed and insured general contractor. We are not a government agency and are not affiliated with, endorsed by, or connected to any federal, state, or local government office. The "no payments until 2028" offer is consumer financing through third-party financing partners, subject to credit approval.
