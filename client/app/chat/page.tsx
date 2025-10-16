"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PdfDropZone from "../_components/pdf-dropzone";
import { Send } from "lucide-react";
import Markdown from "markdown-to-jsx";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "👋 Upload a PDF and ask me anything about it.",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    const assistantPlaceholder = { role: "assistant", content: "Thinking..." };

    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setInput("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat?query=${encodeURIComponent(
          input
        )}`
      );
      const data = await response.json();

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: data?.answer || "No response received.",
        };
        return updated;
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        };
        return updated;
      });
    }
  };

  return (
    <div className="flex min-h-[calc(100svh-60px)] relative top-[60px] bg-[#0a0a0a] text-[#f8f5ee]">
      <aside className="w-[22rem] sticky top-[60px] h-[calc(100svh-60px)] border-r border-[#1f1f1f] bg-[#0d0d0d]/90 backdrop-blur-md p-5 flex flex-col justify-between overflow-y-auto">
        <div>
          <h2 className="text-lg font-semibold mb-4 text-[#f0f0f0]">
            Documents
          </h2>
          <div className="min-h-[60vh] flex justify-center items-center">
            <PdfDropZone />
          </div>
        </div>

        <p className="text-xs text-neutral-500 border-t border-[#1f1f1f] pt-4">
          💡 Tip: Upload multiple PDFs to build a custom knowledge base.
        </p>
      </aside>

      <main className="flex-1 flex flex-col bg-gradient-to-b from-[#0f0f0f] to-[#1a1a1a] relative">
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-5 scrollbar-thin scrollbar-thumb-[#2a2a2a] scrollbar-track-transparent">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${
                m.role === "assistant" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-md ${
                  m.role === "assistant"
                    ? "bg-[#161616] border border-[#2a2a2a] text-[#f0f0f0]"
                    : "bg-[#f8f5ee] text-black"
                }`}
              >
                <Markdown options={{ wrapper: "article" }}>
                  {m.content}
                </Markdown>
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSend}
          className="sticky bottom-0 left-0 w-full bg-[#0d0d0d]/90 border-t border-[#1f1f1f] px-5 py-4 flex items-center gap-3 backdrop-blur-sm"
        >
          <Input
            placeholder="Ask something about your PDFs..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 py-5 bg-[#1a1a1a] border-[#2a2a2a] text-[#f8f5ee] placeholder:text-neutral-500 focus-visible:ring-0 focus:border-[#3a3a3a]"
          />
          <Button
            type="submit"
            className="bg-[#f8f5ee] text-black hover:bg-[#e2dfd8] flex items-center gap-2 px-6 py-5 rounded-xl font-medium"
          >
            <Send size={16} />
            Send
          </Button>
        </form>
      </main>
    </div>
  );
}
