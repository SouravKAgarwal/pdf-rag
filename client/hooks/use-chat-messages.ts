import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { parseSSEStream } from "../lib/sse";
import type { Message, Source } from "../app/chat/_components/message-list";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;
if (!BACKEND) {
  throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined in the environment.");
}

type UseChatMessagesProps = {
  activeDocumentId: string | null;
};

/**
 * Custom hook to manage chat messages, loading history, and streaming AI responses.
 */
export function useChatMessages({ activeDocumentId }: UseChatMessagesProps) {
  const { getToken } = useAuth();
  const [messagesByDoc, setMessagesByDoc] = useState<Record<string, Message[]>>({});
  const messagesLoadedRef = useRef<Set<string>>(new Set());
  const [isStreaming, setIsStreaming] = useState(false);

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
  }, [activeDocumentId, getToken]);

  const removeMessagesForDocument = useCallback((docId: string) => {
    setMessagesByDoc((prev) => {
      const copy = { ...prev };
      delete copy[docId];
      return copy;
    });
    messagesLoadedRef.current.delete(docId);
  }, []);

  const addWelcomeMessage = useCallback((docId: string, filename: string, pageCount: number | null) => {
    const welcomeMsg: Message = {
      id: `welcome-${Date.now()}`,
      role: "assistant",
      content: `**"${filename}"** has been analyzed and indexed successfully${
        pageCount ? ` — ${pageCount} pages` : ""
      }.\n\nI'm ready to answer questions about this document. Ask me anything!`,
      sources: [],
    };
    setMessagesByDoc((prev) => ({
      ...prev,
      [docId]: [welcomeMsg],
    }));
    messagesLoadedRef.current.add(docId);
  }, []);

  const handleSend = useCallback(
    async (query: string) => {
      if (!query || isStreaming || !activeDocumentId) return;

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
                  content: "Connection error. Please check the server and try again.",
                  streaming: false,
                }
              : m,
          ),
        }));
      } finally {
        setIsStreaming(false);
      }
    },
    [activeDocumentId, isStreaming, messagesByDoc, getToken],
  );

  const currentMessages = activeDocumentId
    ? (messagesByDoc[activeDocumentId] ?? [])
    : [];

  return {
    messagesByDoc,
    currentMessages,
    isStreaming,
    handleSend,
    removeMessagesForDocument,
    addWelcomeMessage,
  };
}
