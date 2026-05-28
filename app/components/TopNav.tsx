"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="bg-surface-container-highest flex justify-between items-center w-full px-lg h-16 border-b border-outline-variant shrink-0 z-30">
      <div className="flex items-center gap-xl">
        <span className="font-headline-lg text-headline-lg font-bold text-primary">FlowState</span>
        <button className="flex items-center gap-xs px-md py-1.5 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface-variant hover:text-primary hover:border-primary transition-all cursor-pointer">
          <span className="material-symbols-outlined text-sm text-outline">folder_open</span>
          <span className="font-body-md">Default Project</span>
          <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
        </button>
        <nav className="flex items-center gap-lg">
          <Link
            href="/flows"
            className={`font-headline-md text-headline-md transition-colors ${
              pathname === "/flows"
                ? "text-primary border-b-2 border-primary pb-1"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            My Flows
          </Link>
          <Link
            href="/history"
            className={`font-headline-md text-headline-md transition-colors ${
              pathname === "/history"
                ? "text-primary border-b-2 border-primary pb-1"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            History
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-md">
        <div className="flex items-center gap-sm">
          <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">share</span>
          </button>
          <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">cloud_done</span>
          </button>
        </div>
        <div className="h-8 w-px bg-outline-variant" />
        <button className="px-md py-xs bg-surface-variant text-on-surface-variant rounded hover:bg-surface-bright transition-colors font-body-md">
          Run
        </button>
        <button className="bg-primary-container text-on-primary-container px-md py-xs rounded font-bold hover:opacity-80 transition-opacity font-body-md">
          Save Flow
        </button>
      </div>
    </header>
  );
}
