"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { FileText, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
interface ChatHeaderProps {
  documentName?: string;
  pageCount?: number;
  status?: "processing" | "ready" | "error";
}

export function ChatHeader({
  documentName,
  pageCount,
}: ChatHeaderProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />

        {/* Document Info */}
        <div className="flex flex-1 items-center gap-2.5 min-w-0">
          <h1 className="text-[15px] font-semibold text-foreground truncate">
            {documentName ?? ""}
          </h1>
        </div>

        {/* Theme Toggle & Page Count */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {pageCount && (
            <span className="text-sm text-muted-foreground hidden sm:block mr-2">
              {pageCount} pages
            </span>
          )}
          
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
