import { api } from "./axios";

export async function fetchTodayQueue({ status = "waiting", page = 1, per_page = 10, signal } = {}) {
  const res = await api.get("/queue/today", {
    params: { status, page, per_page },
    signal,
  });
  return res.data;
}

export async function fetchPublicQueueSummary({ signal } = {}) {
  const res = await api.get("/public/queue/today", { signal });
  return res.data;
}

export async function addToQueue(patientId) {
  const res = await api.post("/queue/add", { patient_id: patientId });
  return res.data;
}

export async function cancelQueueEntry(entryId) {
  const res = await api.post(`/queue/${entryId}/cancel`);
  return res.data;
}

export async function prioritizeQueueEntry(entryId) {
  const res = await api.post(`/queue/${entryId}/priority`);
  return res.data;
}

export async function nextQueue() {
  const res = await api.post("/queue/next");
  return res.data;
}
