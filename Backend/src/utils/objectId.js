import mongoose from "mongoose";
import { ApiError } from "./ApiError.js";

export const assertObjectId = (value, name = "id") => {
  if (!mongoose.isValidObjectId(value)) {
    throw new ApiError(400, `Invalid ${name}`);
  }
  return value;
};

export const isOwner = (ownerId, userId) =>
  ownerId?.toString() === userId?.toString();
