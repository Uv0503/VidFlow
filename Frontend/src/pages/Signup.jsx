import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../services/auth";
import { Button, ErrorMessage, Input } from "../components/ui";

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({ fullName: "", username: "", email: "", password: "" });
  const [avatar, setAvatar] = useState(null);
  const [cover, setCover] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const avatarUrl = avatar ? URL.createObjectURL(avatar) : "";
    const coverUrl = cover ? URL.createObjectURL(cover) : "";
    setAvatarPreview(avatarUrl);
    setCoverPreview(coverUrl);
    return () => { if (avatarUrl) URL.revokeObjectURL(avatarUrl); if (coverUrl) URL.revokeObjectURL(coverUrl); };
  }, [avatar, cover]);

  const submit = async (event) => {
    event.preventDefault();
    if (!avatar) return setError("An avatar is required.");
    setLoading(true);
    setError("");
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    data.append("avatar", avatar);
    if (cover) data.append("coverImage", cover);
    try {
      await signup(data);
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.userMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-[75vh] place-items-center py-6">
      <form onSubmit={submit} className="panel w-full max-w-2xl overflow-hidden">
        <div className="relative h-36 bg-gradient-to-r from-violet-600/40 to-fuchsia-500/30">
          {coverPreview && <img src={coverPreview} alt="" className="h-full w-full object-cover" />}
          <label className="absolute right-4 top-4 cursor-pointer rounded-lg bg-black/60 px-3 py-2 text-xs font-semibold">Choose cover<input type="file" accept="image/*" className="hidden" onChange={(event) => setCover(event.target.files?.[0] || null)} /></label>
          <label className="absolute -bottom-10 left-7 grid h-24 w-24 cursor-pointer place-items-center overflow-hidden rounded-full border-4 border-zinc-950 bg-zinc-800 text-xs text-zinc-400">
            {avatarPreview ? <img src={avatarPreview} alt="" className="h-full w-full object-cover" /> : "Avatar"}
            <input type="file" accept="image/*" className="hidden" onChange={(event) => setAvatar(event.target.files?.[0] || null)} />
          </label>
        </div>
        <div className="p-7 pt-16">
          <h1 className="text-3xl font-bold">Create your channel</h1>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Input label="Full name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />
            <Input label="Username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required />
            <Input label="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
            <Input label="Password" type="password" minLength={6} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
          </div>
          <div className="mt-5"><ErrorMessage message={error} /></div>
          <Button type="submit" disabled={loading} className="mt-5 w-full py-3">{loading ? "Creating account..." : "Create account"}</Button>
          <p className="mt-5 text-center text-sm text-zinc-500">Already have an account? <Link to="/login" className="font-semibold text-violet-300">Sign in</Link></p>
        </div>
      </form>
    </div>
  );
}
