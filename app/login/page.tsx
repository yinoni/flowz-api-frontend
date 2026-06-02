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
    // 1. מחלצים את ה-ID Token שגוגל החזירה
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
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              //useOneTap // אופציונלי: מקפיץ חלונית קטנה בצד המסך ללוגין מהיר בלחיצה אחת
              theme="filled_blue"
              shape="pill"
            />
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
