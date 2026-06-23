import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../services/auth";
import { Button } from "./ui";

export default function Navbar() {
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") || "");
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  useEffect(() => setQuery(params.get("q") || ""), [params]);

  const search = (event) => {
    event.preventDefault();
    navigate(query.trim() ? `/?q=${encodeURIComponent(query.trim())}` : "/");
  };

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-white/10 bg-zinc-950/75 backdrop-blur-xl">
      <div className="flex h-full items-center gap-3 px-4 md:px-6">
        <Link to="/" className="flex min-w-fit items-center gap-2 text-lg font-black tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20">V</span>
          <span className="hidden sm:block">VidFlow</span>
        </Link>
        <form onSubmit={search} className="mx-auto flex w-full max-w-2xl items-center">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search videos"
            className="h-10 w-full rounded-l-full border border-white/10 bg-white/5 px-5 text-sm outline-none focus:border-violet-400"
          />
          <button aria-label="Search" className="h-10 rounded-r-full border border-l-0 border-white/10 bg-white/10 px-5 text-zinc-300 hover:bg-white/15">Search</button>
        </form>
        {user ? (
          <div className="flex items-center gap-2">
            <Link to="/upload" className="hidden rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 sm:block">Upload</Link>
            <Link to="/profile" title="Your profile">
              <img src={user.avatar} alt="" className="h-9 w-9 rounded-full border border-white/15 object-cover" />
            </Link>
            <Button variant="ghost" className="hidden lg:block" onClick={() => logout().then(() => navigate("/"))}>Logout</Button>
          </div>
        ) : (
          <Link to="/login"><Button>Sign in</Button></Link>
        )}
      </div>
    </header>
  );
}
