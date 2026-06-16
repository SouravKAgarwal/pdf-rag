import { useState, useEffect, useCallback } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;
if (!BACKEND) {
  throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined in the environment.");
}

export type DocumentInfo = {
  id: string;
  name: string;
  size: number;
  mimetype: string;
  jobId: string;
  status: "processing" | "ready" | "error";
  pageCount?: number;
  errorMessage?: string;
  uploadedAt: Date;
};

type UseDocumentsProps = {
  initialDocuments?: DocumentInfo[];
  onInitialLoad?: (docs: DocumentInfo[]) => void;
};

/**
 * Custom hook to manage fetching and deleting the user's documents.
 */
export function useDocuments(props?: UseDocumentsProps) {
  const { user } = useUser();
  const { getToken } = useAuth();
  
  const [documents, setDocuments] = useState<DocumentInfo[]>(props?.initialDocuments ?? []);
  const [isLoading, setIsLoading] = useState(!props?.initialDocuments);

  useEffect(() => {
    if (!user) return;

    // Skip initial fetch if documents were provided by SSR
    if (props?.initialDocuments) {
      setIsLoading(false);
      return;
    }

    const loadDocuments = async () => {
      setIsLoading(true);
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
        props?.onInitialLoad?.(docs);
      } catch (err) {
        console.error("Failed to load documents", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocuments();
  }, [user, getToken]); // Note: omitted props to avoid infinite loops if props changes reference

  const handleRemoveDocument = useCallback(
    async (id: string, onDeleteSuccess?: (id: string, remainingDocs: DocumentInfo[]) => void) => {
      const remainingDocs = documents.filter((d) => d.id !== id);
      setDocuments(remainingDocs);
      onDeleteSuccess?.(id, remainingDocs);

      try {
        const token = await getToken();
        await fetch(`${BACKEND}/documents/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token ?? ""}` },
        });
      } catch (err) {
        console.error("Delete failed:", err);
      }
    },
    [documents, getToken],
  );

  return {
    documents,
    setDocuments,
    isLoading,
    handleRemoveDocument,
  };
}
