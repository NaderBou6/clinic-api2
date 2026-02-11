import { api } from "./axios";

export async function createAppointment(payload) {
  const res = await api.post("/appointments", payload);
  return res.data;
}
