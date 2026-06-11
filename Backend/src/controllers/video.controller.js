import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/Video.models.js";
import { User } from "../models/User.models.js";
import { Like } from "../models/Like.models.js";
import { Comment } from "../models/Comment.models.js";
import { Playlist } from "../models/Playlist.models.js";
import { Subscription } from "../models/Subscriptions.models.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
  extractPublicId,
} from "../utils/cloudinary.js";
import { assertObjectId, isOwner } from "../utils/objectId.js";

const ownerFields = "username fullName avatar";

const ensureVideoOwner = async (videoId, userId) => {
  assertObjectId(videoId, "video id");
  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");
  if (!isOwner(video.owner, userId)) throw new ApiError(403, "You do not own this video");
  return video;
};

const listVideos = async (req, res, ownerId) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 12, 1), 50);
  const sortBy = ["createdAt", "views", "title", "duration"].includes(req.query.sortBy)
    ? req.query.sortBy
    : "createdAt";
  const sortType = req.query.sortType === "asc" ? 1 : -1;
  const filter = { isPublished: true };
  if (req.query.query?.trim()) {
    const pattern = req.query.query.trim();
    filter.$or = [
      { title: { $regex: pattern, $options: "i" } },
      { description: { $regex: pattern, $options: "i" } },
    ];
  }
  const requestedOwner = ownerId || req.query.userId;
  if (requestedOwner) {
    assertObjectId(requestedOwner, "user id");
    filter.owner = requestedOwner;
  }

  const [videos, total] = await Promise.all([
    Video.find(filter)
      .populate("owner", ownerFields)
      .sort({ [sortBy]: sortType })
      .skip((page - 1) * limit)
      .limit(limit),
    Video.countDocuments(filter),
  ]);
  res.status(200).json(new ApiResponse(200, {
    videos,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }, "Videos fetched"));
};

export const getAllVideos = asyncHandler(async (req, res) => {
  await listVideos(req, res);
});

export const getChannelVideos = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.params.username?.toLowerCase() });
  if (!user) throw new ApiError(404, "Channel not found");
  await listVideos(req, res, user._id.toString());
});

export const getMyVideos = asyncHandler(async (req, res) => {
  const videos = await Video.find({ owner: req.user._id })
    .populate("owner", ownerFields)
    .sort({ createdAt: -1 });
  const videoIds = videos.map((video) => video._id);
  const likeCounts = await Like.aggregate([
    { $match: { video: { $in: videoIds } } },
    { $group: { _id: "$video", count: { $sum: 1 } } },
  ]);
  const likesByVideo = new Map(
    likeCounts.map((item) => [item._id.toString(), item.count])
  );
  const items = videos.map((video) => ({
    ...video.toObject(),
    likesCount: likesByVideo.get(video._id.toString()) || 0,
  }));
  const totals = items.reduce(
    (summary, video) => ({
      views: summary.views + (video.views || 0),
      likes: summary.likes + (video.likesCount || 0),
    }),
    { views: 0, likes: 0 }
  );

  res.status(200).json(new ApiResponse(200, {
    videos: items,
    totals: { videos: items.length, ...totals },
  }, "Creator videos fetched"));
});

export const publishVideo = asyncHandler(async (req, res) => {
  const title = req.body.title?.trim();
  const description = req.body.description?.trim();
  const videoPath = req.files?.videoFile?.[0]?.path;
  const thumbnailPath = req.files?.thumbnail?.[0]?.path;
  if (!title || !description || !videoPath || !thumbnailPath) {
    throw new ApiError(400, "Title, description, video file, and thumbnail are required");
  }

  let videoUpload;
  let thumbnailUpload;
  try {
    const [videoResult, thumbnailResult] = await Promise.allSettled([
      uploadOnCloudinary(videoPath, "video"),
      uploadOnCloudinary(thumbnailPath, "image"),
    ]);
    videoUpload = videoResult.status === "fulfilled" ? videoResult.value : null;
    thumbnailUpload = thumbnailResult.status === "fulfilled" ? thumbnailResult.value : null;

    if (!videoUpload?.secure_url || !thumbnailUpload?.secure_url) {
      throw new ApiError(502, "Cloudinary could not process the uploaded files");
    }

    const video = await Video.create({
      title,
      description,
      duration: Math.round(videoUpload.duration || 0),
      owner: req.user._id,
      username: req.user.username,
      videoFile: videoUpload.secure_url,
      thumbnail: thumbnailUpload.secure_url,
      isPublished: true,
    });
    await video.populate("owner", ownerFields);
    res.status(201).json(new ApiResponse(201, video, "Video published"));
  } catch (error) {
    if (videoUpload?.public_id) {
      await deleteFromCloudinary(videoUpload.public_id, "video").catch(() => {});
    }
    if (thumbnailUpload?.public_id) {
      await deleteFromCloudinary(thumbnailUpload.public_id, "image").catch(() => {});
    }
    throw error;
  }
});

export const getVideoById = asyncHandler(async (req, res) => {
  assertObjectId(req.params.videoId, "video id");
  const filter = { _id: req.params.videoId };
  if (req.user) {
    filter.$or = [{ isPublished: true }, { owner: req.user._id }];
  } else {
    filter.isPublished = true;
  }

  let video;
  if (req.user) {
    video = await Video.findOneAndUpdate(
      { ...filter, viewedBy: { $ne: req.user._id } },
      {
        $addToSet: { viewedBy: req.user._id },
        $inc: { views: 1 },
      },
      { new: true }
    ).populate("owner", ownerFields);
  }

  if (!video) {
    video = await Video.findOne(filter).populate("owner", ownerFields);
  }
  if (!video) throw new ApiError(404, "Video not found");

  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { watchHistory: video._id },
    });
    await User.findByIdAndUpdate(req.user._id, {
      $push: { watchHistory: { $each: [video._id], $position: 0, $slice: 100 } },
    });
  }
  const [likesCount, isLiked, subscribersCount, isSubscribed] = await Promise.all([
    Like.countDocuments({ video: video._id }),
    req.user ? Like.exists({ video: video._id, likedBy: req.user._id }) : false,
    Subscription.countDocuments({ channel: video.owner._id }),
    req.user && !isOwner(video.owner._id, req.user._id)
      ? Subscription.exists({ channel: video.owner._id, subscriber: req.user._id })
      : false,
  ]);
  const data = {
    ...video.toObject(),
    likesCount,
    isLiked: Boolean(isLiked),
    subscribersCount,
    isSubscribed: Boolean(isSubscribed),
  };
  res.status(200).json(new ApiResponse(200, data, "Video fetched"));
});

export const updateVideo = asyncHandler(async (req, res) => {
  const video = await ensureVideoOwner(req.params.videoId, req.user._id);
  const title = req.body.title?.trim();
  const description = req.body.description?.trim();
  if (!title && !description && !req.file?.path) {
    throw new ApiError(400, "Provide a title, description, or thumbnail");
  }
  if (title) video.title = title;
  if (description) video.description = description;
  if (req.file?.path) {
    const uploaded = await uploadOnCloudinary(req.file.path, "image");
    const oldPublicId = extractPublicId(video.thumbnail);
    video.thumbnail = uploaded.secure_url;
    await video.save();
    if (oldPublicId) await deleteFromCloudinary(oldPublicId, "image").catch(() => {});
  } else {
    await video.save();
  }
  await video.populate("owner", ownerFields);
  res.status(200).json(new ApiResponse(200, video, "Video updated"));
});

export const deleteVideo = asyncHandler(async (req, res) => {
  const video = await ensureVideoOwner(req.params.videoId, req.user._id);
  await Promise.all([
    video.deleteOne(),
    Like.deleteMany({ video: video._id }),
    Comment.deleteMany({ video: video._id }),
    Playlist.updateMany({ videos: video._id }, { $pull: { videos: video._id } }),
    User.updateMany({ watchHistory: video._id }, { $pull: { watchHistory: video._id } }),
  ]);
  await Promise.all([
    deleteFromCloudinary(extractPublicId(video.videoFile), "video").catch(() => {}),
    deleteFromCloudinary(extractPublicId(video.thumbnail), "image").catch(() => {}),
  ]);
  res.status(200).json(new ApiResponse(200, { id: video._id }, "Video deleted"));
});

export const toggleIsPublished = asyncHandler(async (req, res) => {
  const video = await ensureVideoOwner(req.params.videoId, req.user._id);
  video.isPublished = !video.isPublished;
  await video.save();
  res.status(200).json(new ApiResponse(200, video, "Publish status updated"));
});
