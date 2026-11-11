# Content Action Items (CONTENT_TODO.md)

This document tracks default content placeholders that require official PDF documents or assets to be uploaded by the UNRAM OIA administrative team.

---

## 1. Downloadable Guidebooks (`/admission/`)

The following guidebook entries in `ContentContext` currently have empty/placeholder `fileUrl` fields. To avoid 404 broken links for prospective students and SEO crawlers, the public download button is hidden (displaying *"Available on request"* / *"Tersedia via narahubung"*) until a valid file URL is supplied via the Admin CMS:

| Guide ID | Title (EN / ID) | Category | Expected File | Action Required |
|---|---|---|---|---|
| `guide-1` | International Student Academic & Living Guidebook / Panduan Komprehensif Akademik | International Admissions | `international-student-handbook.pdf` (~4.2 MB) | Upload official PDF via Admin CMS (`/admin` -> Guides tab) |
| `guide-2` | Outbound Student Mobility & IISMA Guidelines / Pedoman Mobilitas Keluar | Student Mobility | `unram-outbound-mobility-guide.pdf` (~2.8 MB) | Upload official PDF via Admin CMS |
| `guide-3` | Study Permit & e-ITAS Visa Regulatory Procedure / Panduan Visa & e-ITAS | Visa & Stay Permits | `study-permit-itas-guidelines.pdf` (~1.9 MB) | Upload official PDF via Admin CMS |

---

## 2. Recommended Next Steps for Admins
1. Log in to the CMS at `https://oia.unram.ac.id/admin`.
2. Navigate to the **Buku Panduan (Guides)** section.
3. For each guide item, click **Edit** and upload the verified PDF file from your device.
4. The system automatically stores the file in Supabase Storage (`site-media/files/`), assigns a permanent content-hashed URL, and activates the live **Download** button on the public `/admission/` page.
