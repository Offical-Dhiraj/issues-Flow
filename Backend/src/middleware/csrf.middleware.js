
import { env } from "../config/env.js";

const unsafeMethods = new Set(["POST", "PATCH", "PUT", "DELETE"]);

export function verifyRequestOrigin(req, res, next) {
  if (!unsafeMethods.has(req.method)) {
    return next();
  }

  const origin = req.get("Origin");

  if (!origin || origin !== env.CLIENT_URL) {
    return res.status(403).json({
      success: false,
      message: "Request origin validation failed.",
    });
  }

  next();
}
