import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  Lock,
  User,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = "login",
}: AuthModalProps) {
  const { login, register, verifyEmail, googleLogin } = useAuth();

  const [mode, setMode] = useState<"login" | "signup" | "verify">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [devToken, setDevToken] = useState<string | null>(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
  const googleConfigured = Boolean(
    googleClientId && !String(googleClientId).startsWith("mock"),
  );

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage("");
      setSuccessMessage("");
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await register({ name, email, password });
      if (res.success) {
        setSuccessMessage(
          res.message ||
            "Account registered! Check email for verification code.",
        );
        if (res.verificationToken) {
          setDevToken(res.verificationToken);
        }
        setMode("verify");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await login({ email, password });
      if (res.success) {
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          "Invalid credentials. Please check your email & password.",
      );
      if (err.message?.toLowerCase().includes("verify")) {
        setMode("verify");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await verifyEmail(verificationToken || devToken || "");
      if (res.success) {
        setSuccessMessage("Email verified! Redirecting...");
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: {
    credential?: string;
  }) => {
    if (!credentialResponse.credential) {
      setErrorMessage("Google did not return a credential. Please try again.");
      return;
    }
    setLoading(true);
    setErrorMessage("");
    try {
      await googleLogin(credentialResponse.credential);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Google OAuth sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-[#FAF7F2] rounded-3xl shadow-2xl overflow-hidden z-10 border border-[#EDE5D5] animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-[#8C7A6B] hover:text-[#4A2925] hover:bg-[#EDE5D5]/50 rounded-full transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="pt-8 px-8 pb-4 text-center bg-[#F7F2EA] border-b border-[#EDE5D5]">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#4A2925] text-[#F7F2EA] rounded-full mb-3 shadow-md">
            <ShieldCheck className="w-6 h-6 stroke-[1.75]" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-[#4A2925]">
            {mode === "login"
              ? "Welcome Back"
              : mode === "signup"
                ? "Join Khushi's Zone"
                : "Verify Email Address"}
          </h3>
          <p className="text-xs text-[#8C7A6B] mt-1 font-medium">
            {mode === "login"
              ? "Sign in to access your orders, wishlist & rewards"
              : mode === "signup"
                ? "Create your account to start shopping happiness"
                : "Enter the verification token sent to your email"}
          </p>

          {mode !== "verify" && (
            <div className="flex bg-[#EDE5D5]/80 p-1 rounded-full mt-5 border border-[#D9CEB9]">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMessage("");
                }}
                className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-200 ${
                  mode === "login"
                    ? "bg-[#4A2925] text-white shadow-sm"
                    : "text-[#6E493F] hover:text-[#4A2925]"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setErrorMessage("");
                }}
                className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-200 ${
                  mode === "signup"
                    ? "bg-[#4A2925] text-white shadow-sm"
                    : "text-[#6E493F] hover:text-[#4A2925]"
                }`}
              >
                Create Account
              </button>
            </div>
          )}
        </div>

        <div className="p-8">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-xl flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {mode !== "verify" && (
            <div className="mb-6">
              {googleConfigured ? (
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() =>
                      setErrorMessage("Google Sign-In was cancelled or failed.")
                    }
                    theme="outline"
                    size="large"
                    shape="pill"
                    text="continue_with"
                    width="320"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  className="w-full py-2.5 px-4 bg-white border border-[#D9CEB9] text-[#8C7A6B] font-semibold text-xs rounded-full cursor-not-allowed"
                  onClick={() => {}}
                >
                  Continue with Google
                </button>
              )}

              <div className="relative my-5 text-center">
                <hr className="border-[#EDE5D5]" />
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FAF7F2] px-3 text-[10px] uppercase font-bold tracking-widest text-[#8C7A6B]">
                  Or with email
                </span>
              </div>
            </div>
          )}

          {mode === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#4A2925] tracking-wider uppercase mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#8C7A6B]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EDE5D5] focus:border-[#4A2925] rounded-xl text-xs text-[#4A2925] placeholder-[#8C7A6B] focus:ring-1 focus:ring-[#4A2925] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4A2925] tracking-wider uppercase mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#8C7A6B]" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EDE5D5] focus:border-[#4A2925] rounded-xl text-xs text-[#4A2925] placeholder-[#8C7A6B] focus:ring-1 focus:ring-[#4A2925] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#4A2925] text-white rounded-full text-xs font-bold tracking-widest uppercase hover:bg-[#3D211E] transition-all shadow-md mt-2 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {mode === "signup" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#4A2925] tracking-wider uppercase mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-[#8C7A6B]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Khushi Sharma"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EDE5D5] focus:border-[#4A2925] rounded-xl text-xs text-[#4A2925] placeholder-[#8C7A6B] focus:ring-1 focus:ring-[#4A2925] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4A2925] tracking-wider uppercase mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#8C7A6B]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EDE5D5] focus:border-[#4A2925] rounded-xl text-xs text-[#4A2925] placeholder-[#8C7A6B] focus:ring-1 focus:ring-[#4A2925] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4A2925] tracking-wider uppercase mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#8C7A6B]" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EDE5D5] focus:border-[#4A2925] rounded-xl text-xs text-[#4A2925] placeholder-[#8C7A6B] focus:ring-1 focus:ring-[#4A2925] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <p className="text-[10px] text-[#8C7A6B] leading-normal pt-1">
                By registering, you agree to Khushi's Zone Terms of Service and
                Privacy Policy.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#4A2925] text-white rounded-full text-xs font-bold tracking-widest uppercase hover:bg-[#3D211E] transition-all shadow-md mt-2 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span>Registering...</span>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {mode === "verify" && (
            <form
              onSubmit={handleVerifySubmit}
              className="space-y-4 text-center"
            >
              <div className="p-4 bg-[#EDE5D5]/60 rounded-2xl border border-[#D9CEB9] text-xs text-[#4A2925] space-y-2">
                <p>
                  A verification email has been sent to{" "}
                  <strong>{email || "your inbox"}</strong>.
                </p>

                {devToken && (
                  <div className="mt-2 pt-2 border-t border-[#D9CEB9]">
                    <span className="text-[10px] text-[#6E493F] block font-semibold">
                      [Dev Test Code Auto-Detected]:
                    </span>
                    <code className="text-xs bg-[#4A2925] text-white px-2 py-0.5 rounded font-mono break-all">
                      {devToken}
                    </code>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-left text-[11px] font-bold text-[#4A2925] tracking-wider uppercase mb-1">
                  Verification Token / Code
                </label>
                <input
                  type="text"
                  required
                  value={verificationToken || devToken || ""}
                  onChange={(e) => setVerificationToken(e.target.value)}
                  placeholder="Enter code or token"
                  className="w-full text-center px-4 py-2.5 bg-white border border-[#EDE5D5] focus:border-[#4A2925] rounded-xl text-xs font-mono text-[#4A2925] focus:ring-1 focus:ring-[#4A2925] focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#4A2925] text-white rounded-full text-xs font-bold tracking-widest uppercase hover:bg-[#3D211E] transition-all shadow-md flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span>Verifying...</span>
                ) : (
                  <>
                    <span>Confirm & Activate Account</span>
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
