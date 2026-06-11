import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../services/auth";
import { Button, ErrorMessage, Input } from "../components/ui";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    const value = identifier.trim();
    if (!value || !password) return setError("Enter your username or email and password.");
    setLoading(true);
    setError("");
    try {
      await login(value.includes("@") ? { email: value, password } : { username: value, password });
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      setError(err.userMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-[75vh] place-items-center">
      <form onSubmit={submit} className="panel w-full max-w-md p-7 shadow-2xl shadow-violet-950/20">
        <p className="text-sm font-semibold text-violet-400">Welcome back</p>
        <h1 className="mt-1 text-3xl font-bold">Sign in to VideoTube</h1>
        <p className="mt-2 text-sm text-zinc-500">Continue watching, commenting, and creating.</p>
        <div className="mt-7 grid gap-4">
          <Input label="Username or email" value={identifier} onChange={(event) => setIdentifier(event.target.value)} autoComplete="username" />
          <Input label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
          <ErrorMessage message={error} />
          <Button type="submit" disabled={loading} className="w-full py-3">{loading ? "Signing in..." : "Sign in"}</Button>
        </div>
        <p className="mt-6 text-center text-sm text-zinc-500">New here? <Link to="/signup" className="font-semibold text-violet-300 hover:text-violet-200">Create an account</Link></p>
      </form>
    </div>
  );
}
