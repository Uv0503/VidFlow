import { User } from "../models/User.models.js";
import {ApiError} from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asynchandler.js";
import jwt  from "jsonwebtoken";

const getAccessToken = (req) => {
  const header = req.get("authorization");
  const bearerToken = header?.match(/^Bearer\s+(.+)$/i)?.[1];
  return req.cookies?.accessToken || bearerToken;
};

const attachUser = async (req, required) => {
  const token = getAccessToken(req);
  if (!token) {
    if (required) throw new ApiError(401, "Authentication required");
    return;
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    if (!user) throw new ApiError(401, "Invalid access token");
    req.user = user;
  } catch {
    if (required) throw new ApiError(401, "Invalid or expired access token");
  }
};

export const verifyJWT = asyncHandler(async (req, _res, next) => {
  await attachUser(req, true);
  next();
});

export const optionalJWT = asyncHandler(async (req, _res, next) => {
  await attachUser(req, false);
  next();
});
