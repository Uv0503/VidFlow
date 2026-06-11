import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import { ApiError } from "./utils/ApiError.js"

const app=express()

const normalizeOrigin = (origin) => origin?.trim().replace(/\/+$/, "");
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);
const isDevelopment = process.env.NODE_ENV !== "production";

const isLocalDevelopmentOrigin = (origin) => {
    if (!isDevelopment) return false;
    try {
        const url = new URL(origin);
        return (
            ["http:", "https:"].includes(url.protocol) &&
            ["localhost", "127.0.0.1", "::1"].includes(url.hostname)
        );
    } catch {
        return false;
    }
};

app.use(cors({
    origin(origin, callback) {
        const normalizedOrigin = normalizeOrigin(origin);
        if (
            !origin ||
            allowedOrigins.includes(normalizedOrigin) ||
            isLocalDevelopmentOrigin(normalizedOrigin)
        ) {
            return callback(null, true);
        }
        callback(new ApiError(403, "Origin is not allowed by CORS"));
    },
    credentials:true
}))
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

//routes import
import userRouter from "./routes/user.routes.js"   
import videoRouter from "./routes/video.routes.js" 
import tweetRouter from "./routes/tweet.routes.js" 
import playlistRouter from "./routes/playlist.routes.js"    
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"

//routes declaration
app.use("/api/v1/users",userRouter)
// like http://localhost:8000/api/v1/users/register
app.use("/api/v1/videos",videoRouter)
// like http://localhost:8000/api/v1/videos/publish-video
app.use("/api/v1/tweets",tweetRouter)
app.use("/api/v1/playlists",playlistRouter)
app.use("/api/v1/comments",commentRouter)
app.use("/api/v1/likes",likeRouter)
app.use("/api/v1/subscriptions",subscriptionRouter)
import { errorHandler, notFound } from "./middlewares/error.middleware.js"
app.use(notFound)
app.use(errorHandler)
export {app} 
