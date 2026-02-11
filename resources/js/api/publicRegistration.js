import { api } from "./axios";

export async function submitRemoteRegistration(payload) {
  const res = await api.post("/public/self-registration", payload);
  return res.data;
}
