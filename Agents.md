# Chakra Backend v2 — Agent Guide

Instructions for every AI coding agent (Claude, Gemini, Copilot, Cursor, Codex…) working in this repo.
Read this file fully before making changes. The rules in **Strict rules** override anything else.

## Project

REST API backend for **Chakra**: a franchise-based business with roles
`super_admin`, `owner`, `manager`, `tech`, `washer`. It currently provides
JWT authentication (login / refresh / logout with DB-backed sessions) and user CRUD.

- Base URL: `http://localhost:<PORT>/api/v1`
- Swagger UI: `http://localhost:<PORT>/api/docs`
- Every route requires `Authorization: Bearer <accessToken>` unless marked `@Public()`.

## Stack

| Area | Tool |
|---|---|
| Runtime | Node.js 22, TypeScript 6 (CommonJS output, `module: nodenext`) |
| Framework | NestJS 12 (Express) |
| Database | PostgreSQL, tables live in the **`chakra`** schema (not `public`) |
| ORM | Drizzle ORM 1.0 rc + `@nestjs/drizzle`, `pg` driver; `drizzle-kit` for schema push |
| Validation | `class-validator` + `class-transformer` (global `ValidationPipe`) |
| Auth | `jsonwebtoken` (helpers in `common/utils/jwt.utils.ts`), `bcryptjs` |
| IDs | Internal `id` = bigint identity; public `userId` = 16-char `nanoid` (v3) |
| Docs | `@nestjs/swagger` + Nest CLI swagger plugin (reads DTOs automatically) |
| Config | `@nestjs/config` (`.env`) |
| Quality | Prettier (single quotes, trailing commas), oxlint, Jest |

Installed but **not used**: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `@nestjs/mapped-types`. Do not build on them without asking.

## Folder structure

```
src/
  main.ts                    # bootstrap: /api/v1 prefix, ValidationPipe, CORS, Swagger
  app.module.ts              # root module
  common/                    # shared, feature-independent code
    decorators/              # @Public(), @CurrentUser()
    enums/                   # UserRole, ...
    errors/                  # ErrorException + error record
    guards/                  # AuthGuard (global, registered in AuthzModule)
    interfaces/              # User, UserContext (+ Express req.user typing)
    logger/                  # AppLogger, LogColor
    swagger/                 # swagger settings
    utils/                   # jwt.utils, public-id, error-codes.config
  database/                  # DB layer (see protected files)
    database.module.ts       # @Global; Drizzle connection + provides all repositories
    schema/                  # Drizzle tables/enums (chakra schema) + password hash helpers
    repository/              # ALL database queries live here
    seed/                    # create-super-admin script
  modules/                   # feature modules
    auth/                    # login, refresh, logout, me  (authz.*)
    user/                    # user CRUD (+ dto/)
.github/workflows/           # auto PR to develop (protected)
.vscode/                     # editor settings (protected)
drizzle.config.ts            # drizzle-kit config, schemaFilter: ['chakra'] (protected)
```

## Architecture conventions

- **Layers:** Controller → Service → Repository. Controllers only map HTTP; services hold business rules; **only repositories touch Drizzle/`db`**.
- Repositories are injected via `@InjectDrizzle()` and exported from `DatabaseModule` (global).
- **Never expose the internal `id` or `password`.** Routes use the public `userId` as `:id`. Return users through `toUserResponse()`.
- Passwords: always use `hashPassword()` / `comparePassword()` from `database/schema/user.schema.ts`.
- DTOs are classes with `class-validator` decorators; update DTOs use `PartialType` from `@nestjs/swagger`.
- Enums go in `common/enums/`, shared interfaces in `common/interfaces/`.
- Errors: auth code uses `ErrorException('<KEY>')` (keys in `common/utils/error-codes.config.ts`); user module uses Nest built-in exceptions.
- Logging: `new Logger(ClassName.name)`; never log passwords, tokens, or `DATABASE_URL`.
- Public routes need `@Public()`; the logged-in user is `@CurrentUser() user: UserContext`.

## Commands

```
npm run start:dev                       # dev server (watch)
npx tsc --noEmit -p tsconfig.json       # type-check
npm run lint                            # oxlint
npx prettier --check src                # formatting
npm test                                # jest
npm run seed:admin                      # create first super admin (reads SEED_ADMIN_* from .env)
```

## Strict rules

### 1. Protected files — do NOT modify, create, rename, or delete
Unless the user explicitly asks for that exact file in the current request:

- `.github/**` (GitHub workflows)
- `.vscode/**` (editor settings)
- `src/database/schema/**` (tables, enums, hash helpers)
- `src/database/database.module.ts`, `src/database/seed/**`
- `drizzle.config.ts`
- `.env` — never print, copy, or commit its values

Inside `src/database/`, **only `src/database/repository/**` may be edited.**
If a task needs a protected file changed (e.g. a new column, or registering a new repository in `database.module.ts`), **stop and tell the user exactly what change is needed** instead of making it.

### 2. Database and git safety
- Never run `drizzle-kit push`, migrations, `DROP`/`DELETE`/`TRUNCATE`, or any write to the database unless the user asks.
- Never `git commit`, `git push`, force-push, or change branches unless the user asks. Work flows `feature/*` → `develop` → `main`; never push directly to `main` or `develop`.
- Never install, remove, or upgrade packages without asking.

### 3. No hallucination
- Only reference files, functions, env vars, and packages that exist. Check with search/read **before** using them.
- Check `package.json` before importing a library. Check `error-codes.config.ts` before using an error key.
- Follow the existing patterns in this repo; don't invent new layers, folders, or abstractions.
- If something is unknown or ambiguous, say so and ask. Never guess API shapes, column names, or business rules.
- Never claim code works without running `tsc`, lint, or a test. Report failures honestly.

### 4. Token optimization
- Read only the files the task needs; search (grep/glob) before opening files.
- Never read `node_modules/`, `dist/`, `package-lock.json`, `*.tsbuildinfo`, or `.env`.
- Read large files in ranges; don't re-read a file you already have unless it changed.
- Make small, targeted edits; don't rewrite whole files for small changes.
- Keep replies short: lead with the result, no restating code the user can see, no long summaries.
- Don't add comments, docs, or files that weren't asked for.
