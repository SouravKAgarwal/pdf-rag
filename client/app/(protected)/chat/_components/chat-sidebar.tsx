"use client";

import * as React from "react";
import {
  FileText,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import Image from "next/image";
// import { NavUser } from "@/components/nav-user";

export interface DocumentInfo {
  id: string;
  name: string;
  size: number;
  mimetype: string;
  jobId: string;
  status: "processing" | "ready" | "error";
  pageCount?: number;
  errorMessage?: string;
  uploadedAt: Date;
}

interface ChatSidebarProps extends React.ComponentProps<typeof Sidebar> {
  documents: DocumentInfo[];
  activeDocumentId: string | null;
  onDocumentSelect: (id: string) => void;
  onAddMore: () => void;
  onRemove: (id: string) => void;
}

export function ChatSidebar({
  documents,
  activeDocumentId,
  onDocumentSelect,
  onAddMore,
  onRemove,
  ...props
}: ChatSidebarProps) {
  const { isMobile } = useSidebar();
  const { user } = useUser();

  const userStub = user
    ? {
        name: user.fullName || user.username || "User",
        email: user.primaryEmailAddress?.emailAddress || "",
        avatar: user.imageUrl,
      }
    : { name: "User", email: "", avatar: "" };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/" className="flex items-center gap-2">
                <Image src="/logo.svg" alt="PDF AI" width={24} height={24} />
                <span className="font-semibold text-sm tracking-tight text-foreground">
                  PDF.ai
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span>Documents</span>
            <button
              onClick={onAddMore}
              className="ml-auto rounded-md p-1 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              title="Upload new PDF"
            >
              <Plus className="h-4 w-4" />
            </button>
          </SidebarGroupLabel>
          <SidebarMenu>
            {documents.length === 0 ? (
              <SidebarMenuItem>
                <div className="px-3 py-2 text-xs text-muted-foreground/60 text-center">
                  No documents yet.
                </div>
              </SidebarMenuItem>
            ) : (
              documents.map((doc) => {
                const isActive = doc.id === activeDocumentId;
                const isClickable = doc.status !== "error";

                return (
                  <SidebarMenuItem key={doc.id}>
                    <SidebarMenuButton
                      onClick={() => isClickable && onDocumentSelect(doc.id)}
                      isActive={isActive}
                      className={
                        !isClickable ? "opacity-60 cursor-not-allowed" : ""
                      }
                    >
                      {doc.status === "processing" ? (
                        <Loader2 className="animate-spin text-sidebar-foreground/50" />
                      ) : doc.status === "error" ? (
                        <AlertCircle className="text-destructive" />
                      ) : (
                        <FileText />
                      )}
                      <span>{doc.name}</span>
                    </SidebarMenuButton>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuAction showOnHover>
                          <MoreHorizontal />
                          <span className="sr-only">More</span>
                        </SidebarMenuAction>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-48 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align={isMobile ? "end" : "start"}
                      >
                        <div className="px-2 py-1.5 text-xs text-muted-foreground border-b border-border/50 mb-1">
                          {doc.pageCount
                            ? `${doc.pageCount} pages`
                            : "Processing"}
                        </div>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(doc.id);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete Document</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                );
              })
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>{/* <NavUser user={userStub} /> */}</SidebarFooter>
    </Sidebar>
  );
}
