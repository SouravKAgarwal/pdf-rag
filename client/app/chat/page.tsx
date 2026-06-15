"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { UploadStage } from "./_components/upload-stage";
import { ProcessingStage } from "./_components/processing-stage";
import {
  MessageList,
  type Message,
  type Source,
} from "./_components/message-list";
import ChatInput from "./_components/chat-input";
import { ChatSidebar, type DocumentInfo } from "./_components/chat-sidebar";
import { ChatHeader } from "./_components/chat-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

type AppStage = "loading" | "idle" | "uploading" | "processing" | "chat";

// ── SSE stream parser ─────────────────────────────────────────────────────────

async function* parseSSEStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<Record<string, unknown>> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data: ")) continue;
      try {
        yield JSON.parse(line.slice(6)) as Record<string, unknown>;
      } catch {
        /* skip malformed JSON */
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const { user } = useUser();
  const { getToken } = useAuth();

  // ── App stage ─────────────────────────────────────────────────────────────

  const [stage, setStage] = useState<AppStage>("loading");

  // ── Active upload / processing ────────────────────────────────────────────

  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingState, setProcessingState] = useState("waiting");
  const [processingPageCount, setProcessingPageCount] = useState<number | null>(
    null,
  );

  // ── Documents ─────────────────────────────────────────────────────────────

  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);

  // ── Messages (keyed by documentId) ───────────────────────────────────────

  const [messagesByDoc, setMessagesByDoc] = useState<Record<string, Message[]>>(
    {},
  );
  const messagesLoadedRef = useRef<Set<string>>(new Set());

  // ── Chat input ────────────────────────────────────────────────────────────

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  // ── Derived values ────────────────────────────────────────────────────────

  const activeDocument = documents.find((d) => d.id === activeDocumentId);
  const currentMessages = activeDocumentId
    ? (messagesByDoc[activeDocumentId] ?? [])
    : [];

  // ── Load documents from DB on mount ──────────────────────────────────────

  useEffect(() => {
    if (!user) return;

    const loadDocuments = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${BACKEND}/documents`, {
          headers: { Authorization: `Bearer ${token ?? ""}` },
        });
        if (!res.ok) throw new Error("Failed to load documents");

        const data = (await res.json()) as Array<{
          id: string;
          filename: string;
          size: number;
          mimeType: string;
          jobId: string;
          status: string;
          pageCount: number | null;
          errorMessage: string | null;
          createdAt: string;
        }>;

        const docs: DocumentInfo[] = data.map((d) => ({
          id: d.id,
          name: d.filename,
          size: d.size,
          mimetype: d.mimeType,
          jobId: d.jobId,
          status: d.status as "processing" | "ready" | "error",
          pageCount: d.pageCount ?? undefined,
          errorMessage: d.errorMessage ?? undefined,
          uploadedAt: new Date(d.createdAt),
        }));

        setDocuments(docs);

        // Auto-select first ready document, or just any document
        const firstReady = docs.find((d) => d.status === "ready");
        if (firstReady) {
          setActiveDocumentId(firstReady.id);
          setStage("chat");
        } else if (docs.length > 0) {
          setActiveDocumentId(docs[0].id);
          setStage("chat");
        } else {
          setStage("idle");
        }
      } catch {
        setStage("idle");
      }
    };

    loadDocuments();
  }, [user]);

  // ── Load messages when active document changes ────────────────────────────

  useEffect(() => {
    if (!activeDocumentId) return;
    if (messagesLoadedRef.current.has(activeDocumentId)) return;

    const loadMessages = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${BACKEND}/messages/${activeDocumentId}`, {
          headers: { Authorization: `Bearer ${token ?? ""}` },
        });
        if (!res.ok) return;

        const data = (await res.json()) as Array<{
          id: string;
          role: string;
          content: string;
        }>;

        const messages: Message[] = data.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          sources: m.role === "assistant" ? [] : undefined,
        }));

        setMessagesByDoc((prev) => ({ ...prev, [activeDocumentId]: messages }));
        messagesLoadedRef.current.add(activeDocumentId);
      } catch {
        /* non-fatal */
      }
    };

    loadMessages();
  }, [activeDocumentId]);

  // ── Poll job status during processing ────────────────────────────────────

  useEffect(() => {
    if (!activeJobId || stage !== "processing") return;

    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      try {
        const token = await getToken();
        const res = await fetch(`${BACKEND}/status/${activeJobId}`, {
          headers: { Authorization: `Bearer ${token ?? ""}` },
        });
        if (!res.ok) throw new Error("Status fetch failed");

        const data = (await res.json()) as {
          state: string;
          progress: number;
          pageCount?: number | null;
          errorMessage?: string | null;
        };
        setProcessingState(data.state);
        setProcessingProgress(data.progress);
        if (data.pageCount) setProcessingPageCount(data.pageCount);

        if (data.state === "completed") {
          const newDoc = documents.find((d) => d.jobId === activeJobId);

          setDocuments((prev) =>
            prev.map((d) =>
              d.jobId === activeJobId
                ? {
                    ...d,
                    status: "ready",
                    pageCount: data.pageCount ?? d.pageCount,
                  }
                : d,
            ),
          );

          if (newDoc) {
            const welcomeMsg: Message = {
              id: `welcome-${Date.now()}`,
              role: "assistant",
              content: `**"${activeFile?.name}"** has been analyzed and indexed successfully${
                data.pageCount ? ` — ${data.pageCount} pages` : ""
              }.\n\nI'm ready to answer questions about this document. Ask me anything!`,
              sources: [],
            };
            setMessagesByDoc((prev) => ({
              ...prev,
              [newDoc.id]: [welcomeMsg],
            }));
            messagesLoadedRef.current.add(newDoc.id);
            setActiveDocumentId(newDoc.id);
          }

          setStage("chat");
          setActiveJobId(null);
        } else if (data.state === "failed") {
          setDocuments((prev) =>
            prev.map((d) =>
              d.jobId === activeJobId
                ? {
                    ...d,
                    status: "error",
                    errorMessage: data.errorMessage ?? "Processing failed",
                  }
                : d,
            ),
          );
          setStage("chat");
          setActiveJobId(null);
        } else {
          setTimeout(poll, 1500);
        }
      } catch {
        setTimeout(poll, 3000);
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [activeJobId, stage, activeFile, documents]);

  // ── Upload handler ────────────────────────────────────────────────────────

  const handleFileDrop = useCallback(
    async (file: File) => {
      setActiveFile(file);
      setStage("uploading");
      setProcessingProgress(0);
      setProcessingState("waiting");
      setProcessingPageCount(null);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const token = await getToken();
        const res = await fetch(`${BACKEND}/uploads`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token ?? ""}` },
          body: formData,
        });

        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          throw new Error(err.error ?? res.statusText);
        }

        const { jobId, documentId } = (await res.json()) as {
          jobId: string;
          documentId: string;
        };

        setDocuments((prev) => [
          {
            id: documentId,
            name: file.name,
            size: file.size,
            mimetype: file.type,
            jobId,
            status: "processing",
            uploadedAt: new Date(),
          },
          ...prev,
        ]);

        setActiveJobId(jobId);
        setStage("processing");
      } catch (err) {
        console.error("Upload failed:", err);
        alert(
          `Upload failed: ${err instanceof Error ? err.message : String(err)}`,
        );
        setStage(documents.length > 0 ? "chat" : "idle");
      }
    },
    [documents.length],
  );

  // ── Chat / streaming handler ──────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const query = input.trim();
    if (!query || isStreaming || !activeDocumentId) return;

    setInput("");
    setIsStreaming(true);

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
    };
    const assistantId = `ai-${Date.now()}`;
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      sources: [],
      streaming: true,
    };

    setMessagesByDoc((prev) => ({
      ...prev,
      [activeDocumentId]: [
        ...(prev[activeDocumentId] ?? []),
        userMsg,
        assistantMsg,
      ],
    }));

    try {
      const token = await getToken();
      const historyMsgs = (messagesByDoc[activeDocumentId] ?? [])
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch(`${BACKEND}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token ?? ""}`,
        },
        body: JSON.stringify({
          query,
          documentId: activeDocumentId,
          messages: historyMsgs,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Chat request failed");

      for await (const event of parseSSEStream(res.body)) {
        const type = event.type as string;

        if (type === "sources") {
          const sources = event.sources as Source[];
          setMessagesByDoc((prev) => ({
            ...prev,
            [activeDocumentId]: (prev[activeDocumentId] ?? []).map((m) =>
              m.id === assistantId ? { ...m, sources } : m,
            ),
          }));
        } else if (type === "text") {
          const text = event.text as string;
          setMessagesByDoc((prev) => ({
            ...prev,
            [activeDocumentId]: (prev[activeDocumentId] ?? []).map((m) =>
              m.id === assistantId ? { ...m, content: m.content + text } : m,
            ),
          }));
        } else if (type === "done") {
          setMessagesByDoc((prev) => ({
            ...prev,
            [activeDocumentId]: (prev[activeDocumentId] ?? []).map((m) =>
              m.id === assistantId ? { ...m, streaming: false } : m,
            ),
          }));
        } else if (type === "error") {
          setMessagesByDoc((prev) => ({
            ...prev,
            [activeDocumentId]: (prev[activeDocumentId] ?? []).map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: (event.message as string) || "An error occurred.",
                    streaming: false,
                  }
                : m,
            ),
          }));
        }
      }
    } catch {
      setMessagesByDoc((prev) => ({
        ...prev,
        [activeDocumentId]: (prev[activeDocumentId] ?? []).map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  "Connection error. Please check the server and try again.",
                streaming: false,
              }
            : m,
        ),
      }));
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, activeDocumentId, messagesByDoc]);

  // ── Sidebar actions ───────────────────────────────────────────────────────

  const handleSelectDocument = useCallback((id: string) => {
    setActiveDocumentId(id);
  }, []);

  const handleRemoveDocument = useCallback(
    async (id: string) => {
      try {
        const token = await getToken();
        await fetch(`${BACKEND}/documents/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token ?? ""}` },
        });
      } catch (err) {
        console.error("Delete failed:", err);
      }

      setDocuments((prev) => {
        const updated = prev.filter((d) => d.id !== id);
        if (activeDocumentId === id) {
          const next = updated.find((d) => d.status === "ready");
          setActiveDocumentId(next?.id ?? updated[0]?.id ?? null);
          if (updated.length === 0) setStage("idle");
        }
        return updated;
      });

      setMessagesByDoc((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      messagesLoadedRef.current.delete(id);
    },
    [activeDocumentId],
  );

  const handleAddMore = useCallback(() => {
    setStage("idle");
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  // ── Render Content based on Stage ─────────────────────────────────────────

  const renderContent = () => {
    if (stage === "loading") {
      return (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">
              Loading your documents…
            </p>
          </div>
        </div>
      );
    }

    if (stage === "idle") {
      return (
        <UploadStage
          onFileDrop={handleFileDrop}
          hasExistingDocuments={documents.length > 0}
          onBackToChat={() => setStage("chat")}
        />
      );
    }

    if (stage === "uploading") {
      return (
        <div className="flex flex-1 items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-muted border flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-semibold text-sm">
                Uploading {activeFile?.name}
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                Securely transferring your document…
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (stage === "processing") {
      return (
        <ProcessingStage
          filename={activeFile?.name ?? "document"}
          fileSize={activeFile?.size ?? 0}
          progress={processingProgress}
          state={processingState}
          pageCount={processingPageCount}
        />
      );
    }

    // Default to chat stage
    return (
      <div className="@container/main flex flex-1 flex-col gap-2 min-h-0">
        <div className="flex flex-col flex-1 gap-4 pt-4 md:pt-6 pb-2 min-h-0">
          {/* Messages */}
          <div className="flex flex-col flex-1 min-h-0">
            <MessageList
              messages={currentMessages}
              activeDocument={activeDocument}
            />
          </div>

          {/* Input */}
          <div className="shrink-0 px-4 pb-0">
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={handleSend}
              isStreaming={isStreaming}
              disabled={activeDocument?.status !== "ready"}
              documentName={activeDocument?.name}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 64)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
      className="h-svh overflow-hidden"
    >
      <ChatSidebar
        variant="inset"
        documents={documents}
        activeDocumentId={activeDocumentId}
        onDocumentSelect={handleSelectDocument}
        onAddMore={handleAddMore}
        onRemove={handleRemoveDocument}
      />
      <SidebarInset>
        <ChatHeader
          documentName={activeDocument?.name}
          pageCount={activeDocument?.pageCount}
          status={activeDocument?.status}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          {renderContent()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
