import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSubscriptionFeed } from "../services/video";
import VideoGrid from "../components/VideoGrid";
import { EmptyState, ErrorMessage, SkeletonGrid } from "../components/ui";

export default function Subscriptions() {
  const [channels, setChannels] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getSubscriptionFeed()
      .then((data) => {
        setChannels(data.channels || []);
        setVideos(data.videos || []);
      })
      .catch((err) => setError(err.userMessage))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">Your library</p>
      <div className="mt-1 flex flex-wrap items-end gap-3">
        <h1 className="text-3xl font-bold">Subscriptions</h1>
        {!loading && (
          <span className="mb-1 rounded-full bg-violet-500/10 px-3 py-1 text-sm font-semibold text-violet-300">
            {channels.length} subscribed
          </span>
        )}
      </div>
      <p className="mt-2 text-zinc-500">
        Latest videos from {channels.length || "the"} channels you follow.
      </p>
      <div className="mt-5"><ErrorMessage message={error} /></div>

      {loading ? <div className="mt-7"><SkeletonGrid /></div> : channels.length ? (
        <>
          <div className="mt-7 flex gap-4 overflow-x-auto pb-3">
            {channels.map((channel) => (
              <Link
                key={channel._id}
                to={`/c/${channel.username}`}
                className="panel flex min-w-48 items-center gap-3 p-3 transition hover:border-violet-500/30 hover:bg-violet-500/5"
              >
                <img src={channel.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{channel.fullName}</p>
                  <p className="truncate text-sm text-zinc-500">@{channel.username}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mb-5 mt-8 flex items-center justify-between">
            <h2 className="text-xl font-bold">Latest uploads</h2>
            <span className="text-sm text-zinc-500">{videos.length} videos</span>
          </div>
          {videos.length ? (
            <VideoGrid items={videos} />
          ) : (
            <EmptyState title="No recent uploads" description="Your subscribed channels have not published videos yet." />
          )}
        </>
      ) : (
        <div className="mt-7">
          <EmptyState title="No subscriptions yet" description="Open a channel or video and subscribe to see its latest uploads here." />
        </div>
      )}
    </section>
  );
}
