import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addComment, deleteComment, getAllVideoComments, updateComment } from "../controllers/comment.controller.js";

const router = Router();

router.route("/:videoId")
  .get(getAllVideoComments)
  .post(verifyJWT, addComment);
router.route("/:commentId")
  .patch(verifyJWT, updateComment)
  .delete(verifyJWT, deleteComment);

export default router;
