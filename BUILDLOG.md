# AI & Engineering Build Log

## Overview
This log documents the AI-assisted development process for SignalLead, detailing prompt strategies, structural code edits, debugging sessions, and architectural decisions.

---

## Log Entries

### Phase 1: Core Architecture & Session Auth
* **AI Tooling:** Gemini
* **Assistance Provided:** Generated boilerplates for Express routes and session middleware configurations.
* **Issues & Corrections:** Initial AI session logic lacked explicit `sameSite` and cookie flags for cross-domain requests. Refactored `session.middleware.js` manually to ensure HttpOnly session cookie persistence across local environments.

### Phase 2: Ingestion Perimeter & Zero-Trust CORS
* **AI Tooling:** Gemini
* **Assistance Provided:** Drafted CORS middleware logic to evaluate `allowed_origins`.
* **Issues & Corrections:** AI generated fallback logic allowing `*` wildcards on missing origins. Banned wildcard options entirely and added string normalization to strip trailing slashes (`/\/$/`) from origins.

### Phase 3: Geo-IP Fallback Chain & Webhooks
* **AI Tooling:** Gemini
* **Assistance Provided:** Created dual-provider fetch logic for `ip-api.com` and `ipapi.co`.
* **Issues & Corrections:** Addressed IPv4 loopback issues (`127.0.0.1` / `::1`) during local testing by injecting fallback WAN IPs in non-production environments to test location resolution.

### Phase 4: Control Plane & Live Sandbox
* **AI Tooling:** Gemini
* **Assistance Provided:** Scaffolded Vite + React + Tailwind TypeScript components.
* **Issues & Corrections:** Replaced native alert popups with inline state management and built a dedicated Sandbox page for live widget previews.

### Phase 5: Dockerization & Knex Migrations
* **AI Tooling:** Gemini
* **Assistance Provided:** Configured multi-container `docker-compose.yml` and `Dockerfile` scripts.
* **Issues & Corrections:** Knex originally defaulted to the `development` SQLite environment inside the container. Added explicit `--env production` flags and environment variables to enforce PostgreSQL usage.
