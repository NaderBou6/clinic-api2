import { api } from "./axios";

export async function fetchDoctors({ search = "", signal } = {}) {
  const res = await api.get("/doctors", {
    params: { search: search || undefined },
    signal,
  });
  return res.data;
}
