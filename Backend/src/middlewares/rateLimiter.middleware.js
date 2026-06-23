import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const rateLimitHandler = (message) => (_req, res) => {
  res.status(429).json({ success: false, message, errors: [] });
};

const createLimiter = ({ windowMs, limit, message, keyGenerator }) => rateLimit({
  windowMs,
  limit,
  standardHeaders: true,
  legacyHeaders: false,
  ...(keyGenerator ? { keyGenerator } : {}),
  handler: rateLimitHandler(message),
});

export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: "Too many authentication attempts, please try again later",
});

export const uploadLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: "Too many upload requests, please try again later",
  keyGenerator: (req) => req.user?._id?.toString() || ipKeyGenerator(req.ip),
});

export const interactionLimiter = createLimiter({
  windowMs: 60 * 1000,
  limit: 60,
  message: "Too many requests, please slow down",
});
