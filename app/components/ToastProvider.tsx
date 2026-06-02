"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ToastType = "error" | "success" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const STYLES: Record<ToastType, { border: string; icon: string; iconColor: string; textColor: string }> = {
  error:   { border: "border-error",            icon: "error",        iconColor: "text-error",    textColor: "text-error" },
  success: { border: "border-secondary",        icon: "check_circle", iconColor: "text-secondary", textColor: "text-secondary" },
  info:    { border: "border-outline-variant",  icon: "info",         iconColor: "text-outline",   textColor: "text-on-surface-variant" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "error") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-sm pointer-events-none">
        {toasts.map((toast) => {
          const s = STYLES[toast.type];
          return (
            <div
              key={toast.id}
              className={`animate-toast-in pointer-events-auto flex items-start gap-sm px-md py-sm rounded-lg border bg-surface-container shadow-2xl min-w-[280px] max-w-[420px] ${s.border}`}
            >
              <span className={`material-symbols-outlined text-sm shrink-0 mt-0.5 ${s.iconColor}`}>
                {s.icon}
              </span>
              <span className={`font-body-sm text-body-sm flex-1 ${s.textColor}`}>
                {toast.message}
              </span>
              <button
                onClick={() => dismiss(toast.id)}
                className="text-outline hover:text-on-surface transition-colors shrink-0 ml-xs"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
