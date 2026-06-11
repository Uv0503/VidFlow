import multer from "multer";
import path from "path";
import crypto from "crypto";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "./public/temp/"),
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
  },
});

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const allowedVideoTypes = new Set(["video/mp4", "video/webm", "video/quicktime"]);

const fileFilter = (_req, file, cb) => {
  const allowed = file.fieldname === "videoFile"
    ? allowedVideoTypes.has(file.mimetype)
    : allowedImageTypes.has(file.mimetype);

  if (!allowed) {
    const error = new Error(`Unsupported file type for ${file.fieldname}`);
    error.statusCode = 400;
    return cb(error);
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024, files: 2 },
});
