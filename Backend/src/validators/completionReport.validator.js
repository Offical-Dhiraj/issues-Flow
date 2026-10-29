
import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid ID format.");

export const completionReportParamsSchema = z.object({
  issueId: objectIdSchema,
});

export const reviewCompletionReportParamsSchema = z.object({
  issueId: objectIdSchema,
  reportId: objectIdSchema,
});

export const createCompletionReportSchema = z.object({
  summary: z
    .string()
    .trim()
    .min(10, "Summary must contain at least 10 characters.")
    .max(5000, "Summary cannot exceed 5000 characters."),

  testingNotes: z
    .string()
    .trim()
    .max(5000, "Testing notes cannot exceed 5000 characters.")
    .optional()
    .default(""),
});

export const reviewCompletionReportSchema = z
  .object({
    decision: z.enum(
      ["approve", "request_changes"],
      {
        error: "Decision must be approve or request_changes.",
      }
    ),

    reviewComment: z
      .string()
      .trim()
      .max(3000, "Review comment cannot exceed 3000 characters.")
      .optional()
      .default(""),
  })
  .superRefine((data, ctx) => {
    if (
      data.decision === "request_changes" &&
      data.reviewComment.length < 3
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["reviewComment"],
        message:
          "Please explain the requested changes in at least 3 characters.",
      });
    }
  });
