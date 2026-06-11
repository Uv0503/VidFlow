import { Tweet } from "../models/Tweet.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { assertObjectId, isOwner } from "../utils/objectId.js";

export const createTweet = asyncHandler(async (req, res) => {
  const content = req.body.content?.trim();
  if (!content) throw new ApiError(400, "Content is required");
  const tweet = await Tweet.create({ content, owner: req.user._id });
  res.status(201).json(new ApiResponse(201, tweet, "Tweet created"));
});

export const getUserTweets = asyncHandler(async (req, res) => {
  const tweets = await Tweet.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, tweets, "Tweets fetched"));
});

export const updateTweet = asyncHandler(async (req, res) => {
  assertObjectId(req.params.tweetId, "tweet id");
  const content = req.body.content?.trim();
  if (!content) throw new ApiError(400, "Content is required");
  const tweet = await Tweet.findById(req.params.tweetId);
  if (!tweet) throw new ApiError(404, "Tweet not found");
  if (!isOwner(tweet.owner, req.user._id)) throw new ApiError(403, "You do not own this tweet");
  tweet.content = content;
  await tweet.save();
  res.status(200).json(new ApiResponse(200, tweet, "Tweet updated"));
});

export const deleteTweet = asyncHandler(async (req, res) => {
  assertObjectId(req.params.tweetId, "tweet id");
  const tweet = await Tweet.findById(req.params.tweetId);
  if (!tweet) throw new ApiError(404, "Tweet not found");
  if (!isOwner(tweet.owner, req.user._id)) throw new ApiError(403, "You do not own this tweet");
  await tweet.deleteOne();
  res.status(200).json(new ApiResponse(200, { id: tweet._id }, "Tweet deleted"));
});
