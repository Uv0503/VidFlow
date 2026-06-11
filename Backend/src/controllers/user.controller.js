import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/User.models.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
  extractPublicId,
} from "../utils/cloudinary.js";
import { getCookieOptions } from "../utils/cookies.js";

const sanitizeUser = (query) => query.select("-password -refreshToken");

const generateAccessAndRefreshTokens = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  const accessToken = user.genrateAccessToken();
  const refreshToken = user.genrateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

export const registerUser = asyncHandler(async (req, res) => {
  const fullName = req.body.fullName?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const username = req.body.username?.trim().toLowerCase();
  const password = req.body.password;
  if (!fullName || !email || !username || !password) {
    throw new ApiError(400, "Full name, email, username, and password are required");
  }
  if (password.length < 6) throw new ApiError(400, "Password must be at least 6 characters");
  if (!/^[a-z0-9._-]+$/.test(username)) {
    throw new ApiError(400, "Username contains unsupported characters");
  }

  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) throw new ApiError(409, "Email or username is already in use");

  const avatarPath = req.files?.avatar?.[0]?.path;
  const coverPath = req.files?.coverImage?.[0]?.path;
  if (!avatarPath) throw new ApiError(400, "Avatar is required");

  const avatar = await uploadOnCloudinary(avatarPath, "image");
  if (!avatar?.secure_url) throw new ApiError(502, "Avatar upload failed");
  let coverImage;
  try {
    coverImage = coverPath ? await uploadOnCloudinary(coverPath, "image") : null;
    const user = await User.create({
      fullName,
      email,
      username,
      password,
      avatar: avatar.secure_url,
      coverImage: coverImage?.secure_url || "",
    });
    const createdUser = await sanitizeUser(User.findById(user._id));
    res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully"));
  } catch (error) {
    await deleteFromCloudinary(avatar.public_id, "image").catch(() => {});
    if (coverImage?.public_id) {
      await deleteFromCloudinary(coverImage.public_id, "image").catch(() => {});
    }
    throw error;
  }
});

export const loginUser = asyncHandler(async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const username = req.body.username?.trim().toLowerCase();
  if ((!email && !username) || !req.body.password) {
    throw new ApiError(400, "Username or email and password are required");
  }
  const user = await User.findOne(email ? { email } : { username });
  if (!user || !(await user.isPasswordCorrect(req.body.password))) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
  const loggedInUser = await sanitizeUser(User.findById(user._id));
  const options = getCookieOptions();
  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "Logged in"));
});

export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
  const options = getCookieOptions();
  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Logged out"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) throw new ApiError(401, "Refresh token is required");

  let decodedToken;
  try {
    decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }
  const user = await User.findById(decodedToken?._id);
  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is no longer valid");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
  const options = getCookieOptions();
  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, { accessToken, refreshToken }, "Access token refreshed"));
});

export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword || newPassword.length < 6) {
    throw new ApiError(400, "Old password and a new password of at least 6 characters are required");
  }
  const user = await User.findById(req.user._id);
  if (!(await user.isPasswordCorrect(oldPassword))) {
    throw new ApiError(400, "Old password is incorrect");
  }
  user.password = newPassword;
  await user.save();
  res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, req.user, "Current user fetched"));
});

export const updateAccountDetails = asyncHandler(async (req, res) => {
  const fullName = req.body.fullName?.trim();
  const email = req.body.email?.trim().toLowerCase();
  if (!fullName || !email) throw new ApiError(400, "Full name and email are required");
  const user = await sanitizeUser(
    User.findByIdAndUpdate(req.user._id, { $set: { fullName, email } }, { new: true, runValidators: true })
  );
  res.status(200).json(new ApiResponse(200, user, "Account updated"));
});

const replaceUserImage = async ({ userId, localPath, field }) => {
  if (!localPath) throw new ApiError(400, `${field} file is required`);
  const uploaded = await uploadOnCloudinary(localPath, "image");
  if (!uploaded?.secure_url) throw new ApiError(502, `${field} upload failed`);

  const currentUser = await User.findById(userId);
  const oldPublicId = extractPublicId(currentUser?.[field]);
  const user = await sanitizeUser(
    User.findByIdAndUpdate(userId, { $set: { [field]: uploaded.secure_url } }, { new: true })
  );
  if (oldPublicId) await deleteFromCloudinary(oldPublicId, "image").catch(() => {});
  return user;
};

export const updateUserAvatar = asyncHandler(async (req, res) => {
  const user = await replaceUserImage({ userId: req.user._id, localPath: req.file?.path, field: "avatar" });
  res.status(200).json(new ApiResponse(200, user, "Avatar updated"));
});

export const updateUserCoverImage = asyncHandler(async (req, res) => {
  const user = await replaceUserImage({ userId: req.user._id, localPath: req.file?.path, field: "coverImage" });
  res.status(200).json(new ApiResponse(200, user, "Cover image updated"));
});

export const getUserChannelProfile = asyncHandler(async (req, res) => {
  const username = req.params.username?.trim().toLowerCase();
  if (!username) throw new ApiError(400, "Username is required");
  const viewerId = req.user?._id || null;

  const [channel] = await User.aggregate([
    { $match: { username } },
    { $lookup: { from: "subscriptions", localField: "_id", foreignField: "channel", as: "subscribers" } },
    { $lookup: { from: "subscriptions", localField: "_id", foreignField: "subscriber", as: "subscribedTo" } },
    {
      $addFields: {
        subscribersCount: { $size: "$subscribers" },
        channelsSubscribedToCount: { $size: "$subscribedTo" },
        isSubscribed: viewerId
          ? { $in: [new mongoose.Types.ObjectId(viewerId), "$subscribers.subscriber"] }
          : false,
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
      },
    },
  ]);
  if (!channel) throw new ApiError(404, "Channel not found");
  res.status(200).json(new ApiResponse(200, channel, "Channel fetched"));
});

export const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: "watchHistory",
    match: { isPublished: true },
    populate: { path: "owner", select: "username fullName avatar" },
  });
  res.status(200).json(new ApiResponse(200, user?.watchHistory || [], "Watch history fetched"));
});
