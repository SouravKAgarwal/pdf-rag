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
    <div className="w-full pb-4">
      <div className="mx-auto w-full max-w-210">
        <div
          className={[
            "rounded-[28px] transition-all duration-200 border shadow-lg",
            "p-2 flex items-end gap-2",
            disabled
              ? "border-border/50 bg-muted/30 cursor-not-allowed"
              : "border-border/40 bg-sidebar/60 backdrop-blur-md focus-within:bg-sidebar focus-within:ring-1 focus-within:ring-border hover:bg-sidebar/80",
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
            className="flex-1 resize-none border-none bg-transparent px-3 py-2 text-[15px] text-foreground outline-none placeholder:text-muted-foreground/60 max-h-24 overflow-y-auto leading-relaxed no-scrollbar"
          />

          <Button
            size="icon"
            disabled={!canSend}
            onClick={onSend}
            className={[
              "h-10 w-10 rounded-full shrink-0 mb-0.5 mr-0.5 transition-transform active:scale-95",
              canSend
                ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            ].join(" ")}
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4 ml-0.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
