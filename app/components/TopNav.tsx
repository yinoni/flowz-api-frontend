"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProjectDropdown } from "./ProjectDropdown";

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="bg-surface-container-highest flex justify-between items-center w-full px-lg h-16 border-b border-outline-variant shrink-0 z-30">
      <div className="flex items-center gap-xl">
        <span className="font-headline-lg text-headline-lg font-bold text-primary">FlowZ</span>
        <ProjectDropdown />
      </div>
    </header>
  );
}
