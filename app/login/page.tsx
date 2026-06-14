"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../store/userSlice";
import type { AuthenticationRequest, SignUpRequest } from "../store/userSlice";
import { InputField, PasswordField } from "../components/InputField";
import { googleLogin as googleLoginEndpoint, login, signup } from "../api/authAPI";
import { safeJwtDecode } from "../utils/utils";
import { AuthErrorResponse, AuthResponse } from "../types";
import { getUserProjects } from "../api/projectRoute";
import { setProjects } from "../store/projectsSlice";
import { getProjectFlows } from "../api/flowRoute";
import { setFlows } from "../store/flowsSlice";
import { GoogleLogin } from "@react-oauth/google";
import Image from "next/image";

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

    if (isSignUp) {
      const apiResponse = await signup(form);
      await postAuth(apiResponse);
      return;
    }

    const apiResponse = await login(form.email, form.password);
    await postAuth(apiResponse);
  }

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

  const handleGoogleSuccess = async (credentialResponse: any) => {
    const idToken = credentialResponse.credential;

    if (!idToken) {
      console.error("Google authentication failed: No token returned");
      return;
    }

    const apiResponse = await googleLoginEndpoint(idToken);
    postAuth(apiResponse);
  }

  const handleGoogleError = async () => {
    console.error('Google Login Failed');
  }

  return (
    <div className="min-h-screen bg-background canvas-grid flex items-center justify-center p-xl">
      <div className="w-full max-w-[440px]">

        {/* Brand header */}
        <div className="text-center mb-12">
          <div>
          <Image
            src={require('../assets/logo.png')}
            alt="FlowZ"
            width={56}
            height={56}
            className="rounded-xl mx-auto mb-lg shadow-[0_0_32px_rgba(20,50,160,0.9)]"
            priority
          />
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-sm">
            Welcome back, Architect
          </h1>
          <p className="text-on-surface-variant font-body-md">
            {isSignUp
              ? "Provision your FlowZ account"
              : "Authenticate to your FlowZ workspace"}
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

            {/* Google — real button is invisible but interactive; overlay is visual only */}
            <div className="relative w-full group cursor-pointer">
              <div className="opacity-0">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  width="400"
                />
              </div>
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center gap-sm rounded-lg border border-outline-variant bg-surface-container-high group-hover:bg-surface-container group-hover:border-primary/40 text-on-surface font-bold font-body-md transition-all">
                <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </div>
            </div>
          </div>

          {/* Footer toggle */}
          <div className="bg-surface-container-low border-t border-outline-variant px-xl py-lg text-center">
            <span className="text-on-surface-variant font-body-sm text-body-sm">
              {isSignUp ? "Already have an account? " : "New to FlowZ? "}
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
          © 2024 FlowZ Engine · All transmissions encrypted
        </p>
      </div>
    </div>
  );
}
