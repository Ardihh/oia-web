# Security Headers & Content Security Policy (CSP) Guide

The UNRAM OIA portal is protected with comprehensive modern HTTP security headers configured in `vercel.json`.

---

## 1. Configured Headers Overview

| Header | Production Value | Purpose |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-sniffing attacks |
| `X-Frame-Options` | `DENY` | Protects against Clickjacking |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Safeguards referrer metadata |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), vr=()` | Restricts privileged browser APIs |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Enforces HTTPS exclusively |
| `X-Robots-Tag` | `noindex, nofollow, noarchive` | Injected on `/admin/*` and `*.vercel.app` preview URLs |
| `Content-Security-Policy-Report-Only` | Documented below | Non-breaking validation of all allowed domains |

---

## 2. Content Security Policy Directives

The CSP is deployed in **Report-Only** mode (`Content-Security-Policy-Report-Only`), meaning it logs any directive violations to the browser console without breaking features or blocking scripts:

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://translate.googleapis.com https://translate.google.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' data: https://fonts.gstatic.com;
img-src 'self' data: blob: https://dscmuuilmrkwtuxmmyap.supabase.co https://*.supabase.co https://images.unsplash.com https://translate.googleapis.com https://translate.google.com;
connect-src 'self' https://dscmuuilmrkwtuxmmyap.supabase.co https://*.supabase.co https://api.web3forms.com https://translate.googleapis.com https://api.mymemory.translated.net;
frame-src 'self' https://www.google.com https://maps.google.com;
object-src 'none';
base-uri 'self';
form-action 'self' https://api.web3forms.com;
```

---

## 3. How to Validate CSP

1. Open Chrome DevTools (`F12`) on `https://oia.unram.ac.id`.
2. Go to the **Console** tab.
3. Browse through all sections (`/about/`, `/services/`, `/news/`, `/contact/`, `/admin/`).
4. Look for any `[Report Only]` warnings. If an external service or widget is flagged, add its origin to the corresponding directive in `vercel.json`.
5. Once validated for 1-2 weeks in production without unexpected reports, you can safely rename the header key from `Content-Security-Policy-Report-Only` to `Content-Security-Policy` to enforce strict browser blocking.
