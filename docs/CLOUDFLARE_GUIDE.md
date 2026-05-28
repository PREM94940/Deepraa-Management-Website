# Cloudflare Security & Governance Guide

To enforce the Infrastructure Security layer required by Phase D.2, you must configure the following rules in your Cloudflare dashboard. As the infrastructure is externally hosted (Vercel/Supabase), Cloudflare serves as the critical outer shield.

## 1. WAF Custom Rules
Navigate to **Security > WAF > Custom rules** and create the following:

### Block Known Malicious ASNs & TOR
- **Rule Name**: Block Bad Actors
- **Expression**: `(ip.geoip.asnum in {12345 54321}) or (ip.geoip.country == "T1")` *(Adjust ASNs based on current threat intel, T1 = TOR network)*
- **Action**: Block

### Admin Portal Strict Protection
- **Rule Name**: Enforce Admin Challenges
- **Expression**: `(http.request.uri.path contains "/admin") and not (ip.src in {YOUR_OFFICE_IPS})`
- **Action**: Managed Challenge (Recommended) or Block (if strict IP allowlisting is preferred)

## 2. Bot Fight Mode
Navigate to **Security > Bots**:
- Enable **Bot Fight Mode**. This will challenge requests matching known bot signatures.
- For API routes (`/api/*`), consider configuring Super Bot Fight Mode (if on Pro/Biz plan) to strictly block automated traffic not coming from recognized browsers.

## 3. Rate Limiting Rules
Navigate to **Security > WAF > Rate limiting rules**:
- **Rule 1: Login Protection**
  - **URI Path**: equals `/admin/login`
  - **Requests**: 5 per 15 minutes
  - **Action**: Block (for 1 hour)
- **Rule 2: Checkout / Payment Protection**
  - **URI Path**: contains `/api/checkout`
  - **Requests**: 10 per 1 minute
  - **Action**: Managed Challenge

## 4. SSL/TLS Settings
Navigate to **SSL/TLS > Edge Certificates**:
- **Always Use HTTPS**: ON
- **HTTP Strict Transport Security (HSTS)**:
  - Enable HSTS
  - Max-Age: 6 months
  - Include subdomains: ON
  - Preload: ON

## 5. Page Rules (Optional but Recommended)
Navigate to **Rules > Page Rules**:
- Create a rule for `*deeprastore.com/admin/*`
- Set **Security Level** to `High` or `I'm Under Attack` (if experiencing active probing).
- Set **Cache Level** to `Bypass` to ensure admin operations are never cached.
