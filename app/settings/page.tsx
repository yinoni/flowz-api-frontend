"use client";

import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { logout } from "../store/userSlice";
import { logout as logoutAPI } from "../api/authAPI";
import type { RootState } from "../store/store";

export default function SettingsPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const currentUser = useSelector((state: RootState) => state.user.currentUser);

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

          {/* Profile */}
          <section className="bg-surface-container-low border border-outline-variant rounded-xl p-md">
            <div className="flex items-center gap-sm mb-md text-on-surface">
              <span className="material-symbols-outlined">account_circle</span>
              <h2 className="font-headline-md text-headline-md">Profile</h2>
            </div>
            <div className="space-y-md">
              {[
                { label: "Username", value: currentUser?.username, icon: "person" },
                { label: "Email", value: currentUser?.email, icon: "mail" },
              ].map(({ label, value, icon }) => (
                <div key={label}>
                  <label className="text-[10px] text-outline uppercase tracking-widest font-bold block mb-xs">
                    {label}
                  </label>
                  <div className="flex items-center gap-sm bg-surface-container border border-outline-variant rounded-lg px-md py-sm">
                    <span className="material-symbols-outlined text-sm text-outline">{icon}</span>
                    <span className="font-code-md text-code-md text-on-surface-variant flex-1">{value ?? "—"}</span>
                    <span className="material-symbols-outlined text-xs text-outline" title="Read only">lock</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

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
        <span className="font-code-sm text-code-sm text-outline">© 2026 FlowZ Engine.</span>
      </footer>
    </>
  );
}
