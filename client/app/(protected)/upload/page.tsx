import { auth } from "@clerk/nextjs/server";
import { UploadClient } from "./upload-client";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

export const metadata: Metadata = {
  title: "Upload Document - AI PDF Ly",
  description: "Upload your PDF document to start chatting with it.",
};

async function getDocuments() {
  if (!BACKEND) {
    throw new Error(
      "NEXT_PUBLIC_BACKEND_URL is not defined in the environment.",
    );
  }

  const { getToken, userId } = await auth();
  if (!userId) redirect("/");

  const token = await getToken();
  const res = await fetch(`${BACKEND}/documents`, {
    headers: { Authorization: `Bearer ${token ?? ""}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return data.map((d: any) => ({
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
}

async function UploadContent() {
  const initialDocuments = await getDocuments();
  return <UploadClient initialDocuments={initialDocuments} />;
}

export default function UploadPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center p-8">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <UploadContent />
    </Suspense>
  );
}
