# AI PDF.ly

AI PDF.ly is an AI-powered web application that enables users to query and interact with PDF documents using natural language. Built with Next.js for the frontend and Node.js for the backend, it leverages modern vector databases and caching for fast, intelligent document search and Q&A.

## Features

- **PDF Upload:** Easily upload PDF documents for processing.
- **AI-Powered Search:** Ask questions about your PDFs and get instant, context-aware answers.
- **Citations:** Responses include cited sources from your documents.
- **User Authentication:** Secure sign-in and sign-up flows powered by Clerk.
- **Scalable Backend:** Uses Qdrant for vector search and Valkey (Redis-compatible) for caching.

## Tech Stack

- **Frontend:** Next.js, Clerk, Tailwind CSS
- **Backend:** Node.js, LangChain
- **Vector DB:** Qdrant
- **Cache:** Valkey (Redis-compatible)
- **Containerization:** Docker Compose

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/)

### Installation

1. **Clone the repository:**
   ```sh
   https://github.com/SouravKAgarwal/pdf-rag.git
   cd pdf-rag
   ```

2. **Install dependencies:**
   ```sh
    pnpm install
   ```

3. **Start services with Docker Compose:**
   ```sh
   docker-compose up -d
   ```

4. **Run the development servers:**
   ```sh
   pnpm dev
   ```

### Environment Variables

- Configure `.env` files in both `client` and `server` folders for API keys and service URLs.

- client `.env`
    ```sh
    NEXT_PUBLIC_BACKEND_URL = "http://localhost:8000"
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
    CLERK_SECRET_KEY=""
    ```

- server `.env`
    ```sh
    QDRANT_URL="http://localhost:6333"
    GOOGLE_GEMINI_API_KEY = ""
    ```

## Project Structure

```
pdf-rag/
├── client/      # Next.js frontend
├── server/      # Node.js backend
├── docker-compose.yml
```

## Contributing

Contributions are welcome! Please open issues or submit pull requests.

## License

This project is licensed under the ISC License.