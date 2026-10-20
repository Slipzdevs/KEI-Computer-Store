# KEI Computer Store — Shared Product Catalog

React, TypeScript, Vite, and React Router storefront for a physical computer store, with a private product-management interface. Customers browse published products, compare specifications, check condition and availability, and contact or visit the shop. There is no cart, online checkout, online order submission, payment, or customer purchase account.

## Vercel preview deployment

This project is a Vite single-page app using React Router's `BrowserRouter`. `vercel.json` rewrites direct route requests to `index.html`, so refreshing `/products`, `/products/:slug`, `/admin/login`, or `/admin` reaches the client router. Use the Vite framework preset, `npm run build`, and `dist` as the output directory. For Preview deployments, configure `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_CATALOG_MODE=supabase` in Vercel's Environment Variables. Only the publishable key belongs in this frontend; do not configure a service-role or secret key.

## Run the demo

```sh
npm ci
Copy-Item .env.example .env.local
npm run dev
```

The example environment selects `VITE_CATALOG_MODE=demo`. Demo edits use this browser's local storage only. Anyone with the local app can open demo management, so do not enter real store data. Demo mode does not synchronize to other browsers or devices and does not provide authentication.

## Connect a Supabase project

No project URL or key is included in this repository. The configured KEI Supabase project has already received the migration and initial dashboard setup described below. The remaining checklist distinguishes those confirmed setup steps from behavior checks that still need to be completed.

### Confirmed setup for the KEI project

- The catalog migration was applied through the Supabase SQL Editor.
- Basic checks confirmed that `categories`, `products`, `product_images`, and `admin_users` exist and that RLS is enabled on those four tables.
- The `product-images` bucket was confirmed private with its configured 8 MB upload limit and image MIME types.
- Storage policies were created through **Storage → Policies**.
- Administrator membership was added and its row was queried successfully.

These checks confirm setup objects and settings; they do not establish that every RLS or Storage policy behaves correctly. Signed-out, ordinary-user, and administrator authorization checks; public signed-image access and draft-image denial; Storage upload/update/delete negative checks; and deployed-browser checks remain outstanding.

### Fresh-project setup procedure

The following numbered steps are for provisioning a separate fresh Supabase project. The migration and initial setup steps have already been completed for the configured KEI project.

1. Create a Supabase project from the Supabase Dashboard and wait for the database to finish provisioning.
2. In **Project Settings → API Keys**, copy the **Project URL** and a **Publishable key**. Never use a `service_role` or secret key in this frontend.
3. Copy `.env.example` to `.env.local`, set the two values, and change `VITE_CATALOG_MODE=demo` to `VITE_CATALOG_MODE=supabase`. Do not commit `.env.local`.
4. Review `supabase/migrations/202610200001_catalog_foundation.sql`, then apply it in the Supabase SQL Editor for a new project. This migration creates catalog tables, constraints, application-table grants and RLS policies, the private image bucket, and category definitions. It does not add product records or change grants or policies on Supabase's managed Storage tables. Do not run it against a production project before reviewing the SQL and taking an appropriate backup.
5. In **Storage → Policies**, add the five `objects` policies below. The migration creates the `product-images` bucket as private, limited to 8 MB, and restricted to JPEG, PNG, WebP, and AVIF; it intentionally does not alter the managed `storage.objects` table. In the policy editor, choose **Create policy** / **For full customization**, set the table to `objects`, enter each policy name and target role, select its operation, and paste the expression into the matching **USING** or **WITH CHECK** field. Do not add policies that grant general access to the bucket.

   - **Public reads images attached to published products** — operation: `SELECT`; role: `anon`; **USING**:

     ```sql
     bucket_id = 'product-images' and exists (
       select 1 from public.product_images as image_row
       join public.products as product on product.id = image_row.product_id
       join public.categories as category on category.id = product.category_id
       where image_row.storage_path = storage.objects.name
         and product.publication_status = 'published'
         and category.is_active
     )
     ```

   - **Authenticated reads published images or admin reads all product images** — operation: `SELECT`; role: `authenticated`; **USING**:

     ```sql
     bucket_id = 'product-images' and (
       (select public.is_store_admin()) or exists (
         select 1 from public.product_images as image_row
         join public.products as product on product.id = image_row.product_id
         join public.categories as category on category.id = product.category_id
         where image_row.storage_path = storage.objects.name
           and product.publication_status = 'published'
           and category.is_active
       )
     )
     ```

   - **Admins upload product images** — operation: `INSERT`; role: `authenticated`; **WITH CHECK**:

     ```sql
     bucket_id = 'product-images'
       and name like 'products/%'
       and (select public.is_store_admin())
     ```

   - **Admins update product images in storage** — operation: `UPDATE`; role: `authenticated`; **USING**:

     ```sql
     bucket_id = 'product-images'
       and (select public.is_store_admin())
     ```

     **WITH CHECK**:

     ```sql
     bucket_id = 'product-images'
       and name like 'products/%'
       and (select public.is_store_admin())
     ```

   - **Admins delete product images in storage** — operation: `DELETE`; role: `authenticated`; **USING**:

     ```sql
     bucket_id = 'product-images'
       and (select public.is_store_admin())
     ```

   Keep the bucket private. The app creates 15-minute signed URLs. Storage checks the relevant `SELECT` policy when a signed URL is created, so anonymous visitors can get URLs only for images attached to published products in active categories; unpublished images stay unavailable to them. Administrators can sign draft images while authenticated. Do not add a public bucket policy or grant broad privileges on `storage.objects`.
6. In **Authentication → Users**, invite the store administrator. There is no public sign-up route.
7. Copy that invited account's Auth UUID. In the SQL Editor, replace the placeholder and run:

   ```sql
   insert into public.admin_users (user_id)
   values ('<AUTH_USER_UUID>'::uuid)
   on conflict (user_id) do nothing;
   ```

   Run this trusted provisioning SQL as the project owner. Do not add an administrator from the browser.
8. Restart Vite after changing `.env.local`, then open `/admin/login`. Sign in using the invited account. A signed-in account without an `admin_users` row is denied management access.
9. Create a draft product, enter its confirmed price, condition, availability, category, description, and specifications, add product images, and publish it. Only published products appear on the public site.
10. Open the public site in a separate browser or device. The published product should load from the same Supabase project. Drafts and archived products must remain private.
11. Enter the confirmed store currency, address, opening hours, phone, email, directions, and approved policy copy in `src/config/store.ts`. Blank values stay unlinked and show as awaiting confirmation.
12. Before deployment, set the same public Vite variables in the hosting environment, deploy the frontend, confirm HTTPS and SPA route fallback, then repeat the access checks below. Keep all Supabase secret and service-role keys out of frontend environment variables.

## Catalog modes

The mode is selected by `VITE_CATALOG_MODE`:

- `demo` loads illustrative products and editable demo records from browser local storage. The public UI labels demo information; management is intentionally unprotected and changes are not shared.
- `supabase` reads the live database. Missing configuration, network errors, or query errors are shown to the user; the app does not substitute sample products. Supabase Auth, PostgreSQL grants/RLS, and Storage RLS enforce management access. The publishable key is public configuration, not an authorization mechanism.

The existing sample products are not inserted into Supabase. Demo prices, product details, condition, and availability are not verified store information.

## Security model and repeatable access checks

The client route guard improves navigation only. Catalog-table grants and RLS policies in the migration, together with the Storage policies configured in **Storage → Policies**, are the authorization boundary. The security helper is `public.is_store_admin()`; it uses an empty `search_path`, fully qualified table references, and execution is granted only to `authenticated`. The `admin_users` table has no browser insert, update, or delete grants. Storage is private, and only product images related to published products in active categories can be signed by public visitors.

After applying the migration, use three separate sessions: a signed-out browser, an ordinary invited Auth user not in `admin_users`, and the provisioned administrator. Repeat these checks in the SQL Editor or browser Network panel:

1. Signed-out visitor: public catalog queries return published products and published products with active categories only. Draft and archived products are absent. `select` from `admin_users` is denied. Attempts to insert or update `products`, write `product_images`, or upload/delete from `product-images` are denied.
2. Ordinary authenticated user: published catalog remains readable; draft and archived rows remain hidden. Opening `/admin` redirects to sign-in or shows unauthorized access after sign-in. Direct requests to create, edit, publish, archive, delete, or upload remain denied by RLS.
3. Authorized administrator: `/admin/login` succeeds; the user can list drafts and archived products, create/update products and categories, publish valid products, archive/unpublish, and manage images. Try publishing without name, SKU, brand, model, category, condition, availability, description, and a positive price; database constraints must reject it.
4. Storage: try uploading an unsupported file and a file larger than 8 MB; the UI rejects both. Verify an ordinary user cannot upload, replace, or remove a product image. Verify that public signed image URLs can be created for images attached to published products and cannot be created for draft-only images.
5. Shared visibility: publish a product as the administrator and load `/products` on a separate browser/device. It should appear there; save a draft and confirm it does not.

For the configured KEI project, the migration was applied through the SQL Editor and the basic setup checks listed above were confirmed. The live authorization and Storage behavior checks above have not all been completed, so do not treat these setup checks as a full RLS or Storage security test. Repeat the checks against the deployed browser before production use.

## Pages

- `/` — featured published catalog items
- `/products` — search, category, brand, price, condition, availability, and sorting filters
- `/products/:slug` — product images, specifications, condition, price, warranty, accessories, and known condition details
- `/contact` — confirmed store contact and location information
- `/admin/login` — Supabase Auth email/password login, with no registration
- `/admin` and `/admin/products` — focused product-management dashboard and list
- `/admin/products/new` and `/admin/products/:id/edit` — draft, publish, condition, price, specification, image, and archive workflows
- `/admin/categories` — activate, deactivate, and add categories
- `/shipping`, `/returns`, `/faq` — store-approved public information when configured

## Validation

Run `npm run typecheck`, `npm run build`, and `git diff --check`. Database/RLS checks require a configured Supabase project and must not be described as passing until run against it. Browser review is recommended at 375, 768, 1024, and 1440 px.
