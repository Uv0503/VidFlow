import { useEffect, useState } from "react";
import { getWatchHistory } from "../services/video";
import VideoGrid from "../components/VideoGrid";
import { EmptyState, ErrorMessage, SkeletonGrid } from "../components/ui";

export default function History() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getWatchHistory()
      .then((items) => setVideos(items || []))
      .catch((err) => setError(err.userMessage))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">
        Your library
      </p>
      <div className="mt-1 flex flex-wrap items-end gap-3">
        <h1 className="text-3xl font-bold">Watch history</h1>
        {!loading && (
          <span className="mb-1 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-zinc-300">
            {videos.length} watched
          </span>
        )}
      </div>
      <p className="mt-2 text-zinc-500">
        Videos you recently watched while signed in.
      </p>
      <div className="mt-5">
        <ErrorMessage message={error} />
      </div>

      <div className="mt-7">
        {loading ? (
          <SkeletonGrid />
        ) : videos.length ? (
          <VideoGrid items={videos} />
        ) : (
          <EmptyState
            title="Your watch history is empty"
            description="Videos you watch while signed in will appear here."
          />
        )}
      </div>
    </section>
  );
}
