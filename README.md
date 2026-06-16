<div align="center">
  <h1>AI PDF Ly</h1>
  <p><b>Transform your static PDFs into interactive, intelligent conversations.</b></p>
  
  [![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
  [![Node.js](https://img.shields.io/badge/Node.js-24-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
  [![Pinecone](https://img.shields.io/badge/Pinecone-Vector%20DB-blue?style=for-the-badge)](https://www.pinecone.io/)
</div>

<br />

AI PDF Ly is a modern, full-stack application that leverages the power of Large Language Models (LLMs) to let you chat seamlessly with your documents. Upload any PDF, and instantly extract insights, summaries, and exact citations without reading hundreds of pages.

## Key Features

- **Seamless PDF Uploads:** Secure and fast background processing of your PDF documents via BullMQ.
- **Intelligent Chat Interface:** Ask complex questions and get human-like responses based strictly on your document's content.
- **Massive Context Windows:** Utilizes Gemini 2.5 Flash with advanced retrieval limits, giving the AI comprehensive context.
- **Source Citations:** Trust but verify. Every answer includes verifiable sources directly from the uploaded text.
- **Optimized Performance:** Built using Next.js 16 Server-Side Rendering (SSR) to eliminate initial client-side loading states.
- **Enterprise-Grade Security:** Fully secure user authentication backed by Clerk.

---

## Architecture & Tech Stack

This project is divided into a robust decoupled architecture.

### Frontend (`/client`)
- **Framework:** Next.js 16.2.9 (App Router)
- **UI Library:** React 19 & Tailwind CSS v4
- **Components:** shadcn/ui
- **Authentication:** Clerk Next.js v7

### Backend (`/server`)
- **Runtime:** Node.js v24 + Express v5
- **AI Orchestration:** Langchain Core v1
- **Language Model & Embeddings:** Google Gemini (Gemini 2.5 Flash via `@google/genai`)
- **Vector Database:** Pinecone v5.1.2 (for compatibility with Langchain)
- **Relational Database:** PostgreSQL managed via Prisma v7.8.0
- **Task Queues:** BullMQ v5
- **Caching/Queue Store:** Cloud Redis (e.g., Upstash)

---

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

Ensure you have the following installed on your system:
- Node.js (v24 or higher)
- pnpm package manager
- A Google Gemini API Key
- A Clerk Account (for Auth keys)
- A PostgreSQL Database (local or managed like Neon/Supabase)
- A Pinecone account and API key 
- A Cloud Redis database (like Upstash) for background task queues

### 1. Clone the repository

```bash
git clone <repository-url>
cd ai-pdf-ly
```

### 2. Environment Configuration

You must configure environment variables for both the client and server. 

**Client Environment (`client/.env`)**
Create a `.env` file in the `client` directory:
```env
NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="<your_clerk_publishable_key>"
CLERK_SECRET_KEY="<your_clerk_secret_key>"
```

**Server Environment (`server/.env`)**
Create a `.env` file in the `server` directory:
```env
PORT=8000
ALLOWED_ORIGINS="http://localhost:3000"

# AI & Database Keys
GOOGLE_GEMINI_API_KEY="<your_gemini_api_key>"
DATABASE_URL="<your_postgres_connection_string>"
PINECONE_API_KEY="<your_pinecone_api_key>"
PINECONE_INDEX="pdf-ai-docs"

# Clerk Auth
CLERK_PUBLISHABLE_KEY="<your_clerk_publishable_key>"
CLERK_SECRET_KEY="<your_clerk_secret_key>"

# Redis Queue Configuration
REDIS_URL="rediss://default:<your_upstash_password>@<your_upstash_host>.upstash.io:6379"
```

### 3. Installation & Database Setup

Install dependencies for both parts of the app:

```bash
# Setup Client
cd client
pnpm install

# Setup Server & Database
cd ../server
pnpm install
npx prisma generate
npx prisma db push
```

### 4. Running the Application

You'll need two terminal windows to run both the frontend and backend development servers.

**Terminal 1: Express Background Worker & Backend API**
```bash
cd server
pnpm run dev
```

**Terminal 2: Next.js Frontend**
```bash
cd client
pnpm run dev
```

Finally, open your browser and navigate to http://localhost:3000 to see the app in action!

---

## License

This project is licensed under the MIT License.
