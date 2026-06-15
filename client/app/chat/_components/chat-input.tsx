"use client";

import { useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  documentName?: string;
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  isStreaming,
  disabled = false,
  documentName,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [value]);

  const canSend = value.trim().length > 0 && !isStreaming && !disabled;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSend();
    }
  };

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-3xl pt-0.5">

        <div
          className={[
            "rounded-xl border transition-all duration-200",
            "p-2 pb-0.5",
            disabled
              ? "border-border bg-muted/30"
              : "border-border bg-background focus-within:ring-1 focus-within:ring-ring shadow-sm",
          ].join(" ")}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              disabled
                ? "Waiting for document to be ready…"
                : documentName
                ? `Ask about "${documentName}"…`
                : "Ask about your document…"
            }
            disabled={disabled}
            rows={1}
            className="w-full resize-none border-none bg-transparent pr-12 text-[14px] text-foreground outline-none placeholder:text-muted-foreground/50 max-h-25 overflow-y-auto leading-relaxed no-scrollbar"
          />

          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground/40 select-none">
              ↵ Enter to send · Shift+↵ for new line
            </span>
            <Button
              size="icon"
              disabled={!canSend}
              onClick={onSend}
              className={[
                "h-8 w-8 rounded-lg",
                canSend
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                  : "bg-muted text-muted-foreground cursor-not-allowed",
              ].join(" ")}
            >
              {isStreaming ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mt-2 text-center text-[10px] text-muted-foreground/40 select-none">
          Responses are based solely on your uploaded document content.
        </p>
      </div>
    </div>
  );
}
