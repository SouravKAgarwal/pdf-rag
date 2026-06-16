# AI PDF Ly

AI PDF Ly is a full-stack application that allows users to upload PDF documents and interact with them using AI. It uses modern embeddings and language models to enable semantic search, document summarization, and instant answers backed by citations.

## Features
- **Upload PDF Documents**: Securely upload and store your PDF files.
- **Instant AI Chat**: Ask questions and get answers directly from your documents.
- **Source Citations**: Every response includes references to the original document.
- **Secure Authentication**: Built-in user authentication using Clerk.

## Tech Stack

### Frontend (Client)
- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Components)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Authentication**: [Clerk](https://clerk.com/)

### Backend (Server)
- **Framework**: Node.js & [Express.js](https://expressjs.com/)
- **AI & Embeddings**: [Langchain](https://js.langchain.com/) & [Google Gemini](https://ai.google.dev/)
- **Vector Database**: [Qdrant](https://qdrant.tech/)
- **Database**: PostgreSQL (via [Prisma](https://www.prisma.io/))

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- [pnpm](https://pnpm.io/)
- A Qdrant instance (local or cloud)
- A Google Gemini API Key
- A Clerk Account (for authentication)
- A PostgreSQL database

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ai-pdf-ly
   ```

2. **Install dependencies:**
   This project uses a monorepo structure (or separate client/server folders).
   ```bash
   # Install client dependencies
   cd client
   pnpm install
   
   # Install server dependencies
   cd ../server
   pnpm install
   ```

### Environment Variables

You need to configure the environment variables for both the client and the server.

**Client (`client/.env`)**
```env
NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="<your-clerk-publishable-key>"
CLERK_SECRET_KEY="<your-clerk-secret-key>"
```

**Server (`server/.env`)**
```env
PORT=8000
ALLOWED_ORIGINS="http://localhost:3000"
QDRANT_URL="http://localhost:6333"
GOOGLE_GEMINI_API_KEY="<your-gemini-api-key>"
CLERK_PUBLISHABLE_KEY="<your-clerk-publishable-key>"
CLERK_SECRET_KEY="<your-clerk-secret-key>"
DATABASE_URL="<your-postgresql-database-url>"
```

### Running the Application

1. **Start the Express backend:**
   ```bash
   cd server
   pnpm run dev
   ```

2. **Start the Next.js frontend:**
   Open a new terminal window:
   ```bash
   cd client
   pnpm run dev
   ```

3. **Open the app:**
   Navigate to `http://localhost:3000` in your browser.

## License
MIT
