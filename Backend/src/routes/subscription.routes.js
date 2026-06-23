import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { interactionLimiter } from "../middlewares/rateLimiter.middleware.js";
import { getChannelSubscribers, getMySubscriptionFeed, getSubscribedChannels, toggleSubscription } from "../controllers/subscription.controller.js";

const router = Router();
router.use(verifyJWT);
router.get("/me/feed", getMySubscriptionFeed)
router.post("/:channelId", interactionLimiter, toggleSubscription)
router.get("/:channelId/subscribers", getChannelSubscribers)
router.get("/user/:userId/channels", getSubscribedChannels)

export default router
