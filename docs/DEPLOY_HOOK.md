# Automatic Static Rebuild via Vercel Deploy Hook & Supabase Webhook

Because the UNRAM OIA portal is exported as a pure high-performance static website (`output: 'export'`), pages are pre-rendered into static HTML at build time. To ensure search engines and social scrapers always receive fresh published content without manual redeployments, follow this guide to connect Supabase publishing to Vercel Deploy Hooks.

---

## 1. Create a Deploy Hook in Vercel

1. Go to your project on the [Vercel Dashboard](https://vercel.com).
2. Navigate to **Settings** > **Git**.
3. Scroll down to the **Deploy Hooks** section.
4. Click **Create Hook**:
   - **Hook Name**: `Supabase CMS Content Publish`
   - **Branch**: `main`
5. Click **Create Hook** and copy the generated webhook URL:
   `https://api.vercel.com/v1/integrations/deploy/prj_.../hook_...`

---

## 2. Configure Webhook in Supabase

1. Open your Supabase Project Dashboard (`https://supabase.com/dashboard/project/dscmuuilmrkwtuxmmyap`).
2. Go to **Database** > **Webhooks**.
3. Click **Create a new hook**:
   - **Name**: `trigger_vercel_rebuild_on_publish`
   - **Table**: `site_content_published`
   - **Events**: Check `INSERT` and `UPDATE`.
   - **Type of Webhook**: `HTTP Request`
   - **Method**: `POST`
   - **URL**: Paste your Vercel Deploy Hook URL copied from Step 1.
   - **HTTP Headers**: Leave empty or set `Content-Type: application/json`.
4. Click **Create Webhook**.

---

## 3. Verification

1. In the OIA CMS (`/admin`), edit any section or publish a news article and click **Publikasikan ke Publik**.
2. This writes a new row to `site_content_published`.
3. Supabase will immediately trigger the Vercel Deploy Hook via HTTP POST.
4. On Vercel, a new deployment will start automatically, fetching the latest published content from Supabase REST, generating fresh static HTML with updated metadata and sitemap, and deploying to the global Edge CDN in ~45 seconds.
