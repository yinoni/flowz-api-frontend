"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";

const AUTH_ROUTES = ["/login", "/verify-email"];

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);
  const verified = useSelector((state: RootState) => state.user.verified);
  const isAuthPage = AUTH_ROUTES.includes(pathname);

  useEffect(() => {
    if (!isAuthenticated && !isAuthPage) {
      router.replace("/login");
    } else if (isAuthenticated && !verified && pathname !== "/verify-email") {
      router.replace("/verify-email");
    }
  }, [isAuthenticated, verified, isAuthPage, pathname, router]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (!isAuthenticated || !verified) {
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
