"use client";

import { useRouter } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { UploadStage } from "../chat/_components/upload-stage";
import { ProcessingStage } from "../chat/_components/processing-stage";
import { ChatSidebar } from "../chat/_components/chat-sidebar";

import { useDocuments, DocumentInfo } from "../../hooks/use-documents";
import { useFileUpload } from "../../hooks/use-file-upload";
import { useChatMessages } from "../../hooks/use-chat-messages";

export function UploadClient({
  initialDocuments,
}: {
  initialDocuments: DocumentInfo[];
}) {
  const router = useRouter();

  const { documents, setDocuments, handleRemoveDocument } = useDocuments({
    initialDocuments,
  });
  const { addWelcomeMessage } = useChatMessages({ activeDocumentId: null });

  const {
    uploadStage,
    activeFile,
    processingProgress,
    processingState,
    processingPageCount,
    handleFileDrop,
  } = useFileUpload({
    documents,
    setDocuments,
    onProcessingComplete: (newDoc, pageCount) => {
      addWelcomeMessage(newDoc.id, newDoc.name, pageCount);
      router.push(`/chat/${newDoc.id}`);
    },
  });

  const onRemoveDocument = (id: string) => {
    handleRemoveDocument(id, (deletedId, remainingDocs) => {
      // Nothing special to do here since we are already on the upload page
    });
  };

  const renderContent = () => {
    if (uploadStage === "uploading") {
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

    if (uploadStage === "processing") {
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

    return (
      <UploadStage
        onFileDrop={handleFileDrop}
        hasExistingDocuments={documents.length > 0}
        onBackToChat={() => {
          if (documents.length > 0) {
            router.push(`/chat/${documents[0].id}`);
          }
        }}
      />
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
        activeDocumentId={null}
        onDocumentSelect={(id: string) => router.push(`/chat/${id}`)}
        onAddMore={() => {}}
        onRemove={onRemoveDocument}
      />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4">
          <h1 className="font-semibold text-sm">Upload Document</h1>
        </header>
        <div className="flex flex-1 flex-col overflow-hidden">
          {renderContent()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
