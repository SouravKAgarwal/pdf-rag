import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import type { DocumentInfo } from "./use-documents";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;
if (!BACKEND) {
  throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined in the environment.");
}

type UseFileUploadProps = {
  documents: DocumentInfo[];
  setDocuments: React.Dispatch<React.SetStateAction<DocumentInfo[]>>;
  onProcessingComplete?: (newDoc: DocumentInfo, pageCount: number | null) => void;
  onUploadError?: (error: string) => void;
};

export type UploadStageType = "idle" | "uploading" | "processing";

/**
 * Custom hook to handle file uploading, polling for processing status, and updating document state.
 */
export function useFileUpload({
  documents,
  setDocuments,
  onProcessingComplete,
  onUploadError,
}: UseFileUploadProps) {
  const { getToken } = useAuth();

  const [uploadStage, setUploadStage] = useState<UploadStageType>("idle");
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingState, setProcessingState] = useState("waiting");
  const [processingPageCount, setProcessingPageCount] = useState<number | null>(null);

  useEffect(() => {
    if (!activeJobId || uploadStage !== "processing") return;

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
        
        if (cancelled) return;

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

          if (newDoc && onProcessingComplete) {
            onProcessingComplete(newDoc, data.pageCount ?? null);
          }

          setUploadStage("idle");
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
          if (onUploadError) onUploadError(data.errorMessage ?? "Processing failed");
          setUploadStage("idle");
          setActiveJobId(null);
        } else {
          setTimeout(poll, 1500);
        }
      } catch {
        if (!cancelled) setTimeout(poll, 3000);
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [activeJobId, uploadStage, activeFile, documents, getToken, setDocuments, onProcessingComplete, onUploadError]);

  const handleFileDrop = useCallback(
    async (file: File) => {
      setActiveFile(file);
      setUploadStage("uploading");
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
        setUploadStage("processing");
      } catch (err) {
        console.error("Upload failed:", err);
        if (onUploadError) {
          onUploadError(err instanceof Error ? err.message : String(err));
        } else {
          alert(`Upload failed: ${err instanceof Error ? err.message : String(err)}`);
        }
        setUploadStage("idle");
      }
    },
    [getToken, setDocuments, onUploadError],
  );

  return {
    uploadStage,
    activeFile,
    processingProgress,
    processingState,
    processingPageCount,
    handleFileDrop,
  };
}
