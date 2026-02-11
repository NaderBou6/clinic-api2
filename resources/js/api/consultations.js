import { api } from "./axios";

export async function createConsultation(payload) {
  const res = await api.post("/consultations", payload);
  return res.data;
}

export async function setConsultationPrice(consultationId, price_cents) {
  const res = await api.post(`/consultations/${consultationId}/set-price`, { price_cents });
  return res.data;
}

export async function fetchPatientConsultationHistory(patientId, { exclude_consultation_id, signal } = {}) {
  const res = await api.get(`/patients/${patientId}/consultations`, {
    params: { exclude_consultation_id },
    signal,
  });
  return res.data;
}
