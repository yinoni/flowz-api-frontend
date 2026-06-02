"use client";

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = "Loading your workspace..." }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-background canvas-grid flex flex-col items-center justify-center gap-xl">
      <div className="flex flex-col items-center gap-lg">
        <div className="w-16 h-16 bg-primary-container rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
          <span
            className="material-symbols-outlined text-2xl text-on-background"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            account_tree
          </span>
        </div>
        <span className="font-headline-lg text-headline-lg text-primary">FlowZ</span>
      </div>
      <div className="flex items-center gap-sm text-on-surface-variant font-body-md">
        <span className="material-symbols-outlined text-primary animate-spin">refresh</span>
        <span>{message}</span>
      </div>
    </div>
  );
}
