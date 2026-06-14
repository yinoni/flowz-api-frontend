"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";
import { ToastProvider, useToast } from "./ToastProvider";
import { loginSuccess } from "../store/userSlice";
import { safeJwtDecode } from "../utils/utils";
import { getUserProjects } from "../api/projectRoute";
import { setProjects } from "../store/projectsSlice";
import { getProjectFlows } from "../api/flowRoute";
import { setFlows } from "../store/flowsSlice";
import { refresh } from "../api/authAPI";
import LoadingScreen from "./LoadingScreen";

const AUTH_ROUTES = ["/login", "/verify-email"];

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);
  const verified = useSelector((state: RootState) => state.user.verified);
  const isFocusMode = useSelector((state: RootState) => state.ui.isFocusMode);
  const isAuthPage = AUTH_ROUTES.includes(pathname);
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const initData = async (jwt: string) => {
    const decoded: any | undefined = safeJwtDecode(jwt);
    if(!decoded)
      return;

    await dispatch(loginSuccess({
      user: { id: decoded.id, username: decoded.username, email: decoded.sub },
      token: jwt,
      verified: !!decoded.verified,
    }));

    if (!decoded.verified) {
      router.push(`/verify-email?email=${encodeURIComponent(decoded.sub)}`);
      return;
    }

    const usersProjectsResponse = await getUserProjects();

    if(usersProjectsResponse.success && usersProjectsResponse.data.length > 0){
      const firstProject = usersProjectsResponse.data[0];
      await dispatch(setProjects(usersProjectsResponse.data));
      const projectFlowsResponse = await getProjectFlows(firstProject.id);
      if(projectFlowsResponse.success){
        await dispatch(setFlows(projectFlowsResponse.data));
      }
    }
    router.push("/flows");
  }

  useEffect(() => {
    const checkIfAuthenticated = async () => {
      try{
        const refreshResponse = await refresh();

        if(refreshResponse.success){
          await initData(refreshResponse.data);
        }
      }
      catch{
        showToast("Session expired. Please log in again.", "error");
      }
      finally{
        setIsLoading(false);
      }
    }

    checkIfAuthenticated();
  }, []);

  useEffect(() => {
    if(isLoading)
      return;

    if (!isAuthenticated && !isAuthPage) {
      router.replace("/login");
    } else if (isAuthenticated && !verified && pathname !== "/verify-email") {
      router.replace("/verify-email");
    }
  }, [isAuthenticated, verified, isAuthPage, pathname, router, isLoading]);

  if (isLoading) {
    return <LoadingScreen />;
  }

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
        <div
          className={`overflow-hidden shrink-0 transition-[width,opacity] duration-200 ease-in-out ${
            isFocusMode ? "w-0 opacity-0" : "w-sidebar-width opacity-100"
          }`}
        >
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {children}
        </div>
      </div>
    </>
  );
}

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthWrapper>{children}</AuthWrapper>
    </ToastProvider>
  );
}
