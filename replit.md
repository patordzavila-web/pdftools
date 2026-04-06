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
- **Tools**: Merge, Split, Compress, Rotate, Watermark, Reorder, PDF to Word/PPT/Excel, Word/Excel/PPT/HTML to PDF, Edit PDF, Sign PDF, Lock/Unlock PDF, PDF to PDF/A, Scan PDF, OCR PDF
- **Libraries**: `pdf-lib`, `pdfjs-dist`, `file-saver`, `docx`, `xlsx`, `pptxgenjs`, `mammoth`, `tesseract.js`, `html2canvas`, `jspdf`
- All PDF processing happens client-side in the browser — files never leave the user's device
- Home page organized into categories: Optimize & Organize, Convert from PDF, Convert to PDF, Edit & Annotate, Security, Advanced Tools

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
