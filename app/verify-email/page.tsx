"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { resendCode, validateCode } from "../api/authAPI";
import { loginSuccess } from "../store/userSlice";
import { safeJwtDecode } from "../utils/utils";
import { getUserProjects } from "../api/projectRoute";
import { setProjects } from "../store/projectsSlice";
import { getProjectFlows } from "../api/flowRoute";
import { setFlows } from "../store/flowsSlice";

const CODE_LENGTH = 4;
const TIMER_SECONDS = 120;

function VerifyEmailContent() {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const canResend = timeLeft === 0;
  const isComplete = code.every((d) => d !== "");

  useEffect(() => {
    if (timeLeft === 0) return;
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");

  function handleInput(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    setError("");
    if (digit && index < CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (code[index]) {
        const next = [...code];
        next[index] = "";
        setCode(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!digits) return;
    const next = Array(CODE_LENGTH).fill("");
    digits.split("").forEach((d, i) => { next[i] = d; });
    setCode(next);
    setError("");
    inputRefs.current[Math.min(digits.length, CODE_LENGTH - 1)]?.focus();
  }

  async function handleResend() {
    setTimeLeft(TIMER_SECONDS);
    setCode(Array(CODE_LENGTH).fill(""));
    setError("");
    inputRefs.current[0]?.focus();
    const apiResponse = await resendCode();
    if (!apiResponse.success) {
      setError(apiResponse.message ?? "Failed to resend code. Please try again.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isComplete) {
      setError("Please enter the complete 4-digit code.");
      return;
    }
    setIsSubmitting(true);
    const apiResponse = await validateCode(code.join(""));

    if (apiResponse.success) {
      const jwt: string = apiResponse.data;
      const decoded: any = safeJwtDecode(jwt);
      if (!decoded) return;

      await dispatch(loginSuccess({
        user: { id: decoded.id, username: decoded.username, email: decoded.sub },
        token: jwt,
        verified: true,
      }));

      const projectsResponse = await getUserProjects();
      if (projectsResponse.success && projectsResponse.data.length > 0) {
        const firstProject = projectsResponse.data[0];
        await dispatch(setProjects(projectsResponse.data));
        const flowsResponse = await getProjectFlows(firstProject.id);
        if (flowsResponse.success) await dispatch(setFlows(flowsResponse.data));
      }

      router.push("/flows");
    } else {
      setError(apiResponse.message ?? "Invalid verification code. Please try again.");
      setIsSubmitting(false);
    }
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
              mark_email_unread
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-sm">
            Verify your email
          </h1>
          <p className="text-on-surface-variant font-body-md">
            We sent a 4-digit code to{" "}
            {email
              ? <span className="text-primary font-bold">{email}</span>
              : "your email address"
            }.
            <br />Enter it below to activate your account.
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-container border border-outline-variant rounded-xl shadow-2xl overflow-hidden">
          <div className="px-xl pt-xl pb-lg">
            <form onSubmit={handleSubmit}>

              {/* Code inputs */}
              <div className="flex justify-center gap-md mb-xl" onPaste={handlePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInput(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onFocus={(e) => e.target.select()}
                    className={`w-14 h-14 text-center font-code-md text-2xl text-on-surface bg-surface-container-high border-2 rounded-xl outline-none transition-all ${
                      error
                        ? "border-error"
                        : digit
                        ? "border-primary"
                        : "border-outline-variant focus:border-primary"
                    }`}
                  />
                ))}
              </div>

              {/* Error banner */}
              {error && (
                <div className="flex items-start gap-sm bg-error-container/20 border border-error-container rounded-lg px-md py-sm mb-lg">
                  <span className="material-symbols-outlined text-error text-sm shrink-0 mt-0.5">error</span>
                  <p className="text-error font-body-sm text-body-sm">{error}</p>
                </div>
              )}

              {/* Timer + Resend */}
              <div className="flex items-center justify-between mb-xl px-xs">
                <div className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-outline text-sm">timer</span>
                  <span className={`font-code-sm text-code-sm ${timeLeft <= 30 && timeLeft > 0 ? "text-error" : "text-outline"}`}>
                    {timeLeft > 0 ? `${minutes}:${seconds}` : "Code expired"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={!canResend}
                  className="font-body-sm text-body-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-primary hover:underline"
                >
                  Resend code
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || !isComplete}
                className="w-full bg-primary-container text-on-background font-bold py-md rounded-lg hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-sm font-body-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="material-symbols-outlined text-xs animate-spin">refresh</span>
                ) : (
                  <span className="material-symbols-outlined text-xs">verified_user</span>
                )}
                {isSubmitting ? "Verifying..." : "Verify Email"}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="bg-surface-container-low border-t border-outline-variant px-xl py-lg text-center">
            <span className="text-on-surface-variant font-body-sm text-body-sm">
              Wrong email?{" "}
            </span>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-primary font-bold font-body-sm text-body-sm hover:underline"
            >
              Go back to sign up
            </button>
          </div>
        </div>

        <p className="text-center text-outline font-code-sm text-code-sm mt-lg">
          © 2024 FlowZ Engine · All transmissions encrypted
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
