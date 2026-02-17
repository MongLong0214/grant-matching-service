# Grant Matching Service - Project Overview

## Purpose
Korean government grant/support matching service for small businesses (소상공인/중소기업). Matches businesses with relevant government support programs based on their profile.

## Tech Stack (Stack B - Supabase/RQ)
- **Framework**: Next.js (App Router) with TypeScript
- **Database**: Supabase (with `supabase/` directory present)
- **Styling**: Tailwind CSS
- **Package Manager**: npm
- **Deployment**: Vercel (`vercel.json` present)

## Key Directories
- `src/` - Source code root
- `src/lib/` - Utility libraries (seed-data, etc.)
- `supabase/` - Supabase configuration
- `public/` - Static assets
- `scripts/` - Utility scripts

## Commands
- `tsc --noEmit` - TypeScript check
- `next build` - Build
- `eslint .` - Lint
