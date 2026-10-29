import mongoose from "mongoose";

const completionReportSchema = new mongoose.Schema(
  {
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Issue",
      required: true,
      index: true,
    },

    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    summary: {
      type: String,
      required: [true, "Please describe the completed work."],
      trim: true,
      minlength: [10, "The summary must contain at least 10 characters."],
      maxlength: [5000, "The summary cannot exceed 5000 characters."],
    },

    testingNotes: {
      type: String,
      trim: true,
      maxlength: [5000, "Testing notes cannot exceed 5000 characters."],
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "changes_requested"],
      default: "pending",
      index: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewComment: {
      type: String,
      trim: true,
      maxlength: [3000, "Review feedback cannot exceed 3000 characters."],
      default: "",
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Efficiently retrieve reports for an issue in newest-first order.
completionReportSchema.index({
  issue: 1,
  createdAt: -1,
});

const CompletionReport = mongoose.model(
  "CompletionReport",
  completionReportSchema
);

export default CompletionReport;