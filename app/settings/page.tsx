"use client";

import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { logout } from "../store/userSlice";
import { logout as logoutAPI } from "../api/authAPI";

export default function SettingsPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  async function handleLogout() {
    const logoutResponse = await logoutAPI();
    if (logoutResponse.success) {
      dispatch(logout());
      router.push("/login");
    }
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto bg-surface-container-lowest canvas-grid p-lg custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-xl pb-xl">
          <header>
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-xs">Settings</h1>
            <p className="text-on-surface-variant font-body-md">
              Manage your account preferences.
            </p>
          </header>

          {/* Danger Zone */}
          <section className="bg-surface-container-low border border-error/40 rounded-xl p-md">
            <div className="flex items-center gap-sm mb-md text-error">
              <span className="material-symbols-outlined">warning</span>
              <h2 className="font-headline-md text-headline-md">Danger Zone</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body-md text-on-surface">Sign out of your account</p>
                <p className="font-body-sm text-on-surface-variant mt-1">
                  You will be redirected to the login page.
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-xs bg-error-container text-on-error-container font-bold px-md py-sm rounded-lg hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                Log Out
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-surface-container-lowest flex justify-between items-center px-lg h-10 border-t border-outline-variant shrink-0">
        <span className="font-code-md text-code-md text-tertiary">FlowZ Engine</span>
        <span className="font-code-sm text-code-sm text-outline">© 2024 FlowZ Engine.</span>
      </footer>
    </>
  );
}
