
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { env } from "../config/env.js";

export async function requireAuth(req, res, next) {
  try {
    const token = req.signedCookies?.issueflow_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const payload = jwt.verify(token, env.JWT_SECRET, {
      issuer: "issueflow-api",
      audience: "issueflow-client",
    });

    if (typeof payload.sub !== "string") {
      throw new Error("Invalid token subject");
    }

    const user = await User.findById(payload.sub)
      .select("+tokenVersion");

    if (!user || user.tokenVersion !== payload.ver) {
      return res.status(401).json({
        success: false,
        message: "Session is invalid or expired.",
      });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    };

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session.",
    });
  }
}
