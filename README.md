# CampusConnect
**Find the right people to build with.**

A focused student collaboration product: find peers with complementary skills, discover projects and study groups, and publish opportunities of your own.

## Problem
University students have ideas, assignments, and interests—but finding the right collaborator usually means scrolling through noisy group chats or asking the same small circle. Skills and interests rarely line up neatly with classroom boundaries.

## Solution
CampusConnect makes those connections discoverable. Students create a skills-based profile, find people by branch/year/interests, and share specific collaboration opportunities. The MVP deliberately leaves out chat, social feeds, and decorative analytics.

## Key Features
- Real Supabase email/password signup, login, email confirmation, session refresh, and logout.
- Profile creation through an atomic database signup trigger.
- Protected dashboard with actual database counts, recent opportunities, and suggested peers.
- Student discovery: case-insensitive name/skill/interest search, branch/year filters, and pagination.
- Opportunities: database search, category and exact required-skill filters, newest-first ordering.
- Owner-only creation, editing, deletion, and an accessible deletion confirmation dialog.
- Editable profiles with initials avatars, bio, and removable skill/interest tags.
- Responsive sidebar/mobile drawer, keyboard focus, loading skeletons, friendly errors, and useful empty states.
- Private profile email enforced with PostgreSQL column grants, not merely hidden in the UI.
- Explicit missing-backend setup state. No simulated authentication or persistence.

## User Journey
Landing → Sign up → Confirm email (if enabled) → Complete profile → Dashboard → Discover/filter students → View profile → Explore opportunities → Create opportunity → Manage/edit/delete your opportunities → Edit profile → Log out.

After saving an onboarding profile, choose **Go to dashboard**. All profile/opportunity browsing requires authentication.

## Tech Stack
- Next.js 16 App Router, React 19, TypeScript.
- Tailwind CSS 4 and Lucide icons.
- Small local reusable UI primitives with Radix accessible dialog components (the same headless primitives used by shadcn/ui), and Sonner toasts.
- Supabase Auth, Supabase SSR, PostgreSQL, Row Level Security.
- Zod validation. Playwright for browser tests and Node's test runner for unit checks.
- No image hosting, custom API server, state-management framework, or service-role application client.

## Architecture
Browser
↓
Next.js / React — Server Components for reads, Client Components for interactive forms
↓
Supabase Auth — cookie sessions, verified identity, email confirmation
↓
Supabase PostgreSQL — persistent profiles and opportunities
↓
Row Level Security + column privileges — authoritative ownership and privacy

`proxy.ts` refreshes cookies and checks Auth before protected routes. `lib/data.ts` re-verifies identity at the data boundary and deduplicates request-local user/profile lookups with React `cache`. Every Server Action independently verifies the user, validates fields, and scopes writes to that user's ID. RLS still protects data if someone bypasses the UI.

Search happens in PostgreSQL, not on an in-memory demo array. Generated search columns and trigram indexes support case-insensitive substring queries. Profile authors are fetched in one batch per opportunity list. Lists return 12 results with exact counts and stable newest-first ordering. Dashboard recommendations score shared skills/interests among the latest 60 peers; they are not an AI recommendation system.

The ivory/violet landing page uses explicitly labelled sample cards. Those samples never populate protected pages. The application's display avatar is derived from the profile name; uploads are not implemented.

## Database Schema
Apply **`supabase/migrations/001_campusconnect.sql`**. This is the complete SQL for tables, constraints, relationships, indexes, triggers, grants, and RLS policies.

### `profiles`
`id` (Auth user UUID), `full_name`, private `email`, `branch`, `year`, `bio`, `skills[]`, `interests[]`, nullable `avatar_url`, `created_at`, `updated_at`, and generated `search_text`.

- `id → auth.users.id`, cascading deletes.
- Auth signup trigger creates the profile transactionally from bounded metadata.
- Signed-in users may select public columns. **Email has no authenticated SELECT grant.**
- Only the owner may update editable profile fields. Direct profile insert/delete is not granted.
- Email is a private signup snapshot; the owner's current email is read from Auth.

### `posts`
UI terminology is **opportunities**; the underlying table is `posts`.

`id` (UUID), `user_id`, `title`, `description`, `category`, `skills_required[]`, timestamps, generated `search_text`.

- `user_id → profiles.id`, cascading deletes.
- Categories: Project, Study Partner, Skill Sharing, Other.
- Authenticated reads; inserts must use the current user's ID; only owners can edit/delete.
- Ownership, IDs, and timestamps cannot be reassigned by application clients.

Names: 2–80 characters; branches: 2–100; study years: 1–6; bio: up to 500; opportunity title: 8–120; description: 30–3,000; at most 12 tags per field, each 1–32 characters. Database and application validation enforce the same bounds.

Never change profile queries to `select("*")`: explicit column grants intentionally reject that query. RLS does not by itself hide individual columns.

## Folder Structure
- `app/`: public landing/auth routes, email handlers, Server Actions, shared boundaries.
- `app/(workspace)/`: protected dashboard, students, opportunity discovery/detail/edit, create, personal opportunities, profile.
- `components/`: navigation, cards, filters, pagination, states, and forms.
- `components/ui/`: local reusable buttons and initials avatar.
- `lib/data.ts`: authenticated queries, batching, counts, recommendations.
- `lib/supabase/`: configuration, browser and cookie-aware server clients.
- `lib/validation.ts`, `lib/utils.ts`: bounded input schemas, safe redirects, escaped search patterns.
- `types/`: typed database/domain contracts.
- `supabase/migrations/`: database schema and RLS.
- `scripts/`: opt-in seed and live-backend verification.
- `tests/`: unit and browser checks. Browser fixtures are test-only, never an application fallback.

## Environment Variables
Copy `.env.example` to `.env.local` and fill these values using your Supabase project's Connect dialog:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Use the **public anon key** (or a new public publishable key under this same variable name), never a service-role/secret key. Public keys are designed to be visible; database security comes from grants and RLS.

Optional local maintenance variables: `SUPABASE_SERVICE_ROLE_KEY`, `DEMO_SEED_PASSWORD`, `SEED_DEMO=true`, and `CHECK_BACKEND=true`. None belongs in browser code. Do not add maintenance credentials to the deployed application. Load them through a secret manager or an untracked local environment file; never paste credentials into commands, screenshots, or commits.

`.gitignore` excludes environment files, dependency folders, build output, browser test output, and Vercel state. No private credentials are included.

## Local Setup
Prerequisites: Node.js 24 LTS (or compatible Node 22.9+), npm, and a Supabase project.

```powershell
cd C:\CampusConnect
npm install
Copy-Item .env.example .env.local
```

Enter your two public Supabase values in `.env.local`, complete the Supabase setup below, then start the app. Without values, the public pages still work, protected routes redirect to login, and auth forms clearly explain setup instead of pretending to work.

## Supabase Setup
1. Create a new Supabase project.
2. Open SQL Editor, paste **all** of `supabase/migrations/001_campusconnect.sql`, and run it once. Alternatively apply this file with your established Supabase CLI migration workflow.
3. Enable email/password authentication.
4. Set Auth **Site URL** to `http://localhost:3000` during local development.
5. Add `http://localhost:3000/auth/callback` to the redirect allowlist. Add the exact production callback after deployment.
6. Configure confirmation email delivery. For an actual public launch, use custom SMTP; Supabase's built-in mail service has restrictions and rate limits.
7. Restart Next.js after setting environment variables.

Apply the initial migration **before** registering users. It assumes a new project and standard Supabase Auth roles. It is not an idempotent reset; do not repeatedly execute it. Existing Auth users require a separately reviewed profile backfill.

### Email confirmation
Both supported Next.js email handlers are implemented:

- **Default PKCE:** keep the Supabase template using `{{ .ConfirmationURL }}`. Signup supplies `/auth/callback`, which exchanges `code` for a session. Open the link in the same browser so the PKCE verifier cookie is available.
- **Cross-device token-hash alternative:** change the signup confirmation template to:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm your email</a>
```

This route verifies the one-time token and redirects to profile completion. Ensure Site URL matches the intended local/deployed app. Invalid or expired links return a friendly login error. Do not mix callback query formats or log tokens.

For a private recruitment demo, you can disable email confirmation in your development Supabase project; signup then creates a session immediately. Do not mistake this for testing real email delivery.

### Demo data
The seed creates six explicitly fictional profiles and six opportunities through the **real Supabase Admin Auth API** and PostgreSQL. It does not inject frontend data. Use a disposable development project.

Store the service-role key and a strong `DEMO_SEED_PASSWORD` (12+ characters) privately in `.env.local`, then:

```powershell
$env:SEED_DEMO = 'true'
npm run seed
Remove-Item Env:\SEED_DEMO
```

Example demo login: `maya.chen@students.example.edu`, using your privately chosen seed password. These are example inboxes, not deliverable addresses. Seeded accounts are email-confirmed by the admin API; this does not test email confirmation delivery.

The seed is rerunnable: it only refreshes accounts bearing its trusted seed marker and deterministic owned opportunity IDs. It refuses collisions, does not reset existing passwords, and performs no destructive rollback. Failures can leave partial data; fix the configuration and rerun.

## Running Locally
```powershell
npm run dev
```

Open **http://localhost:3000**.

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run start
```

Stop the development server before starting production on the same port. Build-time public environment variables require a rebuild after changes.

## Testing
```powershell
npx playwright install chromium
npm run test:e2e
```

Local browser fixtures exercise UI and server-action integration, but **are not evidence that hosted Supabase Auth, SQL, RLS, or email delivery work**. Fixtures run only in a separate local test process; the production application has no demo-mode or authentication bypass.

For real integration checks after migration, supply your development service-role/public credentials privately and opt in:

```powershell
$env:CHECK_BACKEND = 'true'
npm run check:backend
Remove-Item Env:\CHECK_BACKEND
```

This creates two temporary Auth accounts and verifies public-client login, profile provisioning, owner CRUD, anonymous/cross-user denial, email privacy, constraints, search/filtering, and pagination. Cleanup targets only this run's verified fixture accounts. Interrupted runs can leave test fixtures; the script prints a non-secret run marker for reviewed cleanup. A “Skipped” result is not a passing live test.

Real inbox confirmation, deployed redirects, and production session behavior still require a manual end-to-end check. Never declare those verified just because the build passes.

## Deployment
1. Push the repository to your own GitHub repository after reviewing `.gitignore`.
2. Import it in Vercel and select the **Next.js** preset.
3. Add only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the app's environment.
4. Apply the SQL migration to the corresponding Supabase project.
5. Deploy with `npm run build`; Vercel supplies the Next.js runtime.
6. Set Supabase Site URL to the deployed HTTPS origin; allow its exact `/auth/callback` URL and configure SMTP.
7. Verify signup, email confirmation, login, profile edits, opportunity create/edit/delete, and logout on the deployed URL.

Avoid broad production redirect wildcards. Never disable RLS to fix a setup error. No deployment URL is included because deployment requires your Supabase/Vercel accounts.

## MVP Scope and Operational Notes
- All authenticated students share one discovery space; email signup does **not** verify institutional enrollment.
- “Active” means currently published; remove an opportunity when it is no longer available.
- Skill filter matches an exact, case-sensitive tag; general search is case-insensitive.
- Search escapes literal `%`, `_`, and backslashes; asterisks are rejected because PostgREST treats them as wildcard aliases.
- Exact counts, offset pagination, and bounded peer recommendations suit a campus MVP, not a global feed.
- Before a broad public launch, add moderation, abuse controls, institution verification, monitoring, privacy/retention policies, and a formal accessibility/security review.

## Future Improvements
Not implemented: notifications, bookmarks, real-time updates, messaging, file/avatar uploads, verified university membership, multi-campus support, and moderation tools. These are intentionally outside the submission MVP.
