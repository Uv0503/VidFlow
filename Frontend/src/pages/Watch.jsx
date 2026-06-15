import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  addComment,
  deleteComment,
  getComments,
  getVideoById,
  toggleLikeVideo,
  toggleSubscription,
  updateComment,
} from "../services/video";
import { useAuth } from "../services/auth";
import { Button, EmptyState, ErrorMessage, Input, Loader } from "../components/ui";
import { addVideoToPlaylist, getMyPlaylists } from "../services/social";

const sameId = (a, b) => a?.toString() === b?.toString();

export default function Watch() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [playlistMessage, setPlaylistMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [videoData, commentData] = await Promise.all([
        getVideoById(videoId),
        getComments(videoId),
      ]);
      setVideo(videoData);
      setComments(commentData || []);
    } catch (err) {
      setError(err.userMessage);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => { load(); }, [load]);

  const requireAuth = () => {
    if (user) return true;
    navigate("/login", { state: { from: `/watch/${videoId}` } });
    return false;
  };

  const like = async () => {
    if (!requireAuth()) return;
    try {
      const state = await toggleLikeVideo(videoId);
      setVideo((current) => ({ ...current, ...state }));
    } catch (err) {
      setError(err.userMessage);
    }
  };

  const subscribe = async () => {
    if (!requireAuth()) return;
    try {
      const state = await toggleSubscription(video.owner._id);
      setVideo((current) => ({ ...current, ...state }));
    } catch (err) {
      setError(err.userMessage);
    }
  };

  const openPlaylists = async () => {
    if (!requireAuth()) return;
    const nextOpen = !showPlaylists;
    setShowPlaylists(nextOpen);
    setPlaylistMessage("");
    if (!nextOpen || playlists.length) return;
    setPlaylistsLoading(true);
    try {
      setPlaylists(await getMyPlaylists());
    } catch (err) {
      setError(err.userMessage);
    } finally {
      setPlaylistsLoading(false);
    }
  };

  const saveToPlaylist = async (playlistId) => {
    setBusy(true);
    setPlaylistMessage("");
    try {
      const updated = await addVideoToPlaylist(playlistId, videoId);
      setPlaylists((items) => items.map((item) =>
        item._id === updated._id ? updated : item
      ));
      setPlaylistMessage(`Saved to ${updated.name}`);
    } catch (err) {
      setPlaylistMessage(err.userMessage);
    } finally {
      setBusy(false);
    }
  };

  const post = async () => {
    if (!text.trim() || !requireAuth()) return;
    setBusy(true);
    try {
      const comment = await addComment(videoId, text.trim());
      setComments((current) => [comment, ...current]);
      setText("");
    } catch (err) {
      setError(err.userMessage);
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async () => {
    if (!editingText.trim()) return;
    setBusy(true);
    try {
      const updated = await updateComment(editingId, editingText.trim());
      setComments((items) => items.map((item) => item._id === updated._id ? updated : item));
      setEditingId(null);
    } catch (err) {
      setError(err.userMessage);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this comment?")) return;
    setBusy(true);
    try {
      await deleteComment(id);
      setComments((items) => items.filter((item) => item._id !== id));
    } catch (err) {
      setError(err.userMessage);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader label="Loading video" />;
  if (!video) return <ErrorMessage message={error || "Video not found"} />;

  return (
    <div className="mx-auto max-w-6xl">
      <ErrorMessage message={error} />
      <div className="mt-3 overflow-hidden rounded-2xl bg-black shadow-2xl shadow-black/40">
        <video src={video.videoFile} poster={video.thumbnail} className="aspect-video w-full" controls autoPlay />
      </div>
      <h1 className="mt-5 text-2xl font-bold">{video.title}</h1>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <Link to={`/c/${video.owner?.username}`}><img src={video.owner?.avatar} alt="" className="h-12 w-12 rounded-full object-cover" /></Link>
          <div>
            <Link to={`/c/${video.owner?.username}`} className="font-semibold hover:text-violet-300">{video.owner?.fullName}</Link>
            <p className="text-sm text-zinc-500">
              @{video.owner?.username} · {video.subscribersCount || 0} subscribers
            </p>
          </div>
          {!sameId(video.owner?._id, user?._id) && (
            <Button
              variant={video.isSubscribed ? "secondary" : "primary"}
              onClick={subscribe}
              className="ml-2"
            >
              {video.isSubscribed ? "Subscribed" : "Subscribe"}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant={video.isLiked ? "primary" : "secondary"} onClick={like}>
            {video.isLiked ? "Liked" : "Like"} · {video.likesCount || 0}
          </Button>
          <Button variant="secondary" onClick={openPlaylists}>Save</Button>
          <Button variant="secondary" onClick={() => navigator.clipboard?.writeText(window.location.href)}>Share</Button>
        </div>
      </div>
      {showPlaylists && (
        <div className="panel mt-4 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Save to playlist</h2>
            <Link to="/playlists" className="text-sm font-semibold text-violet-300 hover:text-violet-200">
              Manage playlists
            </Link>
          </div>
          {playlistsLoading ? (
            <p className="mt-3 text-sm text-zinc-500">Loading playlists...</p>
          ) : playlists.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {playlists.map((playlist) => {
                const alreadySaved = playlist.videos?.some((item) => item._id === videoId);
                return (
                  <Button
                    key={playlist._id}
                    variant={alreadySaved ? "secondary" : "ghost"}
                    disabled={busy || alreadySaved}
                    onClick={() => saveToPlaylist(playlist._id)}
                  >
                    {alreadySaved ? `Saved in ${playlist.name}` : playlist.name}
                  </Button>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">
              You have no playlists. Create one from the Playlists page.
            </p>
          )}
          {playlistMessage && <p className="mt-3 text-sm text-violet-300">{playlistMessage}</p>}
        </div>
      )}
      <div className="panel mt-5 p-5">
        <p className="text-sm font-semibold text-zinc-300">{video.views?.toLocaleString()} views</p>
        <p className="mt-3 whitespace-pre-wrap text-zinc-400">{video.description}</p>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-bold">{comments.length} Comments</h2>
        <div className="mt-4 flex gap-3">
          {user?.avatar && <img src={user.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />}
          <div className="flex-1">
            <Input value={text} onChange={(event) => setText(event.target.value)} placeholder={user ? "Add a comment" : "Sign in to comment"} disabled={!user || busy} />
            {user && <div className="mt-2 flex justify-end"><Button onClick={post} disabled={busy || !text.trim()}>Comment</Button></div>}
          </div>
        </div>
        <div className="mt-6 grid gap-5">
          {comments.map((comment) => (
            <article key={comment._id} className="flex gap-3">
              <img src={comment.owner?.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">@{comment.owner?.username}</p>
                {editingId === comment._id ? (
                  <div className="mt-2">
                    <Input value={editingText} onChange={(event) => setEditingText(event.target.value)} />
                    <div className="mt-2 flex gap-2"><Button onClick={saveEdit} disabled={busy}>Save</Button><Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button></div>
                  </div>
                ) : <p className="mt-1 whitespace-pre-wrap text-zinc-300">{comment.content}</p>}
                {sameId(comment.owner?._id, user?._id) && editingId !== comment._id && (
                  <div className="mt-2 flex gap-1">
                    <Button variant="ghost" onClick={() => { setEditingId(comment._id); setEditingText(comment.content); }}>Edit</Button>
                    <Button variant="danger" onClick={() => remove(comment._id)} disabled={busy}>Delete</Button>
                  </div>
                )}
              </div>
            </article>
          ))}
          {!comments.length && <EmptyState title="No comments yet" description="Start the conversation." />}
        </div>
      </section>
    </div>
  );
}
