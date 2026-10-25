# Portfolio

A full-stack portfolio website with a complete admin panel. **Nothing about the owner is hard-coded:** every word, image, link, section and its order comes from the database and is edited in the admin.

**Live site:** https://chaitanya-nk.vercel.app

<!-- Add screenshots to docs/ and link them here, for example:
![Home page](docs/home.png)
![Admin dashboard](docs/admin.png)
-->

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [How it works](#how-it-works)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Deploying to Vercel](#deploying-to-vercel)
- [Scheduled jobs (GitHub Actions)](#scheduled-jobs-github-actions)
- [Using the admin panel](#using-the-admin-panel)
- [Security](#security)
- [Backup and restore](#backup-and-restore)
- [Troubleshooting](#troubleshooting)

## Features

### Public site
- **Configurable sections:** Hero, Tools, Skills, Experience, Education, Achievements, Projects, Services, Testimonials, Notes, Blog, Contact, plus any custom sections. Order and visibility are controlled from the admin. Sections with no published content hide themselves.
- **Experience with promotions:** one card per company with the roles as a timeline and total tenure calculated automatically.
- **Project case studies:** problem, approach, result, metrics and a screenshot gallery with a full-screen viewer (keyboard and swipe).
- **Blog:** rich-text posts with syntax-highlighted code (with a copy button), Mermaid diagrams, tables, YouTube embeds, tags and search, SEO fields and scheduled publishing.
- **Notes feed:** short "today I learned" updates.
- **Resume:** an auto-generated, print-friendly `/resume` page, plus tailored versions such as `/resume/devops` (unlisted, hidden from search engines).
- **Intro video:** a hero button that opens a YouTube, Vimeo, Loom or uploaded video in a dialog. Nothing loads from those sites until play is pressed.
- **Ask AI assistant:** a compact chat dialog that answers visitors' questions from the portfolio's public content only (Google Gemini free tier), with per-visitor and daily limits.
- **Contact:** a form with topic dropdown, optional file attachment, Cloudflare Turnstile and a honeypot, plus Copy email and Save contact (`.vcf`) buttons.
- **Testimonial request links:** private one-time links you send to people; submissions wait for your approval.
- **Light and dark theme**, an announcement banner with optional dates, a self-expiring availability badge, maintenance mode and a privacy page.
- **SEO:** metadata per page, `sitemap.xml`, `robots.txt`, generated Open Graph images, structured data and a favicon you can upload.
- **Responsive from phones to 4K and ultrawide screens** (the whole interface scales up on large displays).

### Admin panel
- Dashboard with a live "people on your site now" counter and a content health checklist.
- Editors for every content type: drag to reorder, publish toggle, image upload, shadcn date pickers.
- **Bulk import** for Tools (drop many SVG/PNG icons at once) and Skills (paste text).
- **Section builder:** drag to reorder, show or hide, rename, add custom or blog sections.
- **Blog editor:** Tiptap with headings, lists, task lists, tables, images (upload, paste or drop), alt text, code blocks, YouTube and Mermaid.
- **Inbox:** two-pane mail layout with labels, spam tab, reply templates and replying by email, attachments, search and bulk actions.
- **Content checker:** finds missing alt text, empty or over-long SEO text, missing covers, empty sections and (on demand) broken links.
- **Analytics:** cookie-free page views, visitors, referrers, devices, countries, link clicks and resume clicks.
- **Audit log** of every change and sign-in, a **media library** (grid and list views, "in use" detection), an **email signature generator**, a **command palette** (Ctrl/⌘ + K) and **backup and restore**.
- **AI helpers:** polish a bio, suggest SEO descriptions and blog excerpts, tidy resume highlights and write image alt text.
- Admin sign-in with **two-step verification (authenticator app)**.

## Tech stack

| Area | Tools |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions, Cache Components), React, TypeScript |
| Styling and UI | Tailwind CSS v4, shadcn/ui (Radix), lucide-react, react-icons |
| Database, auth, storage | Supabase (Postgres, Row Level Security, Auth with MFA, Storage) |
| Rich text | Tiptap v3, lowlight (syntax highlighting), Mermaid, sanitize-html |
| Admin UX | dnd-kit (drag and drop), fflate (ZIP backups), react-colorful, date-fns |
| Email | Nodemailer (Gmail SMTP) for replies, Resend for alerts |
| Spam protection | Cloudflare Turnstile, honeypot field, database-backed rate limiting |
| AI | Google Gemini API (free tier) through plain `fetch` |
| Hosting | Vercel and GitHub Actions |

## How it works

- **Public data** comes from one cached function, `getSiteData()` (`src/lib/site/data.ts`), using `"use cache"` and the cache tag `site`. Every admin save calls `updateTag("site")`, so changes appear on the site immediately.
- **Three Supabase clients:** the browser client, a cookie-based server client (admin pages) and a cookie-free public client (visitors). A service-role client exists only in server-only code, for example saving contact messages and writing analytics.
- **Auth:** `src/proxy.ts` (Next.js 16's replacement for `middleware.ts`) refreshes the session, protects `/admin/*` and forces the two-step code screen. Pages re-check the admin role on the server, and every database write is also protected by Row Level Security.
- **Dynamic pages:** anything that reads cookies or request data calls `connection()` and sits inside `<Suspense>`, as Cache Components requires.
- **Rate limiting** uses a Postgres function (`check_rate_limit`), so no extra service is needed.
- **Analytics:** a small tracker sends page views and a presence signal to `/api/track`. Visitors are anonymous daily hashes. No cookies and no IP addresses are stored, and Do Not Track is respected.

## Project structure

```
src/
  proxy.ts                  session refresh, admin protection, MFA redirect
  app/
    (site)/                 public pages: home, blog, notes, projects, privacy, testimonial form
    admin/                  sign-in, two-step page, and (panel)/ with every admin screen
    api/track/              page views, clicks and live presence
    resume/                 print-friendly resume and tailored versions
    sitemap.ts, robots.ts, not-found.tsx, error.tsx
  components/
    ui/                     shadcn components
    admin/                  editors, navigation, command palette, AI helpers
    site/                   public sections, nav, gallery, chat widget
  lib/
    supabase/               client, server, public, admin, proxy helpers
    site/data.ts            cached public data
    ai.ts, email.ts, rate-limit.ts, health.ts, roles.ts, backup.ts, ...
supabase/schema.sql         the whole database in one file
scripts/backup.mjs          used by the weekly backup job
.github/workflows/          keep-alive and weekly backup
```

## Getting started

**Requirements:** Node.js 20.9 or newer, a free [Supabase](https://supabase.com) project and a GitHub account. A GitHub Codespace works well, because nothing needs installing locally.

```bash
git clone https://github.com/Chaitanya-NK/portfolio.git
cd portfolio
npm install            # .npmrc sets legacy-peer-deps for you
```

**1. Create the database**
1. In Supabase, open **SQL Editor → New query**, paste the whole of `supabase/schema.sql` and run it.
2. **Authentication → Users → Add user** (tick auto-confirm), then copy the user's UUID.
3. Run: `insert into public.admins (user_id) values ('PASTE-THE-UUID');`
4. **Authentication → Multi-Factor**: make sure TOTP is enabled.

**2. Add environment variables.** Create `.env.local` (see the table below). At minimum you need the three Supabase values.

**3. Run it**

```bash
npm run dev            # http://localhost:3000, admin at /admin
npm run build && npm start   # production build
```

Sign in at `/admin`, set up two-step verification under **Security**, then fill in **Profile & SEO**.

> **Codespaces:** `next.config.ts` allows `*.app.github.dev` for Server Actions. For local spam-check testing, use Cloudflare's public Turnstile test keys: site key `1x00000000000000000000AA` and secret `1x0000000000000000000000000000000AA`. Never use those in production.

## Environment variables

| Variable | Needed | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Publishable key (safe in the browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Secret key. Server only, never expose it |
| `NEXT_PUBLIC_SITE_URL` | Yes | Live address with no trailing slash, for the sitemap, share images and vCard |
| `NOTIFY_EMAIL` | Recommended | Where contact-form alerts are sent |
| `RESEND_API_KEY` | Recommended | Sends alert emails (without your own domain, only to the Resend account's email) |
| `RESEND_FROM` | Optional | Sender on a verified domain |
| `SMTP_USER`, `SMTP_PASS`, `SMTP_NAME` | For replies | Gmail address, a Gmail **app password** and a display name, used to reply to visitors from the inbox |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional | Cloudflare Turnstile site key |
| `TURNSTILE_SECRET_KEY` | Optional | Turnstile secret key. Without both Turnstile keys the form still works (honeypot and rate limit only) |
| `GEMINI_API_KEY` | Optional | Enables the AI helpers and the Ask AI chat |
| `GEMINI_MODEL` | Optional | Defaults to `gemini-flash-lite-latest` |
| `ASK_DAILY_CAP` | Optional | Total chat questions per day (default 150), to protect the free quota |

Keys that start with `NEXT_PUBLIC_` are baked in at build time, so **redeploy after changing them**.

## Deploying to Vercel

1. Push the repo to GitHub (keep it private), then in Vercel choose **Add New → Project** and import it.
2. Add the environment variables above. Mark `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `SMTP_PASS`, `TURNSTILE_SECRET_KEY` and `GEMINI_API_KEY` as **Secret**. Variables starting with `NEXT_PUBLIC_` must be **Config**, not Secret.
3. After the first deploy, set `NEXT_PUBLIC_SITE_URL` to your real address and **redeploy**.
4. **Settings → Functions:** choose the region closest to your Supabase project.
5. In Supabase, go to **Authentication → URL Configuration** and set the Site URL and a redirect URL (`https://your-address/**`).
6. In the Cloudflare Turnstile widget, add your live hostname.
7. Every push to `main` deploys automatically.

Vercel's free Hobby plan is for personal, non-commercial use.

## Scheduled jobs (GitHub Actions)

Add these under **Settings → Secrets and variables → Actions**:

| Secret | Value |
|---|---|
| `SUPABASE_URL` | your project URL |
| `SUPABASE_ANON_KEY` | publishable key (used by keep-alive) |
| `SUPABASE_SERVICE_ROLE_KEY` | secret key (used by the backup job) |

- **Supabase keep-alive** (`keepalive.yml`) pings the database every 3 days, because free projects pause after about a week of inactivity.
- **Weekly backup** (`backup.yml`) saves your content every Sunday as an artifact kept for 90 days. It doesn't include images.

## Using the admin panel

| Task | Where |
|---|---|
| Name, headline, bio, photo, resume, stats, social links, SEO | **Profile & SEO** |
| Reorder or hide sections, add custom or blog sections | **Section builder** |
| Add experience, skills, projects and so on | the matching editor in the sidebar |
| Write a post | **Blog posts → New post** (pick "Mermaid diagram" in the code-language bar for diagrams) |
| Add many tools at once | **Tools → Bulk import** |
| Collect a testimonial | **Testimonial requests → New request link** |
| Tailored resume | **Resume versions** |
| Colors, favicon, share image, intro video, announcement, maintenance mode, AI chat | **Settings** |
| Reply to messages | **Inbox** (templates under the **Templates** button) |
| Check content quality | **Content checker** and the dashboard |
| Backups | **Backup & restore** |

**Bulk tool icons: file naming.**
`React.svg` becomes React, `Visual-Studio-Code.svg` becomes Visual Studio Code, and `Frontend__React.svg` sets the category to Frontend and the name to React. You can edit everything in the preview before importing.

**Bulk skills: pasted format** (mix freely):
```
Frontend: React 5, Next.js 4, TypeScript 4
Backend | Node.js | 4
```

## Security

- **Row Level Security** is on for every table. The public can only read published or visible rows, and only an admin who has passed two-step verification can write.
- The admin login uses **TOTP two-step verification**, enforced in the proxy, in page guards and inside the database.
- Contact-form protection: Turnstile, a honeypot, rate limits per visitor and server-side file-type checks. Attachments are stored in a **private** bucket and opened with short-lived signed links.
- Blog HTML is sanitised on save, and uploaded SVGs containing scripts are rejected.
- Security headers are set in `next.config.ts` and the admin is hidden from search engines.
- Never commit `.env.local` (it is already ignored).

**Locked out of two-step login?** In the Supabase SQL editor run:
```sql
delete from auth.mfa_factors
where user_id = (select id from auth.users where email = 'YOUR-ADMIN-EMAIL');
```
Then sign in with the password alone and set up the authenticator again.

## Backup and restore

- **Admin → Backup & restore** downloads your content as JSON, or as a ZIP with your images, and restores it in merge or replace mode. A safety copy is downloaded automatically before any restore.
- To rebuild on a **new Supabase project**: run `supabase/schema.sql`, add your admin user, update the environment variables, redeploy and restore the latest backup. Image links are rewritten to the new project automatically.
- Inbox messages are optional in a backup. Attachments aren't included.

## Troubleshooting

| Problem | Likely cause |
|---|---|
| `npm install` shows peer-dependency errors | Keep the `.npmrc` that sets `legacy-peer-deps=true` |
| "Invalid Server Actions request" in a Codespace | Check `allowedOrigins` in `next.config.ts`, then restart the dev server |
| A red "blocking route" overlay in dev | Wrap request-time code in `<Suspense>` and call `connection()` first |
| Pages load but are empty | Missing or wrong Supabase environment variables |
| Admin login loops back | Wrong `NEXT_PUBLIC_SUPABASE_URL` or anon key |
| No alert emails | Check `NOTIFY_EMAIL` (without a verified domain, Resend only sends to its own account email) |
| Inbox replies fail | Wrong `SMTP_USER` or Gmail app password (2-Step Verification must be on) |
| Ask AI chat hidden | Needs `GEMINI_API_KEY` and the switch in **Settings** |
| Site key or Turnstile changes don't apply | Redeploy, since `NEXT_PUBLIC_` values are build-time |
| Type errors in `next build` | Run `npm run build` locally before pushing |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build (also type-checks) |
| `npm start` | Serve the production build |
| `npm run lint` | Lint the code |

## Author

**Chaitanya NK**. Built as a personal portfolio.
