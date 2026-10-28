
import mongoose from "mongoose";
import Project from "../models/Project.js";
import User from "../models/User.js";

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function isMember(project, userId) {
  return project.members.some(
    (member) => member._id
      ? member._id.toString() === userId
      : member.toString() === userId
  );
}

function isOwner(project, userId) {
  const ownerId = project.owner._id
    ? project.owner._id.toString()
    : project.owner.toString();

  return ownerId === userId;
}

export async function createProject(userId, input) {
  const project = await Project.create({
    ...input,
    owner: userId,
    members: [userId],
  });

  return Project.findById(project._id)
    .populate("owner", "name email")
    .populate("members", "name email");
}

export async function listMyProjects(userId) {
  return Project.find({ members: userId })
    .populate("owner", "name email")
    .populate("members", "name email")
    .sort({ updatedAt: -1 })
    .lean();
}

export async function getProject(userId, projectId) {
  const project = await Project.findById(projectId)
    .populate("owner", "name email")
    .populate("members", "name email");

  if (!project) {
    throw httpError(404, "Project not found.");
  }

  if (!isMember(project, userId)) {
    throw httpError(403, "You do not have access to this project.");
  }

  return project;
}

export async function updateProject(userId, projectId, input) {
  const project = await Project.findById(projectId);

  if (!project) {
    throw httpError(404, "Project not found.");
  }

  if (!isOwner(project, userId)) {
    throw httpError(403, "Only the project owner can update this project.");
  }

  Object.assign(project, input);
  await project.save();

  return Project.findById(projectId)
    .populate("owner", "name email")
    .populate("members", "name email");
}

export async function addProjectMember(userId, projectId, newMemberId) {
  const project = await Project.findById(projectId);

  if (!project) {
    throw httpError(404, "Project not found.");
  }

  if (!isOwner(project, userId)) {
    throw httpError(403, "Only the project owner can add members.");
  }

  if (!mongoose.isValidObjectId(newMemberId)) {
    throw httpError(400, "Invalid member ID.");
  }

  const userExists = await User.exists({ _id: newMemberId });

  if (!userExists) {
    throw httpError(404, "User not found.");
  }

  const alreadyMember = project.members.some(
    (member) => member.toString() === newMemberId
  );

  if (alreadyMember) {
    throw httpError(409, "User is already a project member.");
  }

  // Atomic membership update prevents duplicate additions.
  const updatedProject = await Project.findOneAndUpdate(
    {
      _id: projectId,
      owner: userId,
      members: { $ne: newMemberId },
    },
    { $addToSet: { members: newMemberId } },
    { new: true, runValidators: true }
  )
    .populate("owner", "name email")
    .populate("members", "name email");

  if (!updatedProject) {
    throw httpError(409, "Project membership changed. Please retry.");
  }

  return updatedProject;
}
