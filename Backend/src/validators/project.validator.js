
import mongoose from "mongoose";
import { z } from "zod";

const objectIdSchema = z.string().refine(
  (value) => mongoose.isValidObjectId(value),
  { message: "Invalid MongoDB ID" }
);

export const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(2000).optional().default(""),
}).strict();

export const updateProjectSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(2000).optional(),
}).strict().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one field must be provided" }
);

export const addMemberSchema = z.object({
  userId: objectIdSchema,
}).strict();

export const projectParamsSchema = z.object({
  projectId: objectIdSchema,
});
