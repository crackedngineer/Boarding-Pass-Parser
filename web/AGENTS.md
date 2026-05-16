<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## This Project's Next.js Specifics

**Version:** Next.js 16.2.4, React 19.2.4, Tailwind CSS v4.

**Breaking changes relevant here:**
- Tailwind v4: no `tailwind.config.js` — theme is CSS custom properties in `app/globals.css`
- `radix-ui` v1 monorepo: import as `import { Dialog } from 'radix-ui'`, not `@radix-ui/react-dialog`
- shadcn/ui components are in `web/components/ui/` — check before adding new ones
- ESLint v9: flat config in `eslint.config.mjs`, not `.eslintrc.*`

**Import conventions:**
- `@/` resolves to `web/` (not `web/src/`)
- All API calls use `@/lib/api/http-client` with `credentials: 'include'` — never raw `fetch`
