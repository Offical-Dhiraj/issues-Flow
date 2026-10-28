
import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 160,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 20000,
      default: "",
    },

    type: {
      type: String,
      enum: ["bug", "task"],
      required: true,
      default: "task",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      required: true,
    },

    status: {
      type: String,
      enum: ["open", "in_progress", "in_review", "closed"],
      default: "open",
      required: true,
    },

    labels: {
      type: [
        {
          type: String,
          trim: true,
          minlength: 1,
          maxlength: 30,
        },
      ],
      default: [],
      validate: {
        validator: (labels) =>
          labels.length <= 10 &&
          new Set(labels.map((label) => label.toLowerCase())).size ===
            labels.length,
        message: "Labels must be unique and cannot exceed 10 items.",
      },
    },

    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
  timestamps: true,
  versionKey: "__v",
}
);

issueSchema.index({ project: 1, status: 1, updatedAt: -1 });
issueSchema.index({ project: 1, priority: 1, updatedAt: -1 });
issueSchema.index({ project: 1, assignee: 1, updatedAt: -1 });
issueSchema.index({ project: 1, labels: 1 });
issueSchema.index({ project: 1, createdAt: -1 });

const Issue = mongoose.model("Issue", issueSchema);

export default Issue;
