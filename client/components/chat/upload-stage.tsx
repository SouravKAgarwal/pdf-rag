"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  ArrowLeft,
  FileUp,
  FileText,
  AlertCircle,
  Shield,
  UploadCloud,
  Sparkles,
} from "lucide-react";
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
    <div className="relative flex flex-col flex-1 bg-background overflow-hidden">
      {hasExistingDocuments && (
        <div className="relative z-10 p-4">
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

      <div className="flex flex-1 items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-lg flex flex-col items-center gap-8">
          {/* Header */}
          <div className="flex flex-col items-center gap-4 text-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Upload a PDF
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
                Drop your document below and start chatting with it instantly
                using AI.
              </p>
            </div>
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={[
              "relative w-full rounded-2xl border-2 border-dashed cursor-pointer",
              "flex flex-col items-center justify-center gap-5 px-8 py-14",
              "transition-all duration-300 group select-none",
              isDragActive
                ? "border-foreground/40 bg-muted/60 scale-[1.015] shadow-lg"
                : hasRejection
                ? "border-red-400/60 bg-red-50/40 dark:bg-red-950/10"
                : "border-border/50 hover:border-foreground/30 hover:bg-muted/20",
            ].join(" ")}
          >
            <input {...getInputProps()} />

            {/* Icon */}
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                isDragActive
                  ? "bg-foreground text-background scale-110 shadow-lg"
                  : hasRejection
                  ? "bg-red-100 dark:bg-red-900/30 text-red-500"
                  : "bg-muted text-muted-foreground group-hover:bg-muted/80 group-hover:text-foreground group-hover:-translate-y-1 group-hover:shadow-md"
              }`}
            >
              <FileUp className="h-7 w-7" />
            </div>

            {/* Text */}
            <div className="text-center space-y-1.5">
              <p className="text-sm font-semibold text-foreground">
                {isDragActive
                  ? "Release to upload"
                  : hasRejection
                    ? "Invalid file type"
                    : "Drag & drop your PDF here"}
              </p>
              {!isDragActive && (
                <p className="text-xs text-muted-foreground">
                  or{" "}
                  <span className="text-foreground font-medium hover:underline underline-offset-4 cursor-pointer">
                    click to browse
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Rejection error */}
          {hasRejection && (
            <div className="flex items-center gap-2.5 w-full px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                {rejectionMsg ?? "Invalid file. Please upload a PDF."}
              </span>
            </div>
          )}

          {/* Constraints */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 border border-border/40 px-3 py-1.5 rounded-full">
              <FileText className="h-3.5 w-3.5" />
              PDF only
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 border border-border/40 px-3 py-1.5 rounded-full">
              Max 50 MB
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 border border-border/40 px-3 py-1.5 rounded-full">
              Max 100 pages
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 border border-border/40 px-3 py-1.5 rounded-full">
              <Shield className="h-3.5 w-3.5" />
              End-to-end encrypted
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
