import { useEffect, useState } from "react";
import VideoGrid from "../components/VideoGrid";
import { EmptyState, ErrorMessage, SkeletonGrid } from "../components/ui";
import { getTrendingVideos } from "../services/video";

export default function Trending() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getTrendingVideos()
      .then((data) => active && setVideos(data.videos || []))
      .catch((err) => active && setError(err.userMessage))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">Popular now</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Trending videos</h1>
      </div>
      <ErrorMessage message={error} />
      {loading ? <SkeletonGrid /> : videos.length ? <VideoGrid items={videos} /> : (
        <EmptyState title="Nothing is trending yet" description="Published videos with engagement will appear here." />
      )}
    </section>
  );
}
