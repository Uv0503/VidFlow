import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../services/auth";
import {
  createTweet,
  deleteTweet,
  getTweets,
  toggleTweetLike,
  updateTweet,
} from "../services/social";
import { Button, EmptyState, ErrorMessage, Loader, Textarea } from "../components/ui";

const sameId = (a, b) => a?.toString() === b?.toString();

export default function Tweets() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tweets, setTweets] = useState([]);
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editingContent, setEditingContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getTweets()
      .then(setTweets)
      .catch((err) => setError(err.userMessage))
      .finally(() => setLoading(false));
  }, []);

  const requireAuth = () => {
    if (user) return true;
    navigate("/login", { state: { from: "/tweets" } });
    return false;
  };

  const publish = async () => {
    if (!content.trim() || !requireAuth()) return;
    setBusyId("create");
    setError("");
    try {
      const tweet = await createTweet(content.trim());
      setTweets((items) => [tweet, ...items]);
      setContent("");
    } catch (err) {
      setError(err.userMessage);
    } finally {
      setBusyId("");
    }
  };

  const like = async (tweetId) => {
    if (!requireAuth()) return;
    try {
      const state = await toggleTweetLike(tweetId);
      setTweets((items) => items.map((tweet) =>
        tweet._id === tweetId ? { ...tweet, ...state } : tweet
      ));
    } catch (err) {
      setError(err.userMessage);
    }
  };

  const saveEdit = async () => {
    if (!editingContent.trim()) return;
    setBusyId(editingId);
    try {
      const updated = await updateTweet(editingId, editingContent.trim());
      setTweets((items) => items.map((tweet) =>
        tweet._id === editingId ? { ...tweet, ...updated } : tweet
      ));
      setEditingId("");
    } catch (err) {
      setError(err.userMessage);
    } finally {
      setBusyId("");
    }
  };

  const remove = async (tweet) => {
    if (!window.confirm("Delete this post?")) return;
    setBusyId(tweet._id);
    try {
      await deleteTweet(tweet._id);
      setTweets((items) => items.filter((item) => item._id !== tweet._id));
    } catch (err) {
      setError(err.userMessage);
    } finally {
      setBusyId("");
    }
  };

  if (loading) return <Loader label="Loading community posts" />;

  return (
    <section className="mx-auto max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">Community</p>
      <h1 className="mt-1 text-3xl font-bold">Posts</h1>
      <p className="mt-2 text-zinc-500">Share updates and connect with other creators.</p>
      <div className="mt-5"><ErrorMessage message={error} /></div>

      <div className="panel mt-6 p-5">
        <div className="flex gap-3">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
          ) : (
            <div className="h-11 w-11 rounded-full bg-white/10" />
          )}
          <div className="flex-1">
            <Textarea
              value={content}
              maxLength={500}
              onChange={(event) => setContent(event.target.value)}
              placeholder={user ? "Share an update with the community" : "Sign in to create a post"}
              disabled={!user || busyId === "create"}
              className="min-h-24"
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-zinc-600">{content.length}/500</span>
              <Button onClick={publish} disabled={!content.trim() || busyId === "create"}>
                {busyId === "create" ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        {tweets.map((tweet) => (
          <article key={tweet._id} className="panel p-5">
            <div className="flex gap-3">
              <Link to={`/c/${tweet.owner?.username}`}>
                <img src={tweet.owner?.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/c/${tweet.owner?.username}`} className="font-semibold hover:text-violet-300">
                    {tweet.owner?.fullName}
                  </Link>
                  <span className="text-sm text-zinc-500">@{tweet.owner?.username}</span>
                  <span className="text-sm text-zinc-700">·</span>
                  <span className="text-sm text-zinc-500">{new Date(tweet.createdAt).toLocaleDateString()}</span>
                </div>
                {editingId === tweet._id ? (
                  <div className="mt-3">
                    <Textarea
                      value={editingContent}
                      maxLength={500}
                      onChange={(event) => setEditingContent(event.target.value)}
                      className="min-h-24"
                    />
                    <div className="mt-2 flex gap-2">
                      <Button onClick={saveEdit} disabled={busyId === tweet._id}>Save</Button>
                      <Button variant="ghost" onClick={() => setEditingId("")}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 whitespace-pre-wrap text-zinc-200">{tweet.content}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant={tweet.isLiked ? "primary" : "ghost"}
                    onClick={() => like(tweet._id)}
                  >
                    {tweet.isLiked ? "Liked" : "Like"} · {tweet.likesCount || 0}
                  </Button>
                  {sameId(tweet.owner?._id, user?._id) && editingId !== tweet._id && (
                    <>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditingId(tweet._id);
                          setEditingContent(tweet.content);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        disabled={busyId === tweet._id}
                        onClick={() => remove(tweet)}
                      >
                        {busyId === tweet._id ? "Deleting..." : "Delete"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
        {!tweets.length && (
          <EmptyState title="No community posts" description="Be the first person to share an update." />
        )}
      </div>
    </section>
  );
}
