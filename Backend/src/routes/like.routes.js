import { Router } from "express";
import { getAllLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike } from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { interactionLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = Router();
router.use(verifyJWT);

router.post("/videos/:videoId", interactionLimiter, toggleVideoLike);
router.post("/comments/:commentId", interactionLimiter, toggleCommentLike);
router.post("/tweets/:tweetId", interactionLimiter, toggleTweetLike);
router.get("/videos", getAllLikedVideos);

export default router;
