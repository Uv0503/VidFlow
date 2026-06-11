import { Link } from "react-router-dom";

const formatDuration = (seconds = 0) => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
};
const formatViews = (views = 0) => new Intl.NumberFormat("en", { notation: "compact" }).format(views);
const formatDate = (date) => date ? new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
  -Math.max(1, Math.round((Date.now() - new Date(date)) / 86400000)),
  "day"
) : "";

export default function VideoCard({ video }) {
  const owner = video.owner || {};
  return (
    <article className="group">
      <Link to={`/watch/${video._id}`} className="relative block aspect-video overflow-hidden rounded-2xl bg-zinc-900">
        <img src={video.thumbnail} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
        <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-xs font-semibold">{formatDuration(video.duration)}</span>
      </Link>
      <div className="mt-3 flex gap-3">
        <Link to={`/c/${owner.username || video.username}`}>
          {owner.avatar ? <img src={owner.avatar} alt="" className="h-10 w-10 rounded-full object-cover" /> : <div className="h-10 w-10 rounded-full bg-white/10" />}
        </Link>
        <div className="min-w-0">
          <Link to={`/watch/${video._id}`}><h3 className="line-clamp-2 font-semibold leading-snug text-zinc-100 group-hover:text-violet-300">{video.title}</h3></Link>
          <Link to={`/c/${owner.username || video.username}`} className="mt-1 block text-sm text-zinc-500 hover:text-zinc-300">{owner.fullName || `@${video.username}`}</Link>
          <p className="text-sm text-zinc-600">{formatViews(video.views)} views {video.createdAt && `• ${formatDate(video.createdAt)}`}</p>
        </div>
      </div>
    </article>
  );
}
