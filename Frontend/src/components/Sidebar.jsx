import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home", icon: "H" },
  { to: "/subscriptions", label: "Subscriptions", icon: "S" },
  { to: "/tweets", label: "Posts", icon: "T" },
  { to: "/playlists", label: "Playlists", icon: "P" },
  { to: "/liked", label: "Liked", icon: "L" },
  { to: "/profile", label: "Profile", icon: "C" },
  { to: "/upload", label: "Upload", icon: "U" },
];

export default function Sidebar() {
  return (
    <aside className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-zinc-950/95 p-2 backdrop-blur md:bottom-auto md:right-auto md:top-16 md:h-[calc(100vh-64px)] md:w-20 md:border-r md:border-t-0 lg:w-60 lg:p-4">
      <nav className="flex justify-start gap-1 overflow-x-auto md:grid md:justify-stretch md:overflow-visible">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium transition md:py-3 lg:flex-row lg:gap-3 lg:text-sm ${
                isActive ? "bg-violet-500/15 text-violet-300" : "text-zinc-500 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/5 text-xs font-bold">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
