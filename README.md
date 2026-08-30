<div align="center">

<h1 align="center">🚀 SignalLead: Embeddable Widget Platform</h1>

<p align="center">A production-ready backend platform that allows users to create custom widgets, embed them onto any external website with a single <code>&lt;script&gt;</code> tag, and securely capture public form submissions.</p>

<p align="center">
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"></a>
    <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express"></a>
    <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"></a>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS"></a>
</p>

<p align="center">
    <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"></a>
    <a href="https://nginx.org/"><img src="https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white" alt="Nginx"></a>
    <a href="https://github.com/features/codespaces"><img src="https://img.shields.io/badge/GitHub_Codespaces-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Codespaces"></a>
</p>

</div>

---

## 🚀 Overview

This repository is the final Capstone project for the FlyRank Backend Engineering track. It documents the creation of **SignalLead**, a **Zero-Trust architecture** designed to securely ingest data from websites we do not control.

The platform demonstrates practical experience with **Express.js**, strict **CORS** boundary validation, **PostgreSQL** persistence, **Docker Compose** orchestration, **React/Vite** frontend control planes, and asynchronous background processing. The final implementation adds location enrichment fallback chains, spam honeypots, automatic rate limiting, and tenant-isolated data scopes.

It is fully self-contained and includes its own containerized infrastructure, setup instructions, automated tests, and architectural build logs.

---

## ✨ What This Capstone Demonstrates

- Practical **REST API** design with tenant-isolated endpoints.
- Strict **CORS & Origin Validation** that dynamically rejects wildcard (`*`) domains and unauthorized origins.
- **Abuse Protection** featuring IP-based rate limiting (`express-rate-limit`) and hidden honeypot bot traps.
- **Geo-IP Enrichment Chains** with high-availability fallback logic (`ip-api.com` failing over to `ipapi.co`).
- Asynchronous **Webhook Delivery** via n8n for instant email notifications without impacting submission latency.
- Containerization patterns using **Docker** and **Docker Compose** across multiple services (Nginx, Node, Postgres).
- Iterative backend development with a focus on edge-case security, maintainability, and gracefully handling failure.

---

## 🏗️ Architecture Flow

```text
Widget Owner (Authenticated)
  └─► POST /api/widgets ─► PostgreSQL (Tenant-Isolated) ─► Generates Embed Snippet

External Customer Website (Any Origin)
  └─► <script src="http://localhost:8080/widget.js">
  └─► GET /api/widgets/:id/config (Public, Cached)
  └─► Renders UI in Browser

Website Visitor
  └─► POST /api/submissions/:id (Public, CORS-Protected)
       ├─► Validation (Zod) ── Bad Payload? → 400 Bad Request
       ├─► Rate Limit & Spam Check ── Flood? → 429 Too Many Requests
       ├─► Geo-Enrichment: ip-api.com ─(fails)─► ipapi.co ─(fails)─► Proceed without Geo
       ├─► Save to Database
       └─► Async Webhook/Email (Failure does not block submission success)
```

---

## 🛠️ Development Environment

This platform is developed to run consistently across any local or cloud-based environment using **Docker Compose**.

> **Important:** The free Geo-IP providers do not require API keys for testing, but you must instantiate the `.env` file for the Docker containers to boot successfully.

Typical workflow to boot the Capstone:

```bash
# 1. Clone the repository
git clone https://github.com/Ahtesham-Latif/flyrank-capstone-widgetplatform-.git
cd flyrank-capstone-widgetplatform-

# 2. Configure Environment variables
cp .env.example .env

# 3. Boot the orchestrated platform (Nginx, Node, Postgres)
docker compose up -d --build

# 4. Seed the Database with required schema migrations
docker compose exec backend npm run migrate
```

Once running, navigate to `http://localhost:8080` to access the React Control Plane and Sandbox.

### Automated Testing

Automated acceptance probes covering health checks, security boundaries, and payload validation are executed natively:

```bash
docker compose exec backend npm test
```

---

## ⚠️ Known Limitations & Trade-offs

- **Geo-IP Provider Throttling:** We utilize free-tier geolocation providers (`ip-api.com` and `ipapi.co`). Under a sustained, high-concurrency burst attack, these public endpoints will rate-limit our backend. A production environment would require a paid enterprise tier or a self-hosted local MaxMind database.
- **Webhook Delivery Guarantee:** The notification system utilizes a "fire-and-forget" asynchronous pattern to prioritize submission speed and isolate the user experience from upstream downtime. Transient network failures to the webhook server are not currently retried via a dead-letter queue.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for the full text.

---

## 👨‍💻 Author

**Ahtesham Latif**

A backend-focused engineer building practical, production-minded API solutions through structured learning and hands-on implementation.
