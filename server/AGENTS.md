# E-Commerce "Catálogo & Stock de Libros" - Core Rules
Stack: Node.js, Express 5, TypeScript, Prisma, PostgreSQL, Zod. 
Runtime: Node ESM enabled (MUST use `.js` extensions for local imports).

## 1. Architecture & Design
- **Feature-First**: `src/modules/<domain>/` contains `.routes.ts`, `.controller.ts`, `.service.ts`, and `.schemas.ts`.
- **Static Classes**: Controllers and Services MUST be classes with `static async` methods. Do NOT instantiate.

## 2. Access Control & Authorization (Single-Tenant)
- **Public Routes**: Catalog endpoints (`GET /api/v1/books`, `POST /api/v1/orders/lead`) are public and DO NOT require JWT auth.
- **Admin Protection**: Mutation endpoints (`POST/PATCH/DELETE /api/v1/books`, `/api/v1/books/lookup`) MUST be protected with `authMiddleware` to verify `req.user.id`.

## 3. Database & Transactions
- **Adapter**: Configured with `@prisma/adapter-pg`.
- **Atomic Writes**: Any operation mutating multiple entities or executing upserts with stock updates MUST be wrapped in `prisma.$transaction`.

## 4. External APIs & Resilience
- **ISBN Lookup Isolation**: External catalog API calls (Google Books, Open Library) MUST be encapsulated in dedicated service methods with sequential fallback logic.
- **Graceful Failures**: External API failures or missing ISBNs MUST NOT throw 500 errors; they MUST fail gracefully returning empty/null metadata to let the client fall back to manual entry.

## 5. Error Handling & Validation (Strict)
- **NO TRY/CATCH**: Express 5 handles async promise rejections natively. Controllers MUST NOT use `try/catch` blocks.
- **AppError**: Throw `AppError(message, statusCode)` for business or DB errors. Let the global error handler catch it.
- **Zod Middleware**: NEVER validate manually in Controllers. ALWAYS use `validateSchema(zodSchema)` in `.routes.ts`. Controllers assume `req.body`, `req.query`, and `req.params` are pre-validated and strongly typed.
