
import {
  listIssueComments,
  createIssueComment,
} from "../services/comment.service.js";

export async function listIssueCommentsController(req, res) {
  const comments = await listIssueComments(
    req.user.id,
    req.params.issueId
  );

  return res.status(200).json({
    success: true,
    data: { comments },
  });
}

export async function createIssueCommentController(req, res) {
  const comment = await createIssueComment(
    req.user.id,
    req.params.issueId,
    req.body.body
  );

  return res.status(201).json({
    success: true,
    message: "Comment added successfully.",
    data: { comment },
  });
}
