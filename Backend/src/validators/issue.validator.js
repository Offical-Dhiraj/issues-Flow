
import mongoose from "mongoose";
import { z } from "zod";

const objectId = z.string().refine(
  (value) => mongoose.isValidObjectId(value),
  { message: "Invalid MongoDB ID" }
);

const labelsSchema = z.array(
  z.string().trim().min(1).max(30)
).max(10).refine(
  (labels) => new Set(labels.map((label) => label.toLowerCase())).size === labels.length,
  { message: "Labels must be unique." }
);

export const createIssueSchema = z.object({
  project: objectId,
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(20000).optional().default(""),
  type: z.enum(["bug", "task"]).default("task"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  labels: labelsSchema.optional().default([]),
  assignee: objectId.nullable().optional().default(null),
}).strict();

export const updateIssueSchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  description: z.string().trim().max(20000).optional(),
  type: z.enum(["bug", "task"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  labels: labelsSchema.optional(),
  assignee: objectId.nullable().optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Provide at least one field to update." }
);

export const issueParamsSchema = z.object({
  issueId: objectId,
});

export const projectIssueParamsSchema = z.object({
  projectId: objectId,
});

const optionalEnum = (values) => z.enum(values).optional();

export const issueQuerySchema = z.object({
  status: optionalEnum(["open", "in_progress", "in_review", "closed"]),
  priority: optionalEnum(["low", "medium", "high", "urgent"]),
  assignee: objectId.optional(),
  label: z.string().trim().min(1).max(30).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["createdAt", "updatedAt", "title", "priority", "status"]).default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
}).strict();


export const changeIssueStatusSchema = z.object({
  status: z.enum(["open", "in_progress", "in_review", "closed"]),
}).strict();
