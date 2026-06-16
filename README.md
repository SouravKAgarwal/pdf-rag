<div align="center">
  <h1>AI PDF Ly</h1>
  <p><b>Transform your static PDFs into interactive, intelligent conversations.</b></p>
  
  [![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
  [![Qdrant](https://img.shields.io/badge/Qdrant-Vector%20DB-blue?style=for-the-badge)](https://qdrant.tech/)
</div>

<br />

AI PDF Ly is a modern, full-stack application that leverages the power of Large Language Models (LLMs) to let you chat seamlessly with your documents. Upload any PDF, and instantly extract insights, summaries, and exact citations without reading hundreds of pages.

## Key Features

- **Seamless PDF Uploads:** Secure and fast processing of your PDF documents.
- **Intelligent Chat Interface:** Ask complex questions and get human-like responses based strictly on your document's content.
- **Source Citations:** Trust but verify. Every answer includes verifiable sources directly from the uploaded text.
- **Optimized Performance:** Built using Next.js Server-Side Rendering (SSR) to completely eliminate initial client-side loading states.
- **Enterprise-Grade Security:** Fully secure user authentication backed by Clerk.

---

## Architecture & Tech Stack

This project is divided into a robust decoupled architecture.

### Frontend (/client)
- **Framework:** Next.js 14 (App Router)
- **UI Library:** React & Tailwind CSS
- **Components:** shadcn/ui
- **Authentication:** Clerk

### Backend (/server)
- **Runtime:** Node.js + Express
- **AI Orchestration:** Langchain
- **Language Model & Embeddings:** Google Gemini
- **Vector Database:** Qdrant (for fast semantic search)
- **Relational Database:** PostgreSQL managed via Prisma
- **Caching/Task Queues:** Valkey (Redis alternative)

---

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

Ensure you have the following installed on your system:
- Node.js (v18 or higher)
- pnpm package manager
- Docker & Docker Compose (for running Qdrant and Valkey)
- A Google Gemini API Key
- A Clerk Account (for Auth keys)
- A PostgreSQL Database (local or managed like Neon/Supabase)

### 1. Clone the repository

```bash
git clone <repository-url>
cd ai-pdf-ly
```

### 2. Start Infrastructure (Docker)

The project includes a `docker-compose.yml` file to spin up necessary local services, specifically the Qdrant vector database and Valkey.

Run the following command at the root of the project to start them in the background:
```bash
docker-compose up -d
```

### 3. Environment Configuration

You must configure environment variables for both the client and server. 

**Client Environment (client/.env)**
Create a `.env` file in the `client` directory:
```env
NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="<your_clerk_publishable_key>"
CLERK_SECRET_KEY="<your_clerk_secret_key>"
```

**Server Environment (server/.env)**
Create a `.env` file in the `server` directory:
```env
PORT=8000
ALLOWED_ORIGINS="http://localhost:3000"
QDRANT_URL="http://localhost:6333" # Points to the local Docker container
GOOGLE_GEMINI_API_KEY="<your_gemini_api_key>"
CLERK_PUBLISHABLE_KEY="<your_clerk_publishable_key>"
CLERK_SECRET_KEY="<your_clerk_secret_key>"
DATABASE_URL="<your_postgres_connection_string>"
```

### 4. Installation & Database Setup

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

### 5. Running the Application

You'll need two terminal windows to run both the frontend and backend development servers.

**Terminal 1: Express Backend**
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
