"use client";

import { useEffect, useRef } from "react";
import Markdown from "markdown-to-jsx";
import { FileText, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DocumentInfo } from "./chat-sidebar";

/* ── Public interfaces ──────────────────────────────────────────────────────── */

export interface Source {
  filename: string;
  source: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  streaming?: boolean;
}

/* ── Typing dots indicator ──────────────────────────────────────────────────── */

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.75 ml-0.5 translate-y-px">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.25 h-1.25 rounded-full bg-muted-foreground/60 inline-block animate-pulse"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </span>
  );
}

/* ── Props ──────────────────────────────────────────────────────────────────── */

interface MessageListProps {
  messages: Message[];
  activeDocument?: DocumentInfo;
}

/* ── Component ──────────────────────────────────────────────────────────────── */

function linkify(text: string) {
  if (!text) return text;
  const urlRegex = /https?:\/\/[^\s<]+/g;
  return text.replace(urlRegex, (url, offset, string) => {
    const before = string.slice(Math.max(0, offset - 2), offset);
    if (before === "](" || before === '="') {
      return url;
    }
    let cleanUrl = url;
    let trailing = "";
    if (/[.,;:]$/.test(cleanUrl)) {
      trailing = cleanUrl.slice(-1);
      cleanUrl = cleanUrl.slice(0, -1);
    }
    return `[${cleanUrl}](${cleanUrl})${trailing}`;
  });
}

export function MessageList({ messages, activeDocument }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Empty state ──────────────────────────────────────────────────────────── */
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 select-none px-4">
        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border border-border">
          <Bot size={24} className="text-muted-foreground" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-foreground">
            {activeDocument?.name
              ? `"${activeDocument.name}"`
              : "Select a document"}
          </p>
          <p className="text-xs text-muted-foreground">
            {activeDocument?.status === "ready"
              ? "Ask a question about this document"
              : activeDocument?.status === "processing"
                ? "Document is being indexed…"
                : "Upload a PDF to get started"}
          </p>
        </div>
      </div>
    );
  }

  /* ── Message list ─────────────────────────────────────────────────────────── */
  return (
    <div className="flex-1 overflow-y-auto w-full mx-auto scrollbar-none px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-5">
        {messages.map((message) => {
          const isUser = message.role === "user";

          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] ${isUser ? "" : "flex-1"}`}>
                {isUser ? (
                  /* ── User message ─────────────────────────────────────────── */
                  <div className="rounded-lg px-4 py-2.5 bg-foreground text-background">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                ) : (
                  /* ── AI message ───────────────────────────────────────────── */
                  <div className="rounded-lg px-4 py-2.5 bg-muted">
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:whitespace-pre-wrap prose-li:whitespace-pre-wrap prose-pre:p-0 prose-code:before:content-none prose-code:after:content-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 text-foreground wrap-break-word">
                      {message.content ? (
                        <Markdown>{linkify(message.content)}</Markdown>
                      ) : null}
                    </div>

                    {message.streaming && !message.content && (
                      <div className="flex items-center gap-2 py-0.5">
                        <TypingDots />
                        <span className="text-xs text-muted-foreground">
                          Thinking…
                        </span>
                      </div>
                    )}

                    {!message.streaming &&
                      message.sources &&
                      message.sources.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/50">
                          {[
                            ...new Set(message.sources.map((s) => s.filename)),
                          ].map((filename, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="inline-flex items-center gap-1.5 text-[10px] font-normal"
                              title={filename}
                            >
                              <FileText size={10} className="shrink-0" />
                              <span className="truncate max-w-50">
                                {filename}
                              </span>
                            </Badge>
                          ))}
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
