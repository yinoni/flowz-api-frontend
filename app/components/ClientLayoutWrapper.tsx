"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";

const AUTH_ROUTES = ["/login"];

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);
  const isAuthPage = AUTH_ROUTES.includes(pathname);

  useEffect(() => {
    if (!isAuthenticated && !isAuthPage) {
      router.replace("/login");
    }
  }, [isAuthenticated, isAuthPage, router]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </>
  );
}
