import api, { unwrap } from "./api";

export const listVideos = async (query = "") =>
  unwrap(await api.get("/videos", { params: { query: query || undefined, limit: 24 } }));

export const getVideoById = async (id) => unwrap(await api.get(`/videos/${id}`));
export const uploadVideo = async (form, onUploadProgress) =>
  unwrap(await api.post("/videos/publish-video", form, {
    timeout: 10 * 60 * 1000,
    onUploadProgress,
  }));
export const toggleLikeVideo = async (id) => unwrap(await api.post(`/likes/videos/${id}`));
export const getLikedVideos = async () => unwrap(await api.get("/likes/videos"));
export const getComments = async (videoId) => unwrap(await api.get(`/comments/${videoId}`));
export const addComment = async (videoId, content) =>
  unwrap(await api.post(`/comments/${videoId}`, { content }));
export const updateComment = async (commentId, content) =>
  unwrap(await api.patch(`/comments/${commentId}`, { content }));
export const deleteComment = async (commentId) =>
  unwrap(await api.delete(`/comments/${commentId}`));
export const getChannel = async (username) =>
  unwrap(await api.get(`/users/c/${encodeURIComponent(username)}`));
export const getChannelVideos = async (username) =>
  unwrap(await api.get(`/videos/channel/${encodeURIComponent(username)}`, { params: { limit: 24 } }));
export const toggleSubscription = async (channelId) =>
  unwrap(await api.post(`/subscriptions/${channelId}`));
export const getMyVideos = async () => unwrap(await api.get("/videos/me/uploads"));
export const deleteVideo = async (videoId) =>
  unwrap(await api.delete(`/videos/${videoId}`));
export const getSubscriptionFeed = async () =>
  unwrap(await api.get("/subscriptions/me/feed"));
