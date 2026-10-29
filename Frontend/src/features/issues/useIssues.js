
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  changeIssueStatus,
  createIssue,
  getIssues,
  updateIssue,
} from "./issue.api";

export function useIssues(filters = {}) {
  return useQuery({
    queryKey: ["issues", filters],
    queryFn: () => getIssues(filters),
    enabled: Boolean(filters.projectId),
    retry: false,
  });
}

export function useCreateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createIssue,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["issues"] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ issueId, changes }) =>
      updateIssue(issueId, changes),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });
}

export function useChangeIssueStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ issueId, status }) =>
      changeIssueStatus(issueId, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });
}
