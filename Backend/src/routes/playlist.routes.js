import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createPlaylist, 
    addVideoToPlaylist, 
    removeVideoFromPlaylist, 
    getUserPlaylists, 
    getPlaylistById, 
    getMyPlaylists,
    deletePlaylist, 
    updatePlaylist } from "../controllers/playlist.controller.js";

const router = Router();

router.post("/", verifyJWT, createPlaylist);
router.get("/me", verifyJWT, getMyPlaylists);
router.post("/:playlistId/videos/:videoId", verifyJWT, addVideoToPlaylist);
router.delete("/:playlistId/videos/:videoId", verifyJWT, removeVideoFromPlaylist);
router.get("/user/:userId", verifyJWT, getUserPlaylists);
router.get("/:playlistId", verifyJWT, getPlaylistById);
router.delete("/:playlistId", verifyJWT, deletePlaylist);
router.patch("/:playlistId", verifyJWT, updatePlaylist);

export default router;
