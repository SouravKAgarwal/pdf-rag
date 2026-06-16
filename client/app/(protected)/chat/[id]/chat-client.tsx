"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageList } from "../_components/message-list";
import ChatInput from "../_components/chat-input";
import { ChatSidebar } from "../_components/chat-sidebar";
import { ChatHeader } from "../_components/chat-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

import { useDocuments, DocumentInfo } from "../../../../hooks/use-documents";
import { useChatMessages } from "../../../../hooks/use-chat-messages";

export function ChatClient({
  activeDocumentId,
  initialDocuments,
}: {
  activeDocumentId: string;
  initialDocuments: DocumentInfo[];
}) {
  const router = useRouter();

  const { documents, handleRemoveDocument } = useDocuments({
    initialDocuments,
    onInitialLoad: (docs) => {
      // If the ID is invalid or not found, we could redirect to upload
      // But let's just let the UI handle empty states
    },
  });

  const {
    currentMessages,
    isStreaming,
    handleSend: handleSendChat,
    removeMessagesForDocument,
  } = useChatMessages({
    activeDocumentId,
  });

  const [input, setInput] = useState("");

  const handleSend = () => {
    handleSendChat(input);
    setInput("");
  };

  const onRemoveDocument = (id: string) => {
    handleRemoveDocument(id, (deletedId, remainingDocs) => {
      removeMessagesForDocument(deletedId);
      if (deletedId === activeDocumentId) {
        // If the active document was deleted, navigate away
        const nextReady = remainingDocs.find((d) => d.status === "ready");
        if (nextReady) {
          router.push(`/chat/${nextReady.id}`);
        } else {
          router.push("/upload");
        }
      }
    });
  };

  const activeDocument = documents.find((d) => d.id === activeDocumentId);

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
        onDocumentSelect={(id: string) => router.push(`/chat/${id}`)}
        onAddMore={() => router.push("/upload")}
        onRemove={onRemoveDocument}
      />
      <SidebarInset>
        <ChatHeader
          documentName={activeDocument?.name}
          pageCount={activeDocument?.pageCount}
          status={activeDocument?.status}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="@container/main flex flex-1 flex-col gap-2 min-h-0">
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex flex-col flex-1 min-h-0">
                <MessageList
                  messages={currentMessages}
                  activeDocument={activeDocument}
                />
              </div>

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
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
