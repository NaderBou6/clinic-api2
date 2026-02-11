import { api } from "./axios";

export async function fetchDoctorStats({ period = "day", start, end, doctor_id, signal } = {}) {
  const res = await api.get("/stats/doctor", {
    params: {
      period,
      start: start || undefined,
      end: end || undefined,
      doctor_id: doctor_id || undefined,
    },
    signal,
  });
  return res.data;
}
