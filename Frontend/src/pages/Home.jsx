import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listVideos } from "../services/video";
import VideoGrid from "../components/VideoGrid";
import { EmptyState, ErrorMessage, SkeletonGrid } from "../components/ui";

export default function Home() {
  const [params] = useSearchParams();
  const query = params.get("q") || "";
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    listVideos(query)
      .then((data) => active && setVideos(data.videos || []))
      .catch((err) => active && setError(err.userMessage))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [query]);

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">{query ? "Search results" : "Discover"}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{query ? `Videos for "${query}"` : "Fresh videos for you"}</h1>
      </div>
      <ErrorMessage message={error} />
      {loading ? <SkeletonGrid /> : videos.length ? <VideoGrid items={videos} /> : (
        <EmptyState title="No videos found" description={query ? "Try a broader search phrase." : "Published videos will appear here."} />
      )}
    </section>
  );
}
