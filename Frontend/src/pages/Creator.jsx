import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../services/auth";
import { deleteVideo, getMyVideos } from "../services/video";
import { Button, EmptyState, ErrorMessage, Loader } from "../components/ui";

const compactNumber = (value = 0) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);

export default function Creator() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [totals, setTotals] = useState({ videos: 0, views: 0, likes: 0 });
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyVideos();
      setVideos(data.videos || []);
      setTotals(data.totals || { videos: 0, views: 0, likes: 0 });
    } catch (err) {
      setError(err.userMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async (video) => {
    if (!window.confirm(`Delete "${video.title}" permanently?`)) return;
    setDeletingId(video._id);
    setError("");
    try {
      await deleteVideo(video._id);
      setVideos((items) => items.filter((item) => item._id !== video._id));
      setTotals((current) => ({
        videos: Math.max(0, current.videos - 1),
        views: Math.max(0, current.views - (video.views || 0)),
        likes: Math.max(0, current.likes - (video.likesCount || 0)),
      }));
    } catch (err) {
      setError(err.userMessage);
    } finally {
      setDeletingId("");
    }
  };

  if (loading) return <Loader label="Loading your creator profile" />;

  return (
    <section className="mx-auto max-w-6xl">
      <ErrorMessage message={error} />
      <div className="panel mt-3 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-violet-700/50 via-fuchsia-600/30 to-zinc-900 sm:h-40" />
        <div className="flex flex-col gap-5 px-6 pb-7 sm:flex-row sm:items-end sm:px-8">
          <img
            src={user.avatar}
            alt=""
            className="-mt-12 h-24 w-24 rounded-full border-4 border-zinc-950 object-cover sm:h-28 sm:w-28"
          />
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">Creator profile</p>
            <h1 className="mt-1 text-3xl font-bold">{user.fullName}</h1>
            <p className="text-zinc-500">@{user.username}</p>
          </div>
          <div className="flex gap-2">
            <Link to={`/c/${user.username}`}><Button variant="secondary">View channel</Button></Link>
            <Link to="/upload"><Button>Upload video</Button></Link>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Videos", totals.videos],
          ["Total views", totals.views],
          ["Total likes", totals.likes],
        ].map(([label, value]) => (
          <div key={label} className="panel p-5">
            <p className="text-sm text-zinc-500">{label}</p>
            <p className="mt-2 text-3xl font-bold">{compactNumber(value)}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your uploads</h2>
        <span className="text-sm text-zinc-500">{videos.length} videos</span>
      </div>

      {videos.length ? (
        <div className="mt-5 grid gap-4">
          {videos.map((video) => (
            <article key={video._id} className="panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <Link to={`/watch/${video._id}`} className="aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-zinc-900 sm:w-52">
                <img src={video.thumbnail} alt="" className="h-full w-full object-cover" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/watch/${video._id}`} className="truncate text-lg font-semibold hover:text-violet-300">{video.title}</Link>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    video.isPublished ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"
                  }`}>
                    {video.isPublished ? "Published" : "Private"}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-zinc-500">{video.description}</p>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-400">
                  <span>{compactNumber(video.views)} views</span>
                  <span>{compactNumber(video.likesCount)} likes</span>
                  <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2 sm:flex-col">
                <Link to={`/watch/${video._id}`}><Button variant="secondary">Watch</Button></Link>
                <Button
                  variant="danger"
                  disabled={deletingId === video._id}
                  onClick={() => remove(video)}
                >
                  {deletingId === video._id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5">
          <EmptyState title="No uploads yet" description="Publish your first video to start building your channel." />
        </div>
      )}
    </section>
  );
}
