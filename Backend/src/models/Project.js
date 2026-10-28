
import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Supports efficient project listing by member and owner.
projectSchema.index({ members: 1, updatedAt: -1 });
projectSchema.index({ owner: 1, updatedAt: -1 });

projectSchema.pre("validate", function () {
  if (this.owner && !this.members.some(
    (member) => member.toString() === this.owner.toString()
  )) {
    this.members.push(this.owner);
  }
});

const Project = mongoose.model("Project", projectSchema);

export default Project;
