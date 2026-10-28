
import mongoose from "mongoose";

const issueHistorySchema = new mongoose.Schema(
  {
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Issue",
      required: true,
      immutable: true,
    },

    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },

    field: {
      type: String,
      required: true,
      enum: [
        "title",
        "description",
        "type",
        "priority",
        "status",
        "labels",
        "assignee",
      ],
    },

    from: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    to: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

issueHistorySchema.index({ issue: 1, createdAt: 1, _id: 1 });

const IssueHistory = mongoose.model("IssueHistory", issueHistorySchema);

export default IssueHistory;
