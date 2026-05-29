"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../store/userSlice";
import type { AuthenticationRequest, SignUpRequest } from "../store/userSlice";
import { InputField, PasswordField } from "../components/InputField";
import { login, signup } from "../api/authAPI";
import { safeJwtDecode } from "../utils/utils";
import { AuthErrorResponse, AuthResponse } from "../types";
import { getUserProjects } from "../api/projectRoute";
import { setProjects } from "../store/projectsSlice";
import { getProjectFlows } from "../api/flowRoute";
import { setFlows } from "../store/flowsSlice";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState<AuthenticationRequest & Pick<SignUpRequest, "username">>({
    email: "",
    password: "",
    username: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validateForm(): { success: boolean; msg: string } {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (isSignUp && form.username.trim().length <= 3)
      return { success: false, msg: "Username must be more than 3 characters." };

    if (!emailRegex.test(form.email))
      return { success: false, msg: "Please enter a valid email address." };

    if (!passwordRegex.test(form.password))
      return { success: false, msg: "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character." };

    return { success: true, msg: "" };
  }

  async function postAuth(apiResponse: AuthResponse | AuthErrorResponse){
    setIsLoading(true);

    if (apiResponse.success) {      
      await initData(apiResponse.data);
    } else {
      setError(apiResponse.msg);
    }
    setIsLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validation = validateForm();
    if (!validation.success) {
      setError(validation.msg);
      return;
    }

    let apiResponse;

    if (isSignUp) {
      apiResponse = await signup(form);
    } else {
      apiResponse = await login(form.email, form.password);
    }

    await postAuth(apiResponse);
  }

  const initData = async (jwt: string) => {
    const decoded: any | undefined = safeJwtDecode(jwt);
    if(!decoded)
      return;

    await dispatch(loginSuccess({
      user: {
        id: decoded.id,
        username: decoded.username,
        email: decoded.sub
      },
      token: jwt
    }));

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

  return (
    <div className="min-h-screen bg-background canvas-grid flex items-center justify-center p-xl">
      <div className="w-full max-w-[440px]">

        {/* Brand header */}
        <div className="text-center mb-12">
          <div className="w-14 h-14 bg-primary-container rounded-xl flex items-center justify-center mx-auto mb-lg shadow-lg shadow-primary/20">
            <span
              className="material-symbols-outlined text-xl text-on-background"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              account_tree
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-sm">
            Welcome back, Architect
          </h1>
          <p className="text-on-surface-variant font-body-md">
            {isSignUp
              ? "Provision your FlowState account"
              : "Authenticate to your FlowState workspace"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-container border border-outline-variant rounded-xl shadow-2xl overflow-hidden">
          <div className="px-xl pt-xl pb-lg">
            <form onSubmit={handleSubmit}>

              {/* Username — sign up only */}
              {isSignUp && (
                <div className="mb-lg">
                  <InputField
                    label="Username"
                    icon="person"
                    value={form.username}
                    onChange={(v) => handleChange("username", v)}
                    placeholder="your_handle"
                    required={isSignUp}
                  />
                </div>
              )}

              {/* Email */}
              <div className="mb-lg">
                <InputField
                  label="Email"
                  icon="alternate_email"
                  type="email"
                  value={form.email}
                  onChange={(v) => handleChange("email", v)}
                  placeholder="example@example.com"
                  required
                />
              </div>

              {/* Password */}
              <div className="mb-lg">
                <PasswordField
                  value={form.password}
                  onChange={(v) => handleChange("password", v)}
                  required
                  labelAction={
                    !isSignUp ? (
                      <button
                        type="button"
                        className="text-primary font-body-sm text-body-sm hover:underline"
                      >
                        Forgot?
                      </button>
                    ) : undefined
                  }
                />
              </div>

              {/* Error banner */}
              {error && (
                <div className="flex items-start gap-sm bg-error-container/20 border border-error-container rounded-lg px-md py-sm mt-lg">
                  <span className="material-symbols-outlined text-error text-sm shrink-0 mt-0.5">error</span>
                  <p className="text-error font-body-sm text-body-sm">{error}</p>
                </div>
              )}

              {/* Generous spacing before the CTA */}
              <div className="mt-10">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary-container text-on-background font-bold py-md rounded-lg hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-sm font-body-md disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="material-symbols-outlined text-xs animate-spin">refresh</span>
                  ) : (
                    <span className="material-symbols-outlined text-xs">
                      {isSignUp ? "person_add" : "login"}
                    </span>
                  )}
                  {isLoading ? "Authenticating..." : isSignUp ? "Sign up" : "Login"}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-md my-xl">
              <div className="flex-1 h-px bg-outline-variant" />
              <span className="text-outline font-body-sm text-body-sm">or</span>
              <div className="flex-1 h-px bg-outline-variant" />
            </div>

            {/* Google */}
            <button
              type="button"
              className="w-full bg-surface-container-high border border-outline-variant rounded-lg py-sm flex items-center justify-center gap-md hover:border-outline hover:bg-surface-variant transition-all font-body-md text-on-surface-variant hover:text-on-surface"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.705 17.64 9.2z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Footer toggle */}
          <div className="bg-surface-container-low border-t border-outline-variant px-xl py-lg text-center">
            <span className="text-on-surface-variant font-body-sm text-body-sm">
              {isSignUp ? "Already have an account? " : "New to FlowState? "}
            </span>
            <button
              type="button"
              onClick={() => { setIsSignUp((v) => !v); setError(""); }}
              className="text-primary font-bold font-body-sm text-body-sm hover:underline"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-outline font-code-sm text-code-sm mt-lg">
          © 2024 FlowState Engine · All transmissions encrypted
        </p>
      </div>
    </div>
  );
}
