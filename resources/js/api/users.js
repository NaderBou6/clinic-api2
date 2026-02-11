import { api } from "./axios";

export async function fetchNurseUsers({ signal } = {}) {
  const res = await api.get("/users/nurses", { signal });
  return res.data;
}
