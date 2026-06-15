import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createPlaylist,
  deletePlaylist,
  getMyPlaylists,
  removeVideoFromPlaylist,
  updatePlaylist,
} from "../services/social";
import { Button, EmptyState, ErrorMessage, Input, Loader, Textarea } from "../components/ui";

export default function Playlists() {
  const [playlists, setPlaylists] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getMyPlaylists()
      .then(setPlaylists)
      .catch((err) => setError(err.userMessage))
      .finally(() => setLoading(false));
  }, []);

  const create = async () => {
    if (!name.trim() || !description.trim()) return;
    setBusyId("create");
    setError("");
    try {
      const playlist = await createPlaylist(name.trim(), description.trim());
      setPlaylists((items) => [playlist, ...items]);
      setName("");
      setDescription("");
    } catch (err) {
      setError(err.userMessage);
    } finally {
      setBusyId("");
    }
  };

  const saveEdit = async () => {
    setBusyId(editingId);
    try {
      const playlist = await updatePlaylist(editingId, {
        name: editName.trim(),
        description: editDescription.trim(),
      });
      setPlaylists((items) => items.map((item) =>
        item._id === editingId ? playlist : item
      ));
      setEditingId("");
    } catch (err) {
      setError(err.userMessage);
    } finally {
      setBusyId("");
    }
  };

  const removePlaylist = async (playlist) => {
    if (!window.confirm(`Delete playlist "${playlist.name}"?`)) return;
    setBusyId(playlist._id);
    try {
      await deletePlaylist(playlist._id);
      setPlaylists((items) => items.filter((item) => item._id !== playlist._id));
    } catch (err) {
      setError(err.userMessage);
    } finally {
      setBusyId("");
    }
  };

  const removeVideo = async (playlistId, videoId) => {
    setBusyId(`${playlistId}:${videoId}`);
    try {
      const playlist = await removeVideoFromPlaylist(playlistId, videoId);
      setPlaylists((items) => items.map((item) =>
        item._id === playlistId ? playlist : item
      ));
    } catch (err) {
      setError(err.userMessage);
    } finally {
      setBusyId("");
    }
  };

  if (loading) return <Loader label="Loading your playlists" />;

  return (
    <section className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">Your library</p>
      <h1 className="mt-1 text-3xl font-bold">Playlists</h1>
      <p className="mt-2 text-zinc-500">Organize videos and return to them whenever you want.</p>
      <div className="mt-5"><ErrorMessage message={error} /></div>

      <div className="panel mt-6 grid gap-4 p-5 md:grid-cols-[1fr_1.5fr_auto] md:items-end">
        <Input label="Playlist name" value={name} onChange={(event) => setName(event.target.value)} />
        <Textarea
          label="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-12"
        />
        <Button onClick={create} disabled={!name.trim() || !description.trim() || busyId === "create"}>
          {busyId === "create" ? "Creating..." : "Create playlist"}
        </Button>
      </div>

      <div className="mt-7 grid gap-5">
        {playlists.map((playlist) => (
          <article key={playlist._id} className="panel overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-start">
              <div className="flex-1">
                {editingId === playlist._id ? (
                  <div className="grid gap-3">
                    <Input value={editName} onChange={(event) => setEditName(event.target.value)} />
                    <Textarea
                      value={editDescription}
                      onChange={(event) => setEditDescription(event.target.value)}
                      className="min-h-20"
                    />
                    <div className="flex gap-2">
                      <Button onClick={saveEdit} disabled={busyId === playlist._id}>Save</Button>
                      <Button variant="ghost" onClick={() => setEditingId("")}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold">{playlist.name}</h2>
                    <p className="mt-1 text-zinc-500">{playlist.description}</p>
                    <p className="mt-2 text-sm text-zinc-600">{playlist.videos?.length || 0} videos</p>
                  </>
                )}
              </div>
              {editingId !== playlist._id && (
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditingId(playlist._id);
                      setEditName(playlist.name);
                      setEditDescription(playlist.description);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    disabled={busyId === playlist._id}
                    onClick={() => removePlaylist(playlist)}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
            {playlist.videos?.length ? (
              <div className="grid gap-3 p-4">
                {playlist.videos.map((video) => (
                  <div key={video._id} className="flex items-center gap-4 rounded-xl bg-black/20 p-3">
                    <Link to={`/watch/${video._id}`} className="h-20 w-36 shrink-0 overflow-hidden rounded-lg bg-zinc-900">
                      <img src={video.thumbnail} alt="" className="h-full w-full object-cover" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link to={`/watch/${video._id}`} className="line-clamp-2 font-semibold hover:text-violet-300">
                        {video.title}
                      </Link>
                      <p className="mt-1 text-sm text-zinc-500">
                        {video.owner?.fullName || `@${video.username}`} · {(video.views || 0).toLocaleString()} views
                      </p>
                    </div>
                    <Button
                      variant="danger"
                      disabled={busyId === `${playlist._id}:${video._id}`}
                      onClick={() => removeVideo(playlist._id, video._id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 text-sm text-zinc-500">
                This playlist is empty. Use “Save” beneath a video to add it.
              </div>
            )}
          </article>
        ))}
        {!playlists.length && (
          <EmptyState title="No playlists yet" description="Create a playlist, then save videos from their watch pages." />
        )}
      </div>
    </section>
  );
}
