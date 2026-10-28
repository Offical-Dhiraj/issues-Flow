
import {
  registerUser,
  loginUser,
  getCurrentUser,
  revokeUserTokens,
} from "../services/auth.service.js";
import { env } from "../config/env.js";

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "none" : "lax",
  signed: true,
  path: "/",
  maxAge: env.COOKIE_MAX_AGE,
};

function setAuthCookie(res, token) {
  res.cookie("issueflow_token", token, cookieOptions);
}

function clearAuthCookie(res) {
  res.clearCookie("issueflow_token", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    signed: true,
    path: "/",
  });
}

export async function register(req, res) {
  const result = await registerUser(req.body);

  setAuthCookie(res, result.token);

  return res.status(201).json({
    success: true,
    message: "Account created successfully.",
    data: { user: result.user },
  });
}

export async function login(req, res) {
  const result = await loginUser(req.body);

  setAuthCookie(res, result.token);

  return res.status(200).json({
    success: true,
    message: "Login successful.",
    data: { user: result.user },
  });
}

export async function logout(req, res) {
  await revokeUserTokens(req.user.id);
  clearAuthCookie(res);

  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
}

export async function me(req, res) {
  const user = await getCurrentUser(req.user.id);

  return res.status(200).json({
    success: true,
    data: { user },
  });
}
