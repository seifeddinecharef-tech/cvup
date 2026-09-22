# CVUp

CVUp is a multilingual CV intake and manual-production workspace built with Next.js and Supabase.

The current MVP workflow is:

1. A client completes the Arabic, French, or English request wizard.
2. CVUp stores the request and securely uploads the client's CV, job description, certifications, template references, and optional supporting files.
3. The protected Admin workspace tracks payment and production status.
4. The administrator downloads a ZIP dossier containing `request.md` and the uploaded source files.
5. CV creation remains a manual, human-reviewed process. The public product does not automatically invent or generate candidate experience.

## Local development

Copy `.env.example` to `.env.local`, add the real values locally, then run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Required environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

CVUP_ADMIN_EMAIL=
CVUP_ADMIN_PASSWORD=
CVUP_ADMIN_SESSION_SECRET=
```

For production, also set a separate request-upload signing secret and, when available, the real Sofizpay merchant checkout URL:

```env
CVUP_REQUEST_TOKEN_SECRET=
NEXT_PUBLIC_SOFIZPAY_PAYMENT_URL=
```

If `CVUP_REQUEST_TOKEN_SECRET` is omitted, CVUp falls back to `CVUP_ADMIN_SESSION_SECRET`. Both secrets must be at least 32 characters.

Never commit real secrets. `.env.local` remains ignored by Git.

## Admin security

The admin workspace uses a signed HTTP-only session cookie.

Protected surfaces:

- `/admin/*`
- `/api/admin/*`

Authentication surfaces:

- `/admin/login`
- `/api/admin/auth/login`
- `/api/admin/auth/logout`

## Client upload security

After a request is created, the server issues a short-lived signed submission token. File uploads and supporting-material updates require that token and are bound to the new request.

Uploads are restricted to supported document/image types and a maximum of 10 MB per file.

## Production checklist

Before deploying:

- configure all environment variables in the hosting platform;
- rotate any secret that has ever been exposed outside the environment store;
- keep the Supabase service-role key server-only;
- confirm the `cvup-requests` storage bucket is private;
- run `npm run lint` and `npm run build`;
- submit one real end-to-end test request;
- confirm the request appears in Admin;
- confirm work/payment status persists after refresh;
- confirm the ZIP includes `request.md` and every uploaded file;
- confirm logout blocks both Admin pages and Admin APIs.
