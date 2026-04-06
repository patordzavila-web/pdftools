# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### PDF Tools (`artifacts/pdf-tools`)
- **Type**: React + Vite (frontend-only, no backend)
- **Preview path**: `/`
- **Description**: iLovePDF clone — browser-based PDF toolkit
- **Tools**: Merge, Split, Compress, PDF to Images, Images to PDF, Rotate, Watermark
- **Libraries**: `pdf-lib` (PDF manipulation), `pdfjs-dist` (PDF rendering), `file-saver` (downloads)
- All PDF processing happens client-side in the browser

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
