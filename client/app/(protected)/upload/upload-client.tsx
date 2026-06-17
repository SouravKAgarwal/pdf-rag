"use client";

import { useRouter } from "next/navigation";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useDocuments, DocumentInfo } from "@/hooks/use-documents";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useChatMessages } from "@/hooks/use-chat-messages";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProcessingStage } from "@/components/chat/processing-stage";
import { UploadStage } from "@/components/chat/upload-stage";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { FileUp } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
    handleRemoveDocument(id, () => {
      // Already on upload page — nothing extra needed
    });
  };

  const renderContent = () => {
    if (uploadStage === "uploading") {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-background px-4">
          {/* Animated upload orb */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-amber-100 to-orange-50 dark:from-amber-900/40 dark:to-orange-900/20 border border-amber-200/60 dark:border-amber-700/30 flex items-center justify-center shadow-md">
              <FileUp className="h-9 w-9 text-amber-600 dark:text-amber-400" />
            </div>
            {/* Spinning ring */}
            <div className="absolute inset-0 rounded-2xl border-2 border-t-amber-500 border-r-amber-400/50 border-b-transparent border-l-transparent animate-spin" />
          </div>

          <div className="text-center space-y-1.5">
            <p className="text-base font-semibold text-foreground">
              Uploading{" "}
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                {activeFile?.name}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              Securely transferring your document…
            </p>
          </div>

          {/* Shimmer progress bar */}
          <div className="w-48 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-linear-to-r from-amber-400 to-orange-400 animate-pulse"
              style={{ width: "60%" }}
            />
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
        <header className="flex h-(--header-height) shrink-0 items-center justify-between gap-2 border-b border-border/50 bg-background/80 backdrop-blur-sm px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
            <Separator orientation="vertical" className="h-6 mx-2" />
            <h1 className="font-semibold text-sm text-foreground">
              Upload Document
            </h1>
          </div>
          <ThemeToggle />
        </header>
        <div className="flex flex-1 flex-col overflow-hidden">
          {renderContent()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
