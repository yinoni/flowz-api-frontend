"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { icon: "account_tree", label: "My Flows", href: "/flows" },
  { icon: "add_box", label: "New Flow", href: "/" },
  { icon: "history", label: "History", href: "/history" },
  { icon: "settings", label: "Settings", href: "/settings" },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-surface-container h-full w-sidebar-width flex flex-col py-md px-sm border-r border-outline-variant shrink-0">
      <div className="mb-lg px-md flex items-center gap-sm">
        <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
          <span
            className="material-symbols-outlined text-on-primary-container"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            account_tree
          </span>
        </div>
        <div>
          <h1 className="font-headline-md text-headline-md text-primary">Flow Architect</h1>
          <p className="text-on-surface-variant text-body-sm opacity-70">Premium Tier</p>
        </div>
      </div>

      <nav className="flex-1 space-y-xs">
        {NAV_ITEMS.map(({ icon, label, href }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-md px-md py-sm rounded-lg transition-all font-body-md ${
                active
                  ? "bg-primary-container text-on-primary-container font-bold scale-95"
                  : "text-on-surface-variant hover:bg-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined">{icon}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-xs">
        <button className="w-full bg-secondary-container text-on-secondary-container font-bold py-sm rounded-lg mb-md hover:opacity-90 transition-opacity">
          Upgrade Plan
        </button>
        <div className="border-t border-outline-variant pt-md space-y-xs">
          <a
            href="#"
            className="flex items-center gap-md px-md py-xs text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-sm">description</span>
            <span className="font-body-sm">Docs</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-md px-md py-xs text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-sm">help</span>
            <span className="font-body-sm">Support</span>
          </a>
        </div>
      </div>
    </aside>
  );
}
