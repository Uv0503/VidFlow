import { Like } from "../models/Like.models.js";
import { Video } from "../models/Video.models.js";
import { Comment } from "../models/Comment.models.js";
import { Tweet } from "../models/Tweet.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { assertObjectId } from "../utils/objectId.js";

const toggleLike = async ({ targetField, targetId, userId, model }) => {
  assertObjectId(targetId, targetField);
  if (!(await model.exists({ _id: targetId }))) {
    throw new ApiError(404, `${targetField} not found`);
  }

  const filter = { [targetField]: targetId, likedBy: userId };
  const existing = await Like.findOne(filter);
  if (existing) {
    await existing.deleteOne();
  } else {
    await Like.create(filter);
  }

  return {
    isLiked: !existing,
    likesCount: await Like.countDocuments({ [targetField]: targetId }),
  };
};

export const toggleVideoLike = asyncHandler(async (req, res) => {
  const data = await toggleLike({
    targetField: "video",
    targetId: req.params.videoId,
    userId: req.user._id,
    model: Video,
  });
  res.status(200).json(new ApiResponse(200, data, "Video like updated"));
});

export const toggleCommentLike = asyncHandler(async (req, res) => {
  const data = await toggleLike({
    targetField: "comment",
    targetId: req.params.commentId,
    userId: req.user._id,
    model: Comment,
  });
  res.status(200).json(new ApiResponse(200, data, "Comment like updated"));
});

export const toggleTweetLike = asyncHandler(async (req, res) => {
  const data = await toggleLike({
    targetField: "tweet",
    targetId: req.params.tweetId,
    userId: req.user._id,
    model: Tweet,
  });
  res.status(200).json(new ApiResponse(200, data, "Tweet like updated"));
});

export const getAllLikedVideos = asyncHandler(async (req, res) => {
  const likedVideos = await Like.find({
    likedBy: req.user._id,
    video: { $exists: true },
  })
    .sort({ createdAt: -1 })
    .populate({
      path: "video",
      match: { isPublished: true },
      populate: { path: "owner", select: "username fullName avatar" },
    });

  res.status(200).json(new ApiResponse(200, likedVideos, "Liked videos fetched"));
});
