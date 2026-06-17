"use client";

import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/kibo-ui/dropzone";
import { useState } from "react";
import { FileText, Trash2 } from "lucide-react";

export default function PdfDropZone() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleDrop = async (files: File[]) => {
    const pdf = files[0];
    if (!pdf) return;

    setFile(pdf);
    setUploading(true);

    const formData = new FormData();
    formData.append("pdf", pdf);

    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads`, {
        method: "POST",
        body: formData,
      });
      console.log("✅ File uploaded:", pdf.name);
    } catch (err) {
      console.error("❌ Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
  };

  if (file) {
    return (
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 w-full flex flex-col items-center text-center hover:border-[#3a3a3a] transition-all">
        <div className="flex flex-col items-center gap-3">
          <FileText size={36} className="text-[#f8f5ee]" />
          <p className="text-sm text-[#f8f5ee] truncate max-w-[12rem]">
            {file.name}
          </p>
          <p className="text-xs text-neutral-500">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>

        <button
          onClick={handleRemove}
          className="flex items-center gap-2 text-xs mt-4 text-red-400 hover:text-red-300 transition"
        >
          <Trash2 size={14} /> Remove
        </button>
      </div>
    );
  }

  return (
    <Dropzone
      accept={{ "application/pdf": [] }}
      maxFiles={1}
      maxSize={1024 * 1024 * 10}
      minSize={1024}
      onDrop={handleDrop}
      onError={console.error}
      className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 flex flex-col justify-center items-center text-neutral-400 transition-all hover:border-[#3a3a3a] hover:bg-[#1b1b1b] hover:shadow-[0_0_15px_#222222aa]"
    >
      <DropzoneEmptyState className="text-neutral-400" />
      <DropzoneContent />
      {uploading && (
        <p className="mt-2 text-xs text-neutral-500 animate-pulse">
          Uploading...
        </p>
      )}
    </Dropzone>
  );
}
