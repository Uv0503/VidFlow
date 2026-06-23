import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import VideoGrid from "../components/VideoGrid";
import { EmptyState, ErrorMessage, SkeletonGrid } from "../components/ui";
import { VIDEO_CATEGORIES } from "../constants/video";
import { getTrendingVideos, listVideos } from "../services/video";

export default function Home() {
  const [params] = useSearchParams();
  const query = params.get("q") || "";
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");
  const [videos, setVideos] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    listVideos(query, { category, tag })
      .then((data) => active && setVideos(data.videos || []))
      .catch((err) => active && setError(err.userMessage))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [query, category, tag]);

  useEffect(() => {
    let active = true;
    getTrendingVideos({ limit: 4 })
      .then((data) => active && setTrending(data.videos || []))
      .finally(() => active && setTrendingLoading(false));
    return () => { active = false; };
  }, []);

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">{query ? "Search results" : "Discover"}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{query ? `Videos for "${query}"` : "Fresh videos for you"}</h1>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-violet-400">
            <option value="">All categories</option>
            {VIDEO_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <input value={tag} onChange={(event) => setTag(event.target.value)} placeholder="Filter by tag" className="rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400" />
        </div>
      </div>
      <ErrorMessage message={error} />
      {loading ? <SkeletonGrid /> : videos.length ? <VideoGrid items={videos} /> : (
        <EmptyState title="No videos found" description="Try another category, tag, or search phrase." />
      )}
      <section className="mt-12 border-t border-white/10 pt-8">
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">Popular now</p><h2 className="mt-1 text-2xl font-bold">Trending</h2></div>
          <Link to="/trending" className="text-sm font-semibold text-violet-300 hover:text-violet-200">See all</Link>
        </div>
        {trendingLoading ? <div className="mt-5"><SkeletonGrid count={4} /></div> : trending.length ? <div className="mt-5"><VideoGrid items={trending} /></div> : null}
      </section>
    </section>
  );
}
