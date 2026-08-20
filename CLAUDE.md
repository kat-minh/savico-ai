# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**SAVICO AI** — frontend-only Next.js 16 (App Router) / React 19 / TypeScript app. There is **no backend in this repo** — the app talks **only** to an external .NET REST API via a single Axios instance. Package manager is **pnpm**.

The UI contract is `docs/MO_TA_GIAO_DIEN.md` (11 screens, mục V). **Read it before changing any screen** — code comments reference it by section number (e.g. `mục III.2, trường 4`). `docs/TRANG_THAI_DUNG_KHUNG.md` maps each screen to its route + components and tracks what is still stubbed.

The product is a 3-step flow — **Nhập liệu → Nhận dự toán → Hồ sơ thi công** — wrapped in a public site (trang chủ, Cẩm nang, Hướng dẫn) and an account screen. This folder was rebuilt from the earlier BMT codebase after the client changed requirements; the original is preserved at `../bmt/` and is the place to copy proven code from (estimate tables, PDF service, admin CMS).

## Commands

```bash
pnpm dev            # start dev server (localhost:3000)
pnpm build          # production build
pnpm lint           # eslint . — enforces import/architecture rules (see below)
pnpm typecheck      # tsc --noEmit (strict: noUncheckedIndexedAccess, no unused locals)
pnpm format         # prettier --write src
pnpm format:check   # prettier --check src
```

Quality gate to run before considering work done (CI mirrors this):

```bash
pnpm typecheck && pnpm lint && pnpm format:check
```

There is no test runner configured yet. `services/` (pure domain logic) is the intended unit-test target if one is added.

## Running without the backend

Copy `.env.example` → `.env.local`. Env vars are **validated by Zod at module load** (`src/shared/config/env.ts`) and the app throws on startup if they're invalid. Two dev-only flags swap real API calls for in-browser mocks:

- `NEXT_PUBLIC_USE_MOCK_AUTH=true` — login/roles work with no API. Email containing `admin` → admin role. (`features/auth/api/auth.mock.ts`)
- `NEXT_PUBLIC_USE_MOCK_API=true` — feature pages render sample data with no API.

Feature API modules select the mock vs. real implementation at import time based on these flags (see `auth.api.ts` for the pattern).

## Architecture — the rules that matter

Three layers with a strict one-directional dependency rule (**enforced by ESLint `no-restricted-imports`**):

```
app/ (routes)  →  features/ (business)  →  shared/ (reusable infra & UI)
```

- A layer may only import the layers to its right.
- **No cross-feature imports.** `features/a` must never import from `features/b`. Shared logic is lifted into `shared/`.
- **Import only through barrels** (`index.ts`). `import { LoginForm } from '@/features/auth'` ✅ — never reach into `@/features/auth/components/login-form` ❌. Path alias is `@/*` → `src/*`.

**Feature anatomy** (`features/design` is the canonical template): each feature is a vertical slice with `api/` (`*.api.ts` thin fns + `*.keys.ts` query-key factory + `*.mock.ts`), `components/`, `hooks/` (TanStack Query + custom), `schemas/` (Zod), `services/` (pure, no React/HTTP), `store/` (feature-scoped Zustand), `types/`, `constants/`, and a single `index.ts` public surface.

Current features: `auth`, `design` (luồng 3 bước), `handbook` (Cẩm nang + panel cá nhân hóa), `guide` (Hướng dẫn), `landing` (trang chủ), `consultation` (Tư vấn 1:1), `plans` (Gói đăng ký), `account`, `chatbot`, `admin` (khu quản trị).

**Composing across features**: two features that must appear together are joined at the **app layer**, never by importing each other. Two patterns in use — a `ReactNode` slot prop (the Bước 2/3 waiting screen takes `sidePanel`, the app passes `features/handbook`'s panel), and a page composing both barrels (`/account` renders `features/account` + `features/design`'s `MyProjects`). Genuinely cross-cutting state goes to `shared/` instead: `shared/auth`, `shared/favorite` (the ♥ toggle, mục VI) and `shared/cms` — the content store `features/admin` writes to and the public features read from (localStorage while there is no backend; swap the body of `cmsDb` for HTTP calls when the API lands).

**Admin area**: `app/[locale]/(admin)` is an isolated route group — its layout wraps `AntdProvider` → `ProtectedRoute` → `AdminGuard`, so **Ant Design is only bundled there** and the public site stays Tailwind + shadcn. New admin screens are declarations, not layouts: `ResourceManager` (table + search + drawer form) for collections, `DocumentEditor` for single documents, `OverrideEditor` for the flat key→value documents.

The sidebar splits by **nature of the work**, not by module: *Site content* (copy, images, articles — what visitors read), *System configuration* (plan pricing, quotas, catalogues, unit prices — numbers that drive behaviour) and *Operations* (bookings, projects, users). Mixing them is what makes an admin unusable — plan pricing once sat on the same screen as the plans page copy.

Site content is organised **by public page**: one menu entry per page, and each editable block of that page is a **submenu item, not a tab** — everything is visible in the sidebar without clicking into a page first. All of them run through the single dynamic route `/admin/content/[page]?tab=<block>`, driven by `features/admin/constants/admin-pages.config.ts`; `contentPanelsOf()` is the single source both the menu and the screen read, so they cannot drift. Adding a page means adding one entry there, not a new route file.

Within a page's copy block, fields are grouped by the **section the visitor sees** (`handbook.foundation.*` → "Khối Cẩm nang nền tảng"), derived from the key's first two segments — never a hand-picked list, which is guesswork and silently omits things. Panels are ordinary standalone screens; `AdminPanelScope` is the context that tells the `AdminPage` inside them to drop its heading so the tab label does not say the same thing twice. Note `AdminPage`'s root is a plain flex `div`, never antd `Space`: Space wraps each child in an `.ant-space-item` exactly as tall as the child, and `position: sticky` cannot move inside a parent its own height — that silently broke every sticky save bar.

Styling inside `(admin)` follows one rule: antd's CSS-in-JS is **unlayered**, Tailwind v4 utilities live in `@layer utilities`, so utilities lose to antd on antd's own elements. Plain `div`/`span` you build → Tailwind classes. Overriding antd's internal DOM (`.ant-*`) → `admin.css`, or the component's `style` prop (inline always wins). When a rule in `admin.css` does not apply, check specificity against antd's selector before adding `!important` — antd's sheet loads later, so a tie goes to antd.

**Everything on the public site is editable without a deploy.** Beyond the content collections, two flat documents cover the rest: `uiStrings` (i18n key → replacement copy) and `uiAssets` (`shared/lib/imagery` key → replacement image URL). `CmsMessagesProvider` (in the locale layout, inside `NextIntlClientProvider`) layers `uiStrings` over the catalogue, so `useTranslations` picks the edits up untouched; `useSiteImage` does the same for images. Both are per-locale, and both only store keys that were actually changed — a new string in code appears immediately without touching the store. `admin.*` keys are deliberately NOT overridable (`isOverridableMessageKey`), and `uiStrings` never falls back across locales, or an edited Vietnamese string would land on the English site.

Operational screens follow two patterns: `ResourceManager` with `allowEdit={false}` + row-action buttons for decision queues (reschedule requests, package reviews, abuse reports, subscriptions — approve/extend/cancel mutate state, records are never deleted, queues default-filter to the pending state), and bespoke screens where a table is the wrong shape (`BookingCalendar` renders bookings as a month calendar; approving a reschedule request moves the underlying booking itself). The transactions ledger is strictly read-only. Each content page has **one editor screen** ("Nội dung trang"): sections declared in `featuredSections` follow the page's visual scroll order with numbered titles, and each section holds its text fields AND its images together (`imageKeys` per section — only keys the page actually reads via `useSiteImage`; images living inside records are edited on the record's own table, never here). Fields show the live effective text in the input (edit-in-place; typing the original back removes the override) with hand-written labels from `admin.fieldNames`; every other string of the page folds into a collapsed "Advanced" section. `OverrideEditor` binds BOTH `uiStrings` and `uiAssets` and splits the draft by row `kind` on save — one Save button for text and images. `HOME_CONTENT_SEED` is intentionally empty strings: `cmsText` prefers the doc, so a non-empty seed overrides translations (the EN home page once showed Vietnamese because of exactly this).

Usage limits live in one CMS document, `quotas`: free-tier credits, the daily AI-chat allowance and the daily handbook lookup allowance. They used to be three separate hardcoded constants (`chatbot.constants`, `handbook.mock`, and nowhere at all for the free tier) — `useChat` and the handbook mock now read `quotas`, so operations can change them without a deploy. Paid-plan limits stay per-row in the `plans` collection.

Every i18n namespace is **owned by exactly one page** via `copyNamespaces` in `admin-pages.config.ts`, so there is no catch-all key-table screen sitting outside the by-page structure: a page's copy tab shows its curated "frequently edited" list first, then an "everything else on this page" group holding the rest of its namespaces. Namespaces belonging to no single page (`common`, `auth`, `validation`, `theme`, `language`, `favorite`) live on the "Shared copy" page. `ContentWorkspace` warns in development if a namespace is left unclaimed — that is the check keeping the "every string is editable inside its own page" promise honest.

**State**: server state → TanStack Query (each feature owns a hierarchical key factory for safe invalidation); client/UI state → feature-scoped Zustand. The only cross-cutting store is auth (`shared/auth`).

**Data/auth flow**: one Axios instance in `shared/lib/api` (`httpClient` + typed `http` helpers). Auth is **cookie-based (httpOnly), set by the backend** — no token is stored client-side. The auth store (`shared/auth/auth.store.ts`) persists only the non-sensitive user profile. The response interceptor does a **single-flight refresh-token retry on 401**; on refresh failure it clears client auth via the `auth-bridge` (which decouples the HTTP layer from the store). Errors are normalized to `ApiError`.

**Routing & auth gate**: `src/proxy.ts` is the Next.js 16 proxy (the renamed `middleware` convention). It runs next-intl locale routing **and** the primary auth route guard — it redirects based on the presence of the backend-set auth cookie (`PROTECTED_ROUTE_PREFIXES` / `GUEST_ONLY_ROUTES` in `shared/constants/routes.ts`), with no token verification. The client guards in `shared/auth` (`ProtectedRoute`/`GuestRoute`/`RoleGuard`, roles `guest`/`user`/`admin`) handle client navigations and are **UX only** — real authorization is always enforced by the backend.

## Conventions

- **Never hardcode UI text.** All strings live in `messages/vi.json` + `messages/en.json` — add to **both**. i18n is next-intl, locales `vi` (default) / `en`, routes are locale-prefixed (`/vi`, `/en`) via `src/proxy.ts`. Use the locale-aware `Link`/`useRouter` from `@/i18n/navigation`; server pages call `setRequestLocale(locale)`.
- **Forms**: React Hook Form + `zodResolver` + shadcn `Form`. Schemas are built by factories that take resolved localized messages (see `createLoginSchema`) so validation copy is never hardcoded.
- **Styling**: Tailwind v4 with semantic design tokens only (`bg-primary`, `text-muted-foreground`) — never raw hex. Tokens are OKLCH CSS variables in `src/app/globals.css` exposed via `@theme inline`. Every reusable variant uses CVA.
- **shadcn/ui**: `pnpm dlx shadcn@latest add <component>` installs into `src/shared/components/ui` (configured in `components.json`, style "new-york"). Re-export from the `ui/index.ts` barrel afterward. **Extend** primitives with new CVA variants — never replace or hand-roll a primitive shadcn already provides.

## Naming

Files: components/hooks kebab-case (`login-form.tsx`, `use-projects.ts`); stores `*.store.ts`; api/keys `*.api.ts`/`*.keys.ts`; schemas `*.schema.ts`. Components PascalCase, hooks `useX`, Zustand stores `useXStore`, query-key factories `xKeys`, constants UPPER_SNAKE_CASE, translation keys `namespace.dot.case`.

See `docs/ARCHITECTURE.md` for the full contract, `docs/MO_TA_GIAO_DIEN.md` for the UI spec, and `README.md` for the design-system token reference.
