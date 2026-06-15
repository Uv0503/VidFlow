import { Router } from "express";
import { optionalJWT, verifyJWT } from "../middlewares/auth.middleware.js";
import {
   createTweet,
   getTweets,
   updateTweet,
   deleteTweet
} from "../controllers/tweet.controller.js";

const router= Router();

router.route("/").post(verifyJWT, createTweet).get(optionalJWT, getTweets);
router.route("/:tweetId").patch(verifyJWT, updateTweet).delete(verifyJWT, deleteTweet);

export default router;
