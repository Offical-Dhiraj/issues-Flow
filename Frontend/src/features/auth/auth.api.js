
import api from "../../lib/api";

export async function registerUser(userData) {
  const response = await api.post("/auth/register", userData);
  return response.data.data.user;
}

export async function loginUser(credentials) {
  const response = await api.post("/auth/login", credentials);
  return response.data.data.user;
}

export async function getCurrentUser() {
  const response = await api.get("/auth/me");
  return response.data.data.user;
}

export async function logoutUser() {
  await api.post("/auth/logout");
}
