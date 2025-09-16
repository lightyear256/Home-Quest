# Home Quest

Home Quest is a full-stack Customer Relationship Management (CRM) application designed to help real-estate professionals manage buyer leads, track property deals, and monitor progress across the entire sales pipeline.  
It provides an intuitive dashboard, client management tools, and real-time deal tracking.

---

## Key Features
- **Secure Authentication**: User sign-up, login, and JWT-based session management.
- **Buyer Management**: Create, update, and track clients with detailed attributes (city, property type, budgets, tags, etc.).
- **Status Tracking**: Buyers can be categorized by status:
  - `New`, `Qualified`, `Contacted`, `Visited`, `Negotiation`, `Converted`, `Dropped`
- **Dashboard Analytics**:
  - Total clients
  - Pending deals (buyers with statuses `New`, `Qualified`, `Contacted`, `Visited`, or `Negotiation`)
- **Buyer History**: Automatic logging of changes (such as status updates) for auditing and review.
- **Responsive UI**: Built with Next.js and Tailwind CSS for a clean and modern interface.

---

## Tech Stack

### Frontend
- Next.js 15 (React framework)
- Tailwind CSS for styling
- Axios for API requests

### Backend
- Node.js + Express.js for RESTful API
- Prisma ORM for database operations
- PostgreSQL as the primary database
- JSON Web Tokens (JWT) for authentication

---

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd home-quest
npm install
```
### 2.Create a .env file in the home-quest folder:
NEXT_PUBLIC_API_URL=

```bash
npm run dev
cd backend
npm install
```
### 2.Create a .env file in the backend folder:
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/homequest"
JWT_SECRET="your_jwt_secret_here"

```bash
npx prisma migrate dev
npx prisma generate
npm run dev

```

### Folder Structure
```bash
repo-root/
├─ backend/               # Express.js API with Prisma ORM
│  ├─ prisma/             # Database schema and migrations
│  ├─ src/                # Backend source (routes, controllers, etc.)
│  └─ ...
├─ home-quest/            # Next.js frontend application
│  ├─ src/                # Pages and components
│  ├─ public/             # Static assets (images, icons, etc.)
│  └─ ...
└─ README.md
```

## Design Notes

### Validation
- **Backend-first validation**: All incoming data is validated on the API using middleware (e.g., Zod) and Prisma schema constraints to ensure type safety and prevent invalid writes.  
- **Lightweight frontend checks**: Basic required-field and format checks (such as email and phone) provide immediate feedback before an API call.

### Rendering Strategy (SSR vs Client)
- **Home page (SSR)**: The landing/home page is rendered on the server for improved SEO and faster initial load for unauthenticated users.  
- **Dashboard & Auth pages (CSR)**: User-specific pages (dashboard, login, signup) use client-side rendering because their content depends on the authenticated user’s token.  
- **Static marketing pages (SSG)**: Pages like “About” are statically generated at build time for optimal performance.

### Ownership Enforcement
- Every API route that reads or mutates buyer data verifies the user’s identity from the JWT.  
- Prisma `where` clauses include the `ownerId` to enforce row-level security.

