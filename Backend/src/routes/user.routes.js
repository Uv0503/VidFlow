import { Router } from "express";
import {loginUser, logoutUser, registerUser,refreshAccessToken,changeCurrentPassword,updateAccountDetails,
    updateUserAvatar,getCurrentUser,getUserChannelProfile,getWatchHistory,
    updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { optionalJWT, verifyJWT } from "../middlewares/auth.middleware.js";


const router= Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ])
    ,registerUser)

router.route("/login").post(upload.none(), loginUser)

//secured routes
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-current-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-account-details").patch(verifyJWT,updateAccountDetails)
router.route("/update-user-avatar").patch(verifyJWT,upload.single('avatar'),updateUserAvatar)
router.route("/update-user-coverImage").patch(verifyJWT,upload.single('coverImage'),updateUserCoverImage)
router.route("/c/:username").get(optionalJWT,getUserChannelProfile)
router.route("/watch-history").get(verifyJWT,getWatchHistory)


export default router;
