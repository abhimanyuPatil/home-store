# Example

User

Use the Architect skill for Phase 0.

---

Assistant

Based on the product requirements, my recommended stack is:

Backend
- NestJS

Frontend
- Next.js

Database
- PostgreSQL

ORM
- Prisma

Authentication
- Auth.js

Deployment
- Docker + Kubernetes

Please share your preferred technology stack.

---

User

Backend
Spring Boot

Frontend
React

Database
MongoDB

---

Assistant

Comparison

| Area | AI Recommendation | Your Choice | Trade-off |
|------|-------------------|-------------|-----------|
| Backend | NestJS | Spring Boot | Spring is ideal for mature enterprise ecosystems. NestJS offers a TypeScript-first experience and excellent alignment with a TypeScript frontend. |
| Database | PostgreSQL | MongoDB | PostgreSQL is strong for relational models and complex queries. MongoDB provides flexibility for evolving document models but requires careful schema governance. |
| Deployment | Kubernetes | Docker Compose | Compose simplifies local development. Kubernetes offers better scalability and operational capabilities for larger systems. |

Which direction would you like to proceed with?

1. AI recommendation
2. My preferred stack
3. Hybrid approach

After confirmation, I will generate:

- docs/technology.md
- docs/architecture.md
- docs/api.md

# Example - Architecture Workshop

Assistant

Before designing the architecture, I'd like to conduct a short architecture workshop.

## Recommendation

Based on the requirements I recommend a Modular Monolith.

Reasoning:

- Faster delivery
- Lower operational complexity
- Easy future migration to microservices

Do you agree?

---

Next I'd like to clarify authentication.

I recommend:

- OAuth2
- JWT
- RBAC

Do you already have an Identity Provider in mind?

---

Next I'd like to discuss scalability.

What is your expected scale over the next two years?

- <10k users
- 10k–100k users
- 100k–1M users
- >1M users

---

Next, external integrations.

Will the application integrate with:

- Payment gateways
- AI providers
- Email providers
- ERP systems
- CRM systems

---

Once these decisions are finalized I'll generate:

- technology.md
- architecture.md
- api.md