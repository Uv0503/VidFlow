import { Subscription } from "../models/Subscriptions.models.js";
import { User } from "../models/User.models.js";
import { Video } from "../models/Video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { assertObjectId } from "../utils/objectId.js";

export const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  assertObjectId(channelId, "channel id");
  if (channelId === req.user._id.toString()) throw new ApiError(400, "You cannot subscribe to yourself");
  if (!(await User.exists({ _id: channelId }))) throw new ApiError(404, "Channel not found");

  const filter = { channel: channelId, subscriber: req.user._id };
  const existing = await Subscription.findOne(filter);
  if (existing) await existing.deleteOne();
  else await Subscription.create(filter);
  const subscribersCount = await Subscription.countDocuments({ channel: channelId });
  res.status(200).json(new ApiResponse(200, {
    isSubscribed: !existing,
    subscribersCount,
  }, "Subscription updated"));
});

export const getChannelSubscribers = asyncHandler(async (req, res) => {
  assertObjectId(req.params.channelId, "channel id");
  const subscriptions = await Subscription.find({ channel: req.params.channelId })
    .populate("subscriber", "username fullName avatar")
    .sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, subscriptions, "Subscribers fetched"));
});

export const getSubscribedChannels = asyncHandler(async (req, res) => {
  assertObjectId(req.params.userId, "user id");
  const subscriptions = await Subscription.find({ subscriber: req.params.userId })
    .populate("channel", "username fullName avatar")
    .sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, subscriptions, "Subscribed channels fetched"));
});

export const getMySubscriptionFeed = asyncHandler(async (req, res) => {
  const subscriptions = await Subscription.find({ subscriber: req.user._id })
    .populate("channel", "username fullName avatar coverImage")
    .sort({ createdAt: -1 });
  const channels = subscriptions
    .map((subscription) => subscription.channel)
    .filter(Boolean);
  const channelIds = channels.map((channel) => channel._id);
  const videos = channelIds.length
    ? await Video.find({ owner: { $in: channelIds }, isPublished: true })
        .populate("owner", "username fullName avatar")
        .sort({ createdAt: -1 })
        .limit(50)
    : [];

  res.status(200).json(new ApiResponse(200, {
    channels,
    videos,
  }, "Subscription feed fetched"));
});
