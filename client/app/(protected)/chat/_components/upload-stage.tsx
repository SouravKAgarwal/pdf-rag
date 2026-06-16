"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { ArrowLeft, FileUp, FileText, AlertCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    <div className="relative flex flex-col min-h-[calc(100svh-60px)] bg-background">

      {/* Back button */}
      {hasExistingDocuments && (
        <div className="absolute top-4 left-4 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToChat}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to chat
          </Button>
        </div>
      )}

      {/* Centered content */}
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="flex flex-col items-center gap-8 w-full max-w-lg">

          {/* Icon cluster */}
          <div className="relative">
            <div className="w-16 h-16 rounded-xl bg-muted border flex items-center justify-center">
              <FileUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>

          {/* Heading */}
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Upload Document
            </h1>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
              Drop your PDF below to start.
            </p>
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={[
              "relative w-full rounded-xl border-2 border-dashed cursor-pointer",
              "flex flex-col items-center justify-center gap-4 px-8 py-10",
              "transition-all",
              isDragActive
                ? "border-primary bg-primary/5 scale-[1.01]"
                : hasRejection
                ? "border-red-500/50 bg-red-500/5"
                : "border-border hover:bg-muted/50",
            ].join(" ")}
          >
            <input {...getInputProps()} />

            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                isDragActive
                  ? "bg-violet-500/20 scale-110"
                  : "bg-muted"
              }`}
            >
              <FileUp
                className={`h-6 w-6 transition-colors ${
                  isDragActive ? "text-violet-400" : "text-muted-foreground"
                }`}
              />
            </div>

            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                {isDragActive ? "Release to upload" : "Drag & drop your PDF here"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or{" "}
                <span className="text-violet-400 underline-offset-2 hover:underline cursor-pointer">
                  browse from your computer
                </span>
              </p>
            </div>
          </div>

          {/* Rejection error */}
          {hasRejection && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{rejectionMsg ?? "Invalid file. Please upload a PDF."}</span>
            </div>
          )}

          {/* Constraints */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <Badge
              variant="secondary"
              className="gap-1.5 text-xs font-mono"
            >
              <FileText className="h-3 w-3" />
              PDF only
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Max 50 MB
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Max 100 pages
            </Badge>
            <Badge variant="secondary" className="gap-1.5 text-xs">
              <Shield className="h-3 w-3" />
              Encrypted
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
