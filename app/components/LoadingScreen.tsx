"use client";

import Image from "next/image";

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = "Loading your workspace..." }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-background canvas-grid flex flex-col items-center justify-center gap-xl">
      <div className="flex flex-col items-center gap-lg">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-[0_0_32px_rgba(20,50,160,0.9)]">
          <Image
              src={require('../assets/logo.png')}
              alt="FlowZ"
              width={56}
              height={56}
              className="rounded-xl"
              priority
            />
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
