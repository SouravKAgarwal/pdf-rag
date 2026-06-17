"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { ArrowLeft, FileUp, FileText, AlertCircle, Shield, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadStageProps {
  onFileDrop: (file: File) => void;
  hasExistingDocuments: boolean;
  onBackToChat: () => void;
}

export function UploadStage({
  onFileDrop,
  hasExistingDocuments,
  onBackToChat,
}: UploadStageProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileDrop(acceptedFiles[0]);
      }
    },
    [onFileDrop],
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: { "application/pdf": [".pdf"] },
      multiple: false,
      maxSize: 50 * 1024 * 1024,
    });

  const hasRejection = fileRejections.length > 0;
  const rejectionMsg = fileRejections[0]?.errors[0]?.message;

  return (
    <div className="relative flex flex-col min-h-[calc(100svh-60px)] bg-background overflow-hidden">
      {/* Decorative ambient gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden flex justify-center">
        <div className="absolute -top-[20%] w-[800px] h-[400px] bg-amber-500/10 dark:bg-amber-500/5 blur-[120px] rounded-[100%] opacity-70 transition-opacity duration-700" />
      </div>

      {/* Back button */}
      {hasExistingDocuments && (
        <div className="absolute top-6 left-6 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToChat}
            className="gap-2 text-muted-foreground hover:text-foreground rounded-full px-4 hover:bg-muted/60 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to chat
          </Button>
        </div>
      )}

      {/* Centered content */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-xl mx-auto flex flex-col items-center">
          
          {/* Glassmorphic Card */}
          <div className="w-full rounded-3xl border border-border/50 bg-background/60 backdrop-blur-2xl shadow-xl dark:shadow-2xl dark:shadow-black/40 overflow-hidden relative">
            {/* Top decorative bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 opacity-90"></div>
            
            <div className="p-10 sm:p-14 flex flex-col items-center gap-8">
              
              {/* Heading */}
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-50 dark:from-amber-900/40 dark:to-orange-900/20 border border-amber-200/50 dark:border-amber-500/20 flex items-center justify-center mb-2 shadow-sm">
                  <UploadCloud className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-foreground">
                  Upload Document
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base max-w-sm leading-relaxed">
                  Drop your PDF securely to begin interacting with the AI instantly.
                </p>
              </div>

              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={[
                  "relative w-full rounded-2xl border-2 border-dashed cursor-pointer",
                  "flex flex-col items-center justify-center gap-5 px-8 py-12 sm:py-16",
                  "transition-all duration-300 group",
                  isDragActive
                    ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 scale-[1.02] shadow-[0_0_40px_rgba(245,158,11,0.15)]"
                    : hasRejection
                    ? "border-red-500/50 bg-red-500/5"
                    : "border-border/60 hover:border-amber-400/50 hover:bg-muted/30 hover:shadow-lg hover:shadow-amber-500/5",
                ].join(" ")}
              >
                <input {...getInputProps()} />

                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    isDragActive
                      ? "bg-amber-500 text-white scale-110 rotate-3"
                      : "bg-muted/80 text-muted-foreground group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:-translate-y-1"
                  }`}
                >
                  <FileUp
                    className="h-7 w-7 transition-colors"
                  />
                </div>

                <div className="text-center space-y-1">
                  <p className="text-base font-semibold text-foreground">
                    {isDragActive ? "Release to upload" : "Drag & drop your PDF here"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or{" "}
                    <span className="text-amber-600 dark:text-amber-400 font-medium underline-offset-4 hover:underline cursor-pointer">
                      browse from your computer
                    </span>
                  </p>
                </div>
              </div>

              {/* Rejection error */}
              {hasRejection && (
                <div className="flex items-center justify-center w-full p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-medium animate-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
                  <span>{rejectionMsg ?? "Invalid file. Please upload a PDF."}</span>
                </div>
              )}

              {/* Constraints */}
              <div className="flex items-center gap-3 flex-wrap justify-center w-full pt-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                  <FileText className="h-3.5 w-3.5" />
                  PDF only
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                  Max 50 MB
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                  Max 100 pages
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600/80 dark:text-amber-400/80 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-full">
                  <Shield className="h-3.5 w-3.5" />
                  Secure & Encrypted
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
