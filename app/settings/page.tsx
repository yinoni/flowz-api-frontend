"use client";

import { useState } from "react";

interface ApiKey {
  id: string;
  name: string;
  maskedValue: string;
  createdDate: string;
}

interface EnvVar {
  id: string;
  key: string;
  value: string;
}

interface NotificationSettings {
  executionFailures: boolean;
  weeklyReports: boolean;
  systemStatus: boolean;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${
        checked ? "bg-primary" : "bg-outline-variant"
      }`}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
          checked ? "right-0.5" : "left-0.5"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [workspaceName, setWorkspaceName] = useState("Engineering Team");
  const [timeoutMs, setTimeoutMs] = useState(30000);

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    { id: "1", name: "Production Main", maskedValue: "fs_live_••••••••••••••••3a92", createdDate: "Oct 12, 2023" },
    { id: "2", name: "Staging Debug", maskedValue: "fs_test_••••••••••••••••f291", createdDate: "Jan 05, 2024" },
  ]);

  const [envVars, setEnvVars] = useState<EnvVar[]>([
    { id: "1", key: "base_url", value: "https://api.flowstate.io/v1" },
    { id: "2", key: "staging_key", value: "•••••••••••••••••••••" },
  ]);

  const [notifications, setNotifications] = useState<NotificationSettings>({
    executionFailures: true,
    weeklyReports: false,
    systemStatus: true,
  });

  function revokeKey(id: string) {
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
  }

  function deleteEnvVar(id: string) {
    setEnvVars((prev) => prev.filter((v) => v.id !== id));
  }

  function addEnvVar() {
    setEnvVars((prev) => [...prev, { id: Date.now().toString(), key: "", value: "" }]);
  }

  function generateKey() {
    setApiKeys((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: "New Key",
        maskedValue: `fs_live_••••••••••••••••${Math.random().toString(36).slice(2, 6)}`,
        createdDate: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      },
    ]);
  }

  return (
    <>
      {/* Content + Right Inspector */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-surface-container-lowest canvas-grid p-lg custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-xl pb-xl">
            <header>
              <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-xs">Settings</h1>
              <p className="text-on-surface-variant font-body-md">
                Manage your workspace configurations, API keys, and account preferences.
              </p>
            </header>

            {/* Workspace Profile */}
            <section className="bg-surface-container-low border border-outline-variant rounded-xl p-md">
              <div className="flex items-center gap-sm mb-md text-primary">
                <span className="material-symbols-outlined">corporate_fare</span>
                <h2 className="font-headline-md text-headline-md">Workspace Profile</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div className="space-y-xs">
                  <label className="font-label-caps text-label-caps text-on-surface-variant uppercase block">
                    Workspace Name
                  </label>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded px-md py-sm font-code-md text-code-md focus:border-primary outline-none transition-all"
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                  />
                </div>
                <div className="space-y-xs">
                  <label className="font-label-caps text-label-caps text-on-surface-variant uppercase block">
                    Default Timeout (ms)
                  </label>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded px-md py-sm font-code-md text-code-md focus:border-primary outline-none transition-all"
                    type="number"
                    value={timeoutMs}
                    onChange={(e) => setTimeoutMs(Number(e.target.value))}
                  />
                </div>
              </div>
            </section>

            {/* API Keys */}
            <section className="bg-surface-container-low border border-outline-variant rounded-xl p-md">
              <div className="flex justify-between items-center mb-md">
                <div className="flex items-center gap-sm text-primary">
                  <span className="material-symbols-outlined">vpn_key</span>
                  <h2 className="font-headline-md text-headline-md">API Keys &amp; Authentication</h2>
                </div>
                <button
                  onClick={generateKey}
                  className="bg-primary text-on-primary font-bold px-md py-sm rounded-lg font-body-md flex items-center gap-xs hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Generate New Key
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-on-surface-variant border-b border-outline-variant font-label-caps text-label-caps uppercase">
                      <th className="py-sm px-xs">Key Name</th>
                      <th className="py-sm px-xs">Value</th>
                      <th className="py-sm px-xs">Created Date</th>
                      <th className="py-sm px-xs text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-code-md text-code-md">
                    {apiKeys.map((key) => (
                      <tr key={key.id} className="border-b border-outline-variant/30 hover:bg-surface-variant/20 transition-colors last:border-0">
                        <td className="py-md px-xs">{key.name}</td>
                        <td className="py-md px-xs text-on-surface-variant">{key.maskedValue}</td>
                        <td className="py-md px-xs">{key.createdDate}</td>
                        <td className="py-md px-xs text-right">
                          <button onClick={() => revokeKey(key.id)} className="text-error hover:bg-error-container/20 px-sm py-1 rounded transition-colors">
                            Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Environment Variables */}
            <section className="bg-surface-container-low border border-outline-variant rounded-xl p-md">
              <div className="flex items-center gap-sm mb-md text-primary">
                <span className="material-symbols-outlined">abc</span>
                <h2 className="font-headline-md text-headline-md">Environment Variables</h2>
              </div>
              <div className="space-y-sm">
                {envVars.map((v) => (
                  <div key={v.id} className="grid grid-cols-12 gap-sm items-center">
                    <div className="col-span-4 bg-surface-container-lowest border border-outline-variant rounded px-md py-sm font-code-sm text-code-sm text-on-surface-variant truncate">
                      {v.key || <span className="opacity-40">key</span>}
                    </div>
                    <div className="col-span-7 bg-surface-container-lowest border border-outline-variant rounded px-md py-sm font-code-sm text-code-sm truncate">
                      {v.value || <span className="opacity-40">value</span>}
                    </div>
                    <button onClick={() => deleteEnvVar(v.id)} className="col-span-1 flex justify-center text-on-surface-variant hover:text-error transition-colors">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                ))}
                <button onClick={addEnvVar} className="text-secondary font-bold text-body-sm flex items-center gap-xs mt-md hover:underline">
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  Add Global Variable
                </button>
              </div>
            </section>

            {/* Notifications & Billing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              <section className="bg-surface-container-low border border-outline-variant rounded-xl p-md">
                <div className="flex items-center gap-sm mb-md text-primary">
                  <span className="material-symbols-outlined">notifications</span>
                  <h2 className="font-headline-md text-headline-md">Notifications</h2>
                </div>
                <div className="space-y-md">
                  {(
                    [
                      { key: "executionFailures", label: "Execution Failures" },
                      { key: "weeklyReports", label: "Weekly Reports" },
                      { key: "systemStatus", label: "System Status" },
                    ] as const
                  ).map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="font-body-md text-on-surface">{label}</span>
                      <Toggle
                        checked={notifications[key]}
                        onChange={(v) => setNotifications((n) => ({ ...n, [key]: v }))}
                      />
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-surface-container-low border border-outline-variant rounded-xl p-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-sm mb-md text-primary">
                    <span className="material-symbols-outlined">payments</span>
                    <h2 className="font-headline-md text-headline-md">Billing &amp; Plan</h2>
                  </div>
                  <div className="bg-surface-container-highest border border-primary/20 rounded-lg p-md mb-md">
                    <div className="font-label-caps text-label-caps text-primary uppercase mb-xs">Current Plan</div>
                    <div className="font-headline-lg text-headline-lg font-bold text-on-surface">Premium Tier</div>
                    <div className="text-on-surface-variant font-body-sm mt-1">$49/month • Next billing Feb 15, 2024</div>
                  </div>
                </div>
                <button className="w-full border border-primary text-primary font-bold px-md py-sm rounded-lg hover:bg-primary/10 transition-colors">
                  Manage Subscription
                </button>
              </section>
            </div>
          </div>
        </main>

        {/* Right Inspector */}
        <aside className="hidden lg:flex bg-surface-container-low flex-col h-full py-md px-sm border-l border-outline-variant w-inspector-width shrink-0">
          <div className="mb-lg">
            <div className="font-headline-md text-headline-md text-secondary">Step Palette</div>
            <div className="font-body-sm text-body-sm text-on-surface-variant">Quick Actions</div>
          </div>
          <div className="grid grid-cols-2 gap-sm">
            {(
              [
                { icon: "http", label: "Request" },
                { icon: "timer", label: "Wait" },
                { icon: "abc", label: "Variable" },
                { icon: "verified_user", label: "Assert" },
              ] as const
            ).map(({ icon, label }) => (
              <div key={label} className="p-md bg-surface-container-lowest border border-outline-variant rounded-lg flex flex-col items-center gap-xs cursor-grab hover:border-secondary transition-all">
                <span className="material-symbols-outlined text-secondary">{icon}</span>
                <span className="font-label-caps text-label-caps uppercase">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-auto bg-surface-container-highest/50 p-md rounded-lg border border-outline-variant/30">
            <p className="font-code-sm text-code-sm text-on-surface-variant">
              Settings changes are applied globally and affect all active flow deployments.
            </p>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="bg-surface-container-lowest flex justify-between items-center px-lg h-10 border-t border-outline-variant shrink-0">
        <div className="font-code-md text-code-md text-tertiary">
          FlowState Engine <span className="text-outline mx-sm">|</span>
          <span className="text-secondary-fixed-dim"> All Systems Operational</span>
        </div>
        <div className="flex items-center gap-lg">
          <div className="flex gap-md font-code-sm text-code-sm text-outline">
            <a className="hover:text-tertiary transition-colors" href="#">Terminal</a>
            <a className="hover:text-tertiary transition-colors" href="#">Environment</a>
            <a className="hover:text-tertiary font-bold transition-colors" href="#">Console</a>
          </div>
          <span className="font-code-sm text-code-sm text-outline">© 2024 FlowState Engine. All logs encrypted.</span>
        </div>
      </footer>
    </>
  );
}
