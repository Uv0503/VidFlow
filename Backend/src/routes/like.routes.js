import { Router } from "express";
import { getAllLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike } from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

router.post("/videos/:videoId", toggleVideoLike);
router.post("/comments/:commentId", toggleCommentLike);
router.post("/tweets/:tweetId", toggleTweetLike);
router.get("/videos", getAllLikedVideos);

export default router;
