import { api } from "./axios";

export async function startConsultationFromQueue(entryId) {
  const res = await api.post(`/doctor/queue/${entryId}/start-consultation`);
  return res.data;
}

export async function setDoctorConsultationPrice(consultationId, { is_free, price_cents }) {
  const res = await api.post(`/doctor/consultations/${consultationId}/set-price`, {
    is_free,
    price_cents,
  });
  return res.data;
}

export async function cancelDoctorConsultation(consultationId) {
  const res = await api.post(`/doctor/consultations/${consultationId}/cancel`);
  return res.data;
}
