"use client";

import { FileText, Loader2, CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface ProcessingStep {
  label: string;
  threshold: number;
  statusText: (active: boolean, completed: boolean) => string;
}

const steps: ProcessingStep[] = [
  {
    label: "Upload",
    threshold: 0,
    statusText: (active, completed) =>
      completed ? "Uploaded" : active ? "Uploading…" : "Waiting",
  },
  {
    label: "Extract Text",
    threshold: 5,
    statusText: (active, completed) =>
      completed ? "Extracted" : active ? "Extracting…" : "Waiting",
  },
  {
    label: "Embed & Index",
    threshold: 15,
    statusText: (active, completed) =>
      completed ? "Indexed" : active ? "Indexing pages…" : "Waiting",
  },
  {
    label: "Ready",
    threshold: 100,
    statusText: (_active, completed) =>
      completed ? "Complete!" : "Waiting",
  },
];

function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

function getStepState(
  stepIndex: number,
  progress: number,
): "completed" | "active" | "pending" {
  const current = steps[stepIndex];
  const next = steps[stepIndex + 1];
  if (next && progress >= next.threshold) return "completed";
  if (!next && progress >= current.threshold) return "completed";
  if (progress >= current.threshold) return "active";
  return "pending";
}

function StepIndicator({
  status,
}: {
  status: "completed" | "active" | "pending";
}) {
  if (status === "completed")
    return <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />;
  if (status === "active")
    return <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />;
  return <Circle className="h-5 w-5 text-muted-foreground/30 shrink-0" />;
}

export function ProcessingStage({
  filename,
  fileSize,
  progress,
  state,
  pageCount,
}: {
  filename: string;
  fileSize: number;
  progress: number;
  state: string;
  pageCount?: number | null;
}) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="flex items-center justify-center min-h-[calc(100svh-60px)] bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">

        {/* File info */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted border border-border">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-card-foreground">
              {filename}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(fileSize)}
              {pageCount ? ` · ${pageCount} pages detected` : ""}
            </p>
          </div>
          <Badge
            variant="secondary"
            className="shrink-0 uppercase tracking-wider text-[10px] font-bold"
          >
            PDF
          </Badge>
        </div>

        <Separator className="my-5" />

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Processing…</span>
            <span className="font-semibold text-foreground tabular-nums">
              {Math.round(clampedProgress)}%
            </span>
          </div>
          <div className="relative h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${clampedProgress}%` }}
            />
          </div>
        </div>

        {/* Processing steps */}
        <div className="mt-6 space-y-4">
          {steps.map((step, i) => {
            const status = getStepState(i, clampedProgress);
            const statusText = step.statusText(
              status === "active",
              status === "completed",
            );

            return (
              <div key={step.label} className="flex items-center gap-3">
                <StepIndicator status={status} />
                <span
                  className={`flex-1 text-sm font-medium ${
                    status === "pending"
                      ? "text-muted-foreground/40"
                      : "text-card-foreground"
                  }`}
                >
                  {step.label}
                </span>
                <span
                  className={`text-xs font-medium ${
                    status === "completed"
                      ? "text-emerald-500"
                      : status === "active"
                      ? "text-primary"
                      : "text-muted-foreground/30"
                  }`}
                >
                  {statusText}
                </span>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground/50">
          Large documents may take a minute. Please keep this tab open.
        </p>
      </div>
    </div>
  );
}
