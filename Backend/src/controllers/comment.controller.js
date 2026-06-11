import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { Comment } from "../models/Comment.models.js";
import { Video } from "../models/Video.models.js";
import { assertObjectId, isOwner } from "../utils/objectId.js";

const populateOwner = (query) =>
  query.populate("owner", "username fullName avatar");

export const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const content = req.body.content?.trim();
  assertObjectId(videoId, "video id");
  if (!content) throw new ApiError(400, "Comment cannot be empty");
  if (!(await Video.exists({ _id: videoId, isPublished: true }))) {
    throw new ApiError(404, "Video not found");
  }

  const created = await Comment.create({
    content,
    video: videoId,
    owner: req.user._id,
  });
  const comment = await populateOwner(Comment.findById(created._id));
  res.status(201).json(new ApiResponse(201, comment, "Comment added"));
});

export const getAllVideoComments = asyncHandler(async (req, res) => {
  assertObjectId(req.params.videoId, "video id");
  const comments = await Comment.find({ video: req.params.videoId })
    .populate("owner", "username fullName avatar")
    .sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, comments, "Comments fetched"));
});

export const updateComment = asyncHandler(async (req, res) => {
  assertObjectId(req.params.commentId, "comment id");
  const content = req.body.content?.trim();
  if (!content) throw new ApiError(400, "Comment cannot be empty");

  const comment = await Comment.findById(req.params.commentId);
  if (!comment) throw new ApiError(404, "Comment not found");
  if (!isOwner(comment.owner, req.user._id)) {
    throw new ApiError(403, "You can only update your own comments");
  }
  comment.content = content;
  await comment.save();
  await comment.populate("owner", "username fullName avatar");
  res.status(200).json(new ApiResponse(200, comment, "Comment updated"));
});

export const deleteComment = asyncHandler(async (req, res) => {
  assertObjectId(req.params.commentId, "comment id");
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) throw new ApiError(404, "Comment not found");
  if (!isOwner(comment.owner, req.user._id)) {
    throw new ApiError(403, "You can only delete your own comments");
  }
  await comment.deleteOne();
  res.status(200).json(new ApiResponse(200, { id: comment._id }, "Comment deleted"));
});
