
import api from "../../lib/api";

function extractProjects(payload) {
  // Support common Express response formats.
  const candidates = [
    payload?.data?.projects,
    payload?.projects,
    payload?.data,
    payload,
  ];

  const projects = candidates.find(Array.isArray);

  if (projects) return projects;

  throw new Error("The projects API returned an unexpected response.");
}

function extractProject(payload) {
  return (
    payload?.data?.project ??
    payload?.project ??
    payload?.data ??
    payload
  );
}

export async function getProjects() {
  const response = await api.get("/projects");
  return extractProjects(response.data);
}

export async function createProject(projectData) {
  const response = await api.post("/projects", projectData);
  return extractProject(response.data);
}
