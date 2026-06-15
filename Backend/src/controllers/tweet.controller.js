import { Tweet } from "../models/Tweet.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { assertObjectId, isOwner } from "../utils/objectId.js";
import { Like } from "../models/Like.models.js";

export const createTweet = asyncHandler(async (req, res) => {
  const content = req.body.content?.trim();
  if (!content) throw new ApiError(400, "Content is required");
  const tweet = await Tweet.create({ content, owner: req.user._id });
  await tweet.populate("owner", "username fullName avatar");
  res.status(201).json(new ApiResponse(201, {
    ...tweet.toObject(),
    likesCount: 0,
    isLiked: false,
  }, "Tweet created"));
});

export const getTweets = asyncHandler(async (req, res) => {
  const tweets = await Tweet.find()
    .populate("owner", "username fullName avatar")
    .sort({ createdAt: -1 })
    .limit(100);
  const tweetIds = tweets.map((tweet) => tweet._id);
  const [likeCounts, viewerLikes] = await Promise.all([
    Like.aggregate([
      { $match: { tweet: { $in: tweetIds } } },
      { $group: { _id: "$tweet", count: { $sum: 1 } } },
    ]),
    req.user
      ? Like.find({ tweet: { $in: tweetIds }, likedBy: req.user._id }).select("tweet")
      : [],
  ]);
  const countByTweet = new Map(
    likeCounts.map((item) => [item._id.toString(), item.count])
  );
  const likedTweets = new Set(viewerLikes.map((like) => like.tweet.toString()));
  const data = tweets.map((tweet) => ({
    ...tweet.toObject(),
    likesCount: countByTweet.get(tweet._id.toString()) || 0,
    isLiked: likedTweets.has(tweet._id.toString()),
  }));
  res.status(200).json(new ApiResponse(200, data, "Tweets fetched"));
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
  await tweet.populate("owner", "username fullName avatar");
  const likesCount = await Like.countDocuments({ tweet: tweet._id });
  res.status(200).json(new ApiResponse(200, {
    ...tweet.toObject(),
    likesCount,
  }, "Tweet updated"));
});

export const deleteTweet = asyncHandler(async (req, res) => {
  assertObjectId(req.params.tweetId, "tweet id");
  const tweet = await Tweet.findById(req.params.tweetId);
  if (!tweet) throw new ApiError(404, "Tweet not found");
  if (!isOwner(tweet.owner, req.user._id)) throw new ApiError(403, "You do not own this tweet");
  await Promise.all([
    tweet.deleteOne(),
    Like.deleteMany({ tweet: tweet._id }),
  ]);
  res.status(200).json(new ApiResponse(200, { id: tweet._id }, "Tweet deleted"));
});
