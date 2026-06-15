import api, { unwrap } from "./api";

export const getTweets = async () => unwrap(await api.get("/tweets"));
export const createTweet = async (content) =>
  unwrap(await api.post("/tweets", { content }));
export const updateTweet = async (tweetId, content) =>
  unwrap(await api.patch(`/tweets/${tweetId}`, { content }));
export const deleteTweet = async (tweetId) =>
  unwrap(await api.delete(`/tweets/${tweetId}`));
export const toggleTweetLike = async (tweetId) =>
  unwrap(await api.post(`/likes/tweets/${tweetId}`));

export const getMyPlaylists = async () =>
  unwrap(await api.get("/playlists/me"));
export const createPlaylist = async (name, description) =>
  unwrap(await api.post("/playlists", { name, description }));
export const updatePlaylist = async (playlistId, values) =>
  unwrap(await api.patch(`/playlists/${playlistId}`, values));
export const deletePlaylist = async (playlistId) =>
  unwrap(await api.delete(`/playlists/${playlistId}`));
export const addVideoToPlaylist = async (playlistId, videoId) =>
  unwrap(await api.post(`/playlists/${playlistId}/videos/${videoId}`));
export const removeVideoFromPlaylist = async (playlistId, videoId) =>
  unwrap(await api.delete(`/playlists/${playlistId}/videos/${videoId}`));
