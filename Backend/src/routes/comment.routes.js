import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addComment, deleteComment, getAllVideoComments, updateComment } from "../controllers/comment.controller.js";
import { interactionLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = Router();

router.route("/:videoId")
  .get(getAllVideoComments)
  .post(verifyJWT, interactionLimiter, addComment);
router.route("/:commentId")
  .patch(verifyJWT, interactionLimiter, updateComment)
  .delete(verifyJWT, interactionLimiter, deleteComment);

export default router;
