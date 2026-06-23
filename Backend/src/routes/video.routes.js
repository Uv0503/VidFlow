import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    toggleIsPublished,
    getChannelVideos,
    getMyVideos,
    getTrendingVideos,
    getRecommendedVideos,
} from "../controllers/video.controller.js";
import { optionalJWT } from "../middlewares/auth.middleware.js";
import { uploadLimiter } from "../middlewares/rateLimiter.middleware.js";

const router= Router();

router.route("/").get(getAllVideos);
router.route("/channel/:username").get(getChannelVideos);
router.route("/me/uploads").get(verifyJWT, getMyVideos);
router.route("/trending").get(getTrendingVideos);
router.route("/publish-video")
  .post(
    verifyJWT,
    uploadLimiter,
    upload.fields([
      { name: "videoFile", maxCount: 1 },
      { name: "thumbnail", maxCount: 1 }
    ]),
    publishVideo
  );
router.route("/:videoId/recommendations").get(getRecommendedVideos);
router.route("/:videoId").get(optionalJWT, getVideoById);
router.route("/:videoId").patch(verifyJWT, upload.single("thumbnail"), updateVideo);
router.route("/:videoId").delete(verifyJWT, deleteVideo);
router.route("/:videoId/publish").patch(verifyJWT, toggleIsPublished);


export default router;
