"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

const NAV_ITEMS = [
  { icon: "account_tree", label: "My Flows", href: "/flows" },
  { icon: "edit_square", label: "Flow Editor", href: "/" },
  { icon: "settings", label: "Settings", href: "/settings" },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-surface-container h-full w-sidebar-width flex flex-col py-md px-sm border-r border-outline-variant shrink-0">
      <div className="mb-lg px-md flex items-center gap-sm">
        <div className="w-1 h-1 rounded flex items-center justify-center">
          
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

    </aside>
  );
}
