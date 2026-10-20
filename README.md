# TechStore frontend

Milestone 1 establishes the Vite, React, TypeScript, Tailwind CSS, and React Router foundation with shared storefront navigation, responsive layout, design tokens, and centralized business placeholders.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Use `npm run typecheck` for the TypeScript check and `npm run build` for a production build.

## Prototype boundaries

Store contact details and business claims are placeholders in `src/config/store.ts`. Routes for upcoming features currently show a foundation placeholder. There is no API, authentication, order service, or payment integration. The future admin interface must not be exposed in production until backend authentication and server-side role checks are implemented.
