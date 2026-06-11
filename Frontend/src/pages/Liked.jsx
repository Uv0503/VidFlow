import { useEffect, useState } from "react";
import { getLikedVideos } from "../services/video";
import VideoGrid from "../components/VideoGrid";
import { EmptyState, ErrorMessage, SkeletonGrid } from "../components/ui";

export default function Liked() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    getLikedVideos()
      .then((likes) => setVideos((likes || []).map((like) => like.video).filter(Boolean)))
      .catch((err) => setError(err.userMessage))
      .finally(() => setLoading(false));
  }, []);
  return (
    <section>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">Your library</p>
      <h1 className="mb-7 mt-1 text-3xl font-bold">Liked videos</h1>
      <ErrorMessage message={error} />
      {loading ? <SkeletonGrid /> : videos.length ? <VideoGrid items={videos} /> : <EmptyState title="No liked videos" description="Videos you like will be collected here." />}
    </section>
  );
}
