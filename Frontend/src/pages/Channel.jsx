import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getChannel, getChannelVideos, toggleSubscription } from "../services/video";
import { useAuth } from "../services/auth";
import VideoGrid from "../components/VideoGrid";
import { Button, EmptyState, ErrorMessage, Loader } from "../components/ui";

export default function Channel() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([getChannel(username), getChannelVideos(username)])
      .then(([profile, videoData]) => { setChannel(profile); setVideos(videoData.videos || []); })
      .catch((err) => setError(err.userMessage))
      .finally(() => setLoading(false));
  }, [username, user?._id]);

  const subscribe = async () => {
    if (!user) return navigate("/login", { state: { from: `/c/${username}` } });
    try {
      const state = await toggleSubscription(channel._id);
      setChannel((current) => ({ ...current, ...state }));
    } catch (err) {
      setError(err.userMessage);
    }
  };

  if (loading) return <Loader label="Loading channel" />;
  if (!channel) return <ErrorMessage message={error || "Channel not found"} />;
  const ownChannel = user?._id === channel._id;

  return (
    <div>
      <ErrorMessage message={error} />
      <div className="mt-3 h-40 overflow-hidden rounded-3xl bg-gradient-to-r from-violet-800/50 to-fuchsia-700/30 sm:h-56">
        {channel.coverImage && <img src={channel.coverImage} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="relative px-4 pb-7 sm:px-8">
        <div className="-mt-12 flex flex-col gap-5 sm:-mt-16 sm:flex-row sm:items-end">
          <img src={channel.avatar} alt="" className="h-28 w-28 rounded-full border-4 border-[#09090b] object-cover sm:h-36 sm:w-36" />
          <div className="flex-1 sm:pb-2">
            <h1 className="text-3xl font-bold">{channel.fullName}</h1>
            <p className="mt-1 text-zinc-500">@{channel.username} · {channel.subscribersCount || 0} subscribers</p>
          </div>
          {!ownChannel && <Button onClick={subscribe} variant={channel.isSubscribed ? "secondary" : "primary"} className="sm:mb-2">{channel.isSubscribed ? "Subscribed" : "Subscribe"}</Button>}
        </div>
      </div>
      <div className="border-t border-white/10 pt-7">
        <h2 className="mb-5 text-xl font-bold">Videos</h2>
        {videos.length ? <VideoGrid items={videos} /> : <EmptyState title="No published videos" description="This channel has not published anything yet." />}
      </div>
    </div>
  );
}
