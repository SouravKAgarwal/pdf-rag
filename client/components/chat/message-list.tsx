"use client";

import { useEffect, useRef, useState } from "react";
import Markdown from "markdown-to-jsx";
import { FileText, Bot, Check, Copy } from "lucide-react";
import { codeToHtml } from "shiki";
import { useTheme } from "next-themes";
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

/* ── Code Block Component ───────────────────────────────────────────────────── */

function CodeBlock({ children, ...props }: any) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [html, setHtml] = useState<string>("");
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const extractText = (node: any): string => {
    if (typeof node === "string") return node;
    if (Array.isArray(node)) return node.map(extractText).join("");
    if (node && node.props && node.props.children) {
      return extractText(node.props.children);
    }
    return "";
  };

  const textToCopy = extractText(children);

  let language = "text";
  if (children && children.props && children.props.className) {
    const match = children.props.className.match(/lang-(\w+)/);
    if (match) {
      language = match[1];
    }
  }

  useEffect(() => {
    let isMounted = true;
    async function highlight() {
      try {
        const result = await codeToHtml(textToCopy, {
          lang: language === "text" ? "text" : language,
          theme: resolvedTheme === "dark" ? "github-dark" : "github-light",
        });
        if (isMounted) setHtml(result);
      } catch (e) {
        if (isMounted)
          setHtml(
            `<pre class="shiki p-4 text-[13px] leading-relaxed overflow-x-auto"><code>${textToCopy}</code></pre>`,
          );
      }
    }
    highlight();
    return () => {
      isMounted = false;
    };
  }, [textToCopy, language, resolvedTheme]);

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative my-4 flex flex-col overflow-hidden rounded-lg border border-border/50 bg-background">
      <div className="flex items-center justify-between bg-background/50 px-3 py-1.5 text-xs text-muted-foreground border-b border-border">
        <span className="font-mono">
          {language === "text" ? "shell" : language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors hover:bg-foreground/10 hover:text-foreground"
          aria-label="Copy code"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
      </div>
      {html ? (
        <div
          className="[&>pre]:!m-0 [&>pre]:!bg-transparent [&>pre]:p-4 [&>pre]:font-medium [&>pre]:text-[15.5px] [&>pre]:leading-relaxed [&>pre]:overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre
          className="!m-0 overflow-x-auto p-4 text-[13px] leading-relaxed !bg-transparent !border-0"
          {...props}
        >
          {children}
        </pre>
      )}
    </div>
  );
}

/* ── Component ──────────────────────────────────────────────────────────────── */

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
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:whitespace-pre-wrap prose-li:whitespace-pre-wrap prose-code:before:content-none prose-code:after:content-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 text-foreground wrap-break-word [&_code:not(pre_code)]:bg-background/50 [&_code:not(pre_code)]:px-1.5 [&_code:not(pre_code)]:py-1.5 [&_code:not(pre_code)]:rounded-md [&_code:not(pre_code)]:font-mono [&_code:not(pre_code)]:text-xs [&_code:not(pre_code)]:font-semibold [&_code:not(pre_code)]:text-foreground/90">
                      {message.content ? (
                        <Markdown
                          options={{
                            overrides: {
                              pre: {
                                component: CodeBlock,
                              },
                            },
                          }}
                        >
                          {message.content}
                        </Markdown>
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
