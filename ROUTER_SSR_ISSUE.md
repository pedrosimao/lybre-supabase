# @solidjs/router SSR Issue

## Problem

Persistent error when running Solid Start dev server:

```
Error: Client-only API called on the server side. Run client-only code in onMount, or conditionally run client-only component with <Show>.
    at notSup (file:///home/user/lybre-supabase/node_modules/solid-js/web/dist/server.js:760:9)
    at file:///home/user/lybre-supabase/node_modules/@solidjs/router/dist/index.js:1454:27
```

The error occurs at line 1454:27 of @solidjs/router during SSR module evaluation.

## Attempted Fixes

1. **Removed `cache()` wrapper** from @solidjs/router
   - Changed all route data loading functions from `cache(async () => {...}, 'key')` to plain `async function() {...}`
   - Files affected: `src/routes/portfolio.tsx`, `src/routes/transcript/[ticker].tsx`

2. **Replaced `redirect()` with native Response objects**
   - Changed from `throw redirect('/path')` to `throw new Response(null, { status: 302, headers: { Location: '/path' } })`
   - Files affected: `src/routes/index.tsx`, `src/routes/portfolio.tsx`

3. **Fixed `action()` usage**
   - Removed incorrect `action()` wrapper from server CRUD functions
   - `action()` should only wrap form handlers that receive FormData
   - Files affected: `src/server/holdings.ts`, `src/server/portfolio.ts`

4. **Package updates**
   - Updated @solidjs/router from 0.14.10 to 0.15.4
   - Updated @solidjs/start from 1.0.11 to 1.2.0
   - Updated solid-js from 1.9.3 to 1.9.10

5. **Cleaned environment**
   - Removed `node_modules` and reinstalled
   - Removed `.vinxi` build cache
   - Removed leftover Next.js files: `next.config.mjs`, `next-env.d.ts`

6. **Simplified entry files**
   - Created minimal `src/entry-client.tsx` and `src/entry-server.tsx`
   - Removed redundant `src/root.tsx` and `src/middleware.ts`

## Current Status

Despite all fixes, the error persists. This appears to be a fundamental issue with how @solidjs/router is being loaded in the SSR context.

##  Next Steps

1. **Report to Solid Start team** - This may be a bug in @solidjs/router v0.15.4
2. **Try alternative routing** - Consider using file-based routing without programmatic redirects
3. **Fresh migration** - Create a new Solid Start project and migrate code incrementally
4. **Community help** - Seek assistance on Solid Discord or GitHub discussions

## Improvements Made

Even though the router issue persists, the following improvements were successfully implemented:

- Fixed anti-patterns in server function usage
- Removed incorrect `action()` wrappers
- Simplified entry files
- Cleaned up leftover Next.js artifacts
- Updated to latest compatible package versions
- Used native Response objects for redirects

## Build Status

✅ Production build completes successfully
❌ Dev server fails with router SSR error

The application builds without errors, suggesting the issue is specific to the dev server's SSR evaluation.
