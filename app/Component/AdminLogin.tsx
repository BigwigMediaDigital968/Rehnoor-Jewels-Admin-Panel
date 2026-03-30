"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AdminLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email) e.email = "Email required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email";
    if (!password) e.password = "Password required";
    else if (password.length < 6) e.password = "Min 6 chars";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrors({ form: data.message || "Invalid credentials" });
        return;
      }

      // Store token in localStorage (also in cookie for middleware)
      localStorage.setItem("admin_token", data.data.token);
      document.cookie = `admin_token=${data.data.token}; path=/`;

      router.push("/admin/dashboard");
    } catch {
      setErrors({ form: "Server unreachable. Is the backend running?" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#002410] via-[#003720] to-[#004d2d]">
      <div className="w-full max-w-md p-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 flex items-center justify-center mb-4">
            <span className="text-black text-xl">◆</span>
          </div>
          <h1 className="text-2xl font-semibold text-yellow-400 tracking-widest">
            REHNOOR
          </h1>
          <p className="text-xs text-gray-400 tracking-widest">Admin Panel</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleLogin}
          className="bg-white/5 backdrop-blur-xl border border-yellow-400/20 rounded-xl p-6 shadow-xl"
        >
          <h2 className="text-lg text-white mb-6">Login to continue</h2>

          {/* Email */}
          <div className="mb-4">
            <label className="text-xs text-gray-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors({});
              }}
              className="w-full mt-1 px-3 py-2 rounded-md bg-white/10 border border-yellow-400/20 text-white outline-none"
              placeholder="admin@rehnoor.com"
            />
            {errors.email && (
              <p className="text-red-400 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="text-xs text-gray-400">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors({});
                }}
                className="w-full mt-1 px-3 py-2 pr-10 rounded-md bg-white/10 border border-yellow-400/20 text-white outline-none"
                placeholder="******"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-2 top-2 text-gray-400"
              >
                {showPass ? "🙈" : "👁"}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          {errors.form && (
            <p className="text-red-400 text-sm mb-3">{errors.form}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-md bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold cursor-pointer disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
