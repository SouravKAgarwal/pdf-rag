import { auth } from "@clerk/nextjs/server";
import { ChatClient } from "./chat-client";
import { redirect } from "next/navigation";
import { Metadata } from "next";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

async function getDocuments() {
  if (!BACKEND) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined in the environment.");
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

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const docs = await getDocuments();
  const activeDoc = docs.find((d: any) => d.id === id);

  return {
    title: activeDoc ? `${activeDoc.name} - Chat` : "Chat",
    description: "Chat with your PDF document instantly using AI.",
  };
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const initialDocuments = await getDocuments();

  return <ChatClient activeDocumentId={id} initialDocuments={initialDocuments} />;
}
