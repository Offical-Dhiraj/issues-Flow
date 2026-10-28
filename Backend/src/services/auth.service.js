
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { env } from "../config/env.js";

const SALT_ROUNDS = 12;

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function createToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      ver: user.tokenVersion,
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN,
      issuer: "issueflow-api",
      audience: "issueflow-client",
    }
  );
}

export async function registerUser(input) {
  const existing = await User.exists({ email: input.email });

  if (existing) {
    const error = new Error("An account with this email already exists.");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  try {
    const user = await User.create({
      name: input.name,
      email: input.email,
      password: passwordHash,
    });

    return {
      user: publicUser(user),
      token: createToken({ ...user.toObject(), tokenVersion: 0 }),
    };
  } catch (error) {
    if (error.code === 11000) {
      const conflict = new Error(
        "An account with this email already exists."
      );
      conflict.statusCode = 409;
      throw conflict;
    }

    throw error;
  }
}

export async function loginUser(input) {
  const user = await User.findOne({ email: input.email })
    .select("+password +tokenVersion");

  if (!user) {
    await bcrypt.compare(
      input.password,
      "$2b$12$LJ3m4ys3Lz0dG6eF4w7V2e9g3dK4aVJQ3lT5vR7zX1pH8nM6cY2uS"
    ).catch(() => false);

    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  const validPassword = await bcrypt.compare(
    input.password,
    user.password
  );

  if (!validPassword) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  return {
    user: publicUser(user),
    token: createToken(user),
  };
}

export async function getCurrentUser(userId) {
  const user = await User.findById(userId);

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  return publicUser(user);
}

export async function revokeUserTokens(userId) {
  const result = await User.updateOne(
    { _id: userId },
    { $inc: { tokenVersion: 1 } }
  );

  if (result.matchedCount === 0) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }
}
