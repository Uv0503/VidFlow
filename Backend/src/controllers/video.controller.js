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

export const VIDEO_CATEGORIES = [
  "General", "Education", "Technology", "Gaming", "Music", "Entertainment",
  "Sports", "News", "Howto & Style", "Travel",
];

const normalizeCategory = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new ApiError(400, "Category must be one of the supported categories");
  }
  const category = VIDEO_CATEGORIES.find((item) => item.toLowerCase() === value.trim().toLowerCase());
  if (!category) throw new ApiError(400, "Category must be one of the supported categories");
  return category;
};

const normalizeTags = (value) => {
  const values = Array.isArray(value) ? value : [value];
  const tags = [...new Set(values.flatMap((item) => String(item ?? "").split(","))
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean))];
  if (tags.length > 10) throw new ApiError(400, "A video can have at most 10 tags");
  return tags;
};

const parsePagination = (query, defaultLimit = 12, maxLimit = 50) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);
  return { page, limit };
};

const ensureVideoOwner = async (videoId, userId) => {
  assertObjectId(videoId, "video id");
  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");
  if (!isOwner(video.owner, userId)) throw new ApiError(403, "You do not own this video");
  return video;
};

const listVideos = async (req, res, ownerId) => {
  const { page, limit } = parsePagination(req.query);
  const sortBy = ["createdAt", "views", "title", "duration"].includes(req.query.sortBy)
    ? req.query.sortBy
    : "createdAt";
  const sortType = req.query.sortType === "asc" ? 1 : -1;
  const filter = { isPublished: true };

  const conditions = [];
  if (req.query.category !== undefined) {
    const category = normalizeCategory(req.query.category);
    conditions.push({ $or: category === "General"
      ? [{ category }, { category: { $exists: false } }]
      : [{ category }] });
  }
  if (req.query.tag?.trim()) {
    filter.tags = req.query.tag.trim().toLowerCase();
  }
  if (req.query.query?.trim()) {
    const pattern = req.query.query.trim();
    conditions.push({ $or: [
      { title: { $regex: pattern, $options: "i" } },
      { description: { $regex: pattern, $options: "i" } },
      { tags: { $regex: pattern, $options: "i" } },
      { category: { $regex: pattern, $options: "i" } },
    ] });
  }
  if (conditions.length) filter.$and = conditions;
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
      category: req.body.category === undefined ? "General" : normalizeCategory(req.body.category),
      tags: req.body.tags === undefined ? [] : normalizeTags(req.body.tags),
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
  const hasCategory = Object.prototype.hasOwnProperty.call(req.body, "category");
  const hasTags = Object.prototype.hasOwnProperty.call(req.body, "tags");
  if (!title && !description && !req.file?.path && !hasCategory && !hasTags) {
    throw new ApiError(400, "Provide a title, description, thumbnail, category, or tags");
  }
  if (title) video.title = title;
  if (description) video.description = description;
  if (hasCategory) video.category = normalizeCategory(req.body.category);
  if (hasTags) video.tags = normalizeTags(req.body.tags);
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


const engagementStages = () => [
  { $lookup: { from: "likes", let: { videoId: "$_id" }, pipeline: [
    { $match: { $expr: { $eq: ["$video", "$$videoId"] } } },
    { $count: "count" },
  ], as: "likeStats" } },
  { $lookup: { from: "comments", let: { videoId: "$_id" }, pipeline: [
    { $match: { $expr: { $eq: ["$video", "$$videoId"] } } },
    { $count: "count" },
  ], as: "commentStats" } },
  { $addFields: {
    likesCount: { $ifNull: [{ $arrayElemAt: ["$likeStats.count", 0] }, 0] },
    commentsCount: { $ifNull: [{ $arrayElemAt: ["$commentStats.count", 0] }, 0] },
    category: { $ifNull: ["$category", "General"] },
  } },
  { $lookup: { from: "users", let: { ownerId: "$owner" }, pipeline: [
    { $match: { $expr: { $eq: ["$_id", "$$ownerId"] } } },
    { $project: { username: 1, fullName: 1, avatar: 1 } },
  ], as: "owner" } },
  { $unwind: "$owner" },
  { $project: { likeStats: 0, commentStats: 0, viewedBy: 0 } },
];

export const getTrendingVideos = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const recentThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const pipeline = [
    { $match: { isPublished: true } },
    ...engagementStages(),
    { $addFields: { trendingScore: { $add: [
      { $ifNull: ["$views", 0] },
      { $multiply: ["$likesCount", 3] },
      { $multiply: ["$commentsCount", 2] },
      { $cond: [{ $gte: ["$createdAt", recentThreshold] }, 20, 0] },
    ] } } },
    { $sort: { trendingScore: -1, createdAt: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ];
  const [videos, totalVideos] = await Promise.all([
    Video.aggregate(pipeline),
    Video.countDocuments({ isPublished: true }),
  ]);
  res.status(200).json(new ApiResponse(200, {
    videos,
    page,
    limit,
    totalDocs: totalVideos,
    totalVideos,
    totalPages: Math.ceil(totalVideos / limit),
  }, "Trending videos fetched"));
});

const recommendationPipeline = (match, currentVideo) => [
  { $match: match },
  ...engagementStages(),
  { $addFields: {
    matchingTagsCount: { $size: { $setIntersection: [{ $ifNull: ["$tags", []] }, currentVideo.tags || []] } },
    sameCategory: { $cond: [{ $eq: ["$category", currentVideo.category || "General"] }, 1, 0] },
    sameOwner: { $cond: [{ $eq: ["$owner._id", currentVideo.owner] }, 1, 0] },
  } },
  { $addFields: { recommendationScore: { $add: [
    { $multiply: ["$sameCategory", 4] },
    { $multiply: ["$matchingTagsCount", 3] },
    { $multiply: ["$sameOwner", 2] },
    { $multiply: ["$likesCount", 2] },
    { $multiply: [{ $ifNull: ["$views", 0] }, 0.5] },
  ] } } },
  { $sort: { recommendationScore: -1, createdAt: -1 } },
];

export const getRecommendedVideos = asyncHandler(async (req, res) => {
  assertObjectId(req.params.videoId, "video id");
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 20);
  const currentVideo = await Video.findById(req.params.videoId).select("category tags owner isPublished");
  if (!currentVideo || !currentVideo.isPublished) throw new ApiError(404, "Video not found");

  const currentCategory = currentVideo.category || "General";
  const similarityMatch = {
    _id: { $ne: currentVideo._id },
    isPublished: true,
    $or: [
      { category: currentCategory },
      ...(currentCategory === "General" ? [{ category: { $exists: false } }] : []),
      { tags: { $in: currentVideo.tags || [] } },
      { owner: currentVideo.owner },
    ],
  };
  const matchingVideos = await Video.aggregate([
    ...recommendationPipeline(similarityMatch, currentVideo),
    { $limit: limit },
  ]);
  if (matchingVideos.length >= limit) {
    return res.status(200).json(new ApiResponse(200, matchingVideos, "Recommended videos fetched"));
  }

  const remaining = limit - matchingVideos.length;
  const fallbackVideos = await Video.aggregate([
    ...recommendationPipeline({
      _id: { $nin: [currentVideo._id, ...matchingVideos.map((video) => video._id)] },
      isPublished: true,
    }, currentVideo),
    { $sort: { views: -1, likesCount: -1, createdAt: -1 } },
    { $limit: remaining },
  ]);
  res.status(200).json(new ApiResponse(200, [...matchingVideos, ...fallbackVideos], "Recommended videos fetched"));
});
