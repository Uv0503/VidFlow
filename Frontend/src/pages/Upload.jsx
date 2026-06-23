import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadVideo } from "../services/video";
import { Button, ErrorMessage, Input, Textarea } from "../components/ui";
import { VIDEO_CATEGORIES } from "../constants/video";

export default function Upload() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [tags, setTags] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState("");
  const fileSizeMb = videoFile ? videoFile.size / (1024 * 1024) : 0;

  useEffect(() => {
    if (!thumbnail) return setPreview("");
    const url = URL.createObjectURL(thumbnail);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbnail]);

  const submit = async (event) => {
    event.preventDefault();
    if (!title.trim() || !description.trim() || !videoFile || !thumbnail) {
      return setError("All fields, the video, and the thumbnail are required.");
    }
    setLoading(true);
    setError("");
    setSuccess("");
    setProgress(0);
    const form = new FormData();
    form.append("title", title.trim());
    form.append("description", description.trim());
    form.append("category", category);
    form.append("tags", tags);
    form.append("videoFile", videoFile);
    form.append("thumbnail", thumbnail);
    try {
      const video = await uploadVideo(form, (event) => {
        if (!event.total) return;
        setProgress(Math.min(100, Math.round((event.loaded * 100) / event.total)));
      });
      setProgress(100);
      setSuccess("Video uploaded successfully. Opening the watch page...");
      window.setTimeout(() => navigate(`/watch/${video._id}`), 1200);
    } catch (err) {
      setError(err.userMessage);
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">Creator studio</p>
      <h1 className="mt-1 text-3xl font-bold">Upload a new video</h1>
      <form onSubmit={submit} className="mt-7 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="panel grid gap-5 p-6">
          <Input label="Title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Give your video a clear title" />
          <Textarea label="Description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Tell viewers what this video is about" />
          <label className="grid gap-2 text-sm font-medium text-zinc-300">Category
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-xl border border-white/10 bg-zinc-950/70 px-4 py-3 text-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20">
              {VIDEO_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <Input label="Tags" value={tags} onChange={(event) => setTags(event.target.value)} />
          <p className="-mt-3 text-xs text-zinc-500">Separate up to 10 tags with commas.</p>
          <label className="grid cursor-pointer place-items-center rounded-2xl border border-dashed border-violet-400/30 bg-violet-500/5 px-6 py-10 text-center hover:bg-violet-500/10">
            <span className="font-semibold">{videoFile ? videoFile.name : "Choose a video file"}</span>
            {videoFile && <span className="mt-1 text-sm text-violet-300">{fileSizeMb.toFixed(1)} MB selected</span>}
            <span className="mt-1 text-sm text-zinc-500">MP4, WebM, or MOV up to 100 MB</span>
            {fileSizeMb > 50 && (
              <span className="mt-2 max-w-md text-xs text-amber-300">
                Large videos take longer because they are transferred to the server and then processed by Cloudinary.
              </span>
            )}
            <input type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={(event) => setVideoFile(event.target.files?.[0] || null)} />
          </label>
        </div>
        <div className="grid content-start gap-5">
          <label className="panel cursor-pointer overflow-hidden p-4">
            <span className="mb-3 block text-sm font-medium text-zinc-300">Thumbnail</span>
            <div className="grid aspect-video place-items-center overflow-hidden rounded-xl bg-zinc-950 text-sm text-zinc-500">
              {preview ? <img src={preview} alt="Thumbnail preview" className="h-full w-full object-cover" /> : "Select an image"}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={(event) => setThumbnail(event.target.files?.[0] || null)} />
          </label>
          <ErrorMessage message={error} />
          {success && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300">
              {success}
            </div>
          )}
          {loading && (
            <div className="panel p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-300">
                  {progress < 100 ? "Sending video to server" : "Processing on Cloudinary"}
                </span>
                <span className="text-violet-300">{progress}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-300 ${
                    progress === 100 ? "animate-pulse" : ""
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {progress === 100 && (
                <p className="mt-2 text-xs text-zinc-500">
                  Upload received. Please keep this page open while Cloudinary finishes processing.
                </p>
              )}
            </div>
          )}
          <Button type="submit" disabled={loading} className="w-full py-3.5">
            {loading
              ? progress < 100
                ? `Uploading ${progress}%`
                : "Finishing upload..."
              : "Publish video"}
          </Button>
        </div>
      </form>
    </div>
  );
}
