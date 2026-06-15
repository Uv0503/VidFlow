import { Playlist } from "../models/Playlist.models.js";
import { Video } from "../models/Video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { assertObjectId, isOwner } from "../utils/objectId.js";

const populatedPlaylist = (id) =>
  Playlist.findById(id)
    .populate("owner", "username fullName avatar")
    .populate({
      path: "videos",
      populate: { path: "owner", select: "username fullName avatar" },
    });

const ownedPlaylist = async (playlistId, userId) => {
  assertObjectId(playlistId, "playlist id");
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new ApiError(404, "Playlist not found");
  if (!isOwner(playlist.owner, userId)) throw new ApiError(403, "You do not own this playlist");
  return playlist;
};

export const createPlaylist = asyncHandler(async (req, res) => {
  const name = req.body.name?.trim();
  const description = req.body.description?.trim();
  if (!name || !description) throw new ApiError(400, "Name and description are required");
  const created = await Playlist.create({ name, description, videos: [], owner: req.user._id });
  const playlist = await populatedPlaylist(created._id);
  res.status(201).json(new ApiResponse(201, playlist, "Playlist created"));
});

export const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const playlist = await ownedPlaylist(req.params.playlistId, req.user._id);
  assertObjectId(req.params.videoId, "video id");
  if (!(await Video.exists({ _id: req.params.videoId }))) throw new ApiError(404, "Video not found");
  if (playlist.videos.some((id) => id.toString() === req.params.videoId)) {
    throw new ApiError(409, "Video is already in this playlist");
  }
  playlist.videos.push(req.params.videoId);
  await playlist.save();
  res.status(200).json(new ApiResponse(200, await populatedPlaylist(playlist._id), "Video added"));
});

export const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const playlist = await ownedPlaylist(req.params.playlistId, req.user._id);
  assertObjectId(req.params.videoId, "video id");
  playlist.videos = playlist.videos.filter((id) => id.toString() !== req.params.videoId);
  await playlist.save();
  res.status(200).json(new ApiResponse(200, await populatedPlaylist(playlist._id), "Video removed"));
});

export const getUserPlaylists = asyncHandler(async (req, res) => {
  assertObjectId(req.params.userId, "user id");
  const playlists = await Playlist.find({ owner: req.params.userId })
    .populate("owner", "username fullName avatar")
    .populate("videos", "title thumbnail duration views username");
  res.status(200).json(new ApiResponse(200, playlists, "Playlists fetched"));
});

export const getMyPlaylists = asyncHandler(async (req, res) => {
  const playlists = await Playlist.find({ owner: req.user._id })
    .populate("owner", "username fullName avatar")
    .populate({
      path: "videos",
      match: { isPublished: true },
      populate: { path: "owner", select: "username fullName avatar" },
    })
    .sort({ updatedAt: -1 });
  res.status(200).json(new ApiResponse(200, playlists, "Your playlists fetched"));
});

export const getPlaylistById = asyncHandler(async (req, res) => {
  assertObjectId(req.params.playlistId, "playlist id");
  const playlist = await populatedPlaylist(req.params.playlistId);
  if (!playlist) throw new ApiError(404, "Playlist not found");
  res.status(200).json(new ApiResponse(200, playlist, "Playlist fetched"));
});

export const updatePlaylist = asyncHandler(async (req, res) => {
  const playlist = await ownedPlaylist(req.params.playlistId, req.user._id);
  const name = req.body.name?.trim();
  const description = req.body.description?.trim();
  if (!name && !description) throw new ApiError(400, "Provide a name or description");
  if (name) playlist.name = name;
  if (description) playlist.description = description;
  await playlist.save();
  res.status(200).json(new ApiResponse(200, await populatedPlaylist(playlist._id), "Playlist updated"));
});

export const deletePlaylist = asyncHandler(async (req, res) => {
  const playlist = await ownedPlaylist(req.params.playlistId, req.user._id);
  await playlist.deleteOne();
  res.status(200).json(new ApiResponse(200, { id: playlist._id }, "Playlist deleted"));
});
